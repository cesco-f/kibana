/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getSLOStatsOverviewParamsSchema } from '@kbn/slo-schema';
import { GetSLOStatsOverview } from '../../services/get_slo_stats_overview';
import { createSloServerRoute } from '../create_slo_server_route';
import { assertPlatinumLicense } from './utils/assert_platinum_license';
import { getSpaceId } from './utils/get_space_id';

export const getSLOStatsOverview = createSloServerRoute({
  endpoint: 'GET /internal/observability/slos/overview',
  options: { access: 'internal' },
  security: {
    authz: {
      requiredPrivileges: ['slo_read'],
    },
  },
  params: getSLOStatsOverviewParamsSchema,
  handler: async ({ context, params, request, logger, plugins }) => {
    await assertPlatinumLicense(plugins);

    const soClient = (await context.core).savedObjects.client;
    const esClient = (await context.core).elasticsearch.client.asCurrentUser;

    const ruleRegistry = await plugins.ruleRegistry.start();
    const racClient = await ruleRegistry.getRacClientWithRequest(request);

    const spaceId = await getSpaceId(plugins, request);

    const alerting = await plugins.alerting.start();
    const rulesClient = await alerting.getRulesClientWithRequest(request);

    const slosOverview = new GetSLOStatsOverview(
      soClient,
      esClient,
      spaceId,
      logger,
      rulesClient,
      racClient
    );

    return await slosOverview.execute(params?.query ?? {});
  },
});
