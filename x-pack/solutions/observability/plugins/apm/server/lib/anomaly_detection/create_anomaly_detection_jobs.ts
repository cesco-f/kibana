/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import Boom from '@hapi/boom';
import type { ElasticsearchClient, Logger } from '@kbn/core/server';
import { snakeCase } from 'lodash';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { ProcessorEvent } from '@kbn/observability-plugin/common';
import type { APMIndices } from '@kbn/apm-sources-access-plugin/server';
import type { ElasticsearchCapabilities } from '@kbn/core-elasticsearch-server';
import { ML_ERRORS } from '../../../common/anomaly_detection';
import { METRICSET_NAME, PROCESSOR_EVENT } from '../../../common/es_fields/apm';
import type { Environment } from '../../../common/environment_rt';
import { environmentQuery } from '../../../common/utils/environment_query';
import { withApmSpan } from '../../utils/with_apm_span';
import type { MlClient } from '../helpers/get_ml_client';
import { APM_ML_JOB_GROUP, ML_MODULE_ID_APM_TRANSACTION } from './constants';
import { getAnomalyDetectionJobs } from './get_anomaly_detection_jobs';

const DEFAULT_TIMEOUT = '60s';
const ENV_MAX_LENGTH = 40;

export async function createAnomalyDetectionJobs({
  mlClient,
  esClient,
  indices,
  environments,
  logger,
  esCapabilities,
}: {
  mlClient?: MlClient;
  esClient: ElasticsearchClient;
  indices: APMIndices;
  environments: Environment[];
  logger: Logger;
  esCapabilities: ElasticsearchCapabilities;
}) {
  if (!mlClient) {
    throw Boom.notImplemented(ML_ERRORS.ML_NOT_AVAILABLE);
  }

  const uniqueMlJobEnvs = await getUniqueMlJobEnvs(mlClient, environments, logger);
  if (uniqueMlJobEnvs.length === 0) {
    return [];
  }

  return withApmSpan('create_anomaly_detection_jobs', async () => {
    logger.debug(`Creating ML anomaly detection jobs for environments: [${uniqueMlJobEnvs}].`);
    const apmMetricIndex = indices.metric;
    const responses = [];
    const failedJobs = [];

    if (!esCapabilities.serverless) {
      // Waiting for the index is not enabled in serverless, this could potentially cause
      // problems when creating jobs in parallel
      try {
        await waitForIndexStatus(esClient, apmMetricIndex, 'yellow');
      } catch (err) {
        logger.warn(`Error waiting for ${apmMetricIndex} to turn yellow before creating ML jobs`);
      }
    }

    // Avoid the creation of multiple ml jobs in parallel
    // https://github.com/elastic/elasticsearch/issues/36271
    for (const environment of uniqueMlJobEnvs) {
      try {
        const response = await createAnomalyDetectionJob({
          mlClient,
          environment,
          apmMetricIndex,
        });
        if (response.jobs[0].success || !response.jobs[0].error) {
          responses.push(response);
        } else {
          failedJobs.push({ id: response.jobs[0].id, error: response.jobs[0].error });
        }
      } catch (e) {
        if (!e.id || !e.error) {
          throw e;
        }
        failedJobs.push({ id: e.id, error: e.error });
      }
    }

    const jobResponses = responses.flatMap((response) => response.jobs);

    if (failedJobs.length > 0) {
      throw new Error(`An error occurred while creating ML jobs: ${JSON.stringify(failedJobs)}`);
    }

    return jobResponses;
  });
}

async function createAnomalyDetectionJob({
  mlClient,
  environment,
  apmMetricIndex,
}: {
  mlClient: Required<MlClient>;
  environment: string;
  apmMetricIndex: string;
}) {
  return withApmSpan('create_anomaly_detection_job', async () => {
    const randomToken = uuidv4().substr(-4);
    const sanitizedEnvironment = snakeCase(environment).slice(0, ENV_MAX_LENGTH); // limit env name due to ML job ID length constraints (up to 64 chars in total)

    const anomalyDetectionJob = mlClient.modules.setup({
      moduleId: ML_MODULE_ID_APM_TRANSACTION,
      prefix: `${APM_ML_JOB_GROUP}-${sanitizedEnvironment}-${randomToken}-`,
      groups: [APM_ML_JOB_GROUP],
      indexPatternName: apmMetricIndex,
      applyToAllSpaces: true,
      start: moment().subtract(4, 'weeks').valueOf(),
      query: {
        bool: {
          filter: [
            { term: { [PROCESSOR_EVENT]: ProcessorEvent.metric } },
            { term: { [METRICSET_NAME]: 'transaction' } },
            ...environmentQuery(environment),
          ],
        },
      },
      startDatafeed: true,
      jobOverrides: [
        {
          custom_settings: {
            job_tags: {
              environment,
              // identifies this as an APM ML job & facilitates future migrations
              apm_ml_version: 3,
            },
          },
        },
      ],
    });

    return anomalyDetectionJob;
  });
}

async function getUniqueMlJobEnvs(mlClient: MlClient, environments: Environment[], logger: Logger) {
  // skip creation of duplicate ML jobs
  const jobs = await getAnomalyDetectionJobs(mlClient);
  const existingMlJobEnvs = jobs
    .filter((job) => job.version === 3)
    .map(({ environment }) => environment);

  const requestedExistingMlJobEnvs = environments.filter((env) => existingMlJobEnvs.includes(env));

  if (requestedExistingMlJobEnvs.length) {
    logger.warn(
      `Skipping creation of existing ML jobs for environments: [${requestedExistingMlJobEnvs}]}`
    );
  }

  return environments.filter((env) => !existingMlJobEnvs.includes(env));
}

async function waitForIndexStatus(
  esClient: ElasticsearchClient,
  index: string,
  waitForStatus: 'yellow' | 'green',
  timeout = DEFAULT_TIMEOUT
) {
  return await esClient.cluster.health(
    {
      index,
      wait_for_status: waitForStatus,
      timeout,
    },
    {
      retryOnTimeout: true,
      maxRetries: 3,
    }
  );
}
