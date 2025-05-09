/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ElasticsearchClient, Logger } from '@kbn/core/server';
import { Replacements } from '@kbn/elastic-assistant-common';
import { AnonymizationFieldResponse } from '@kbn/elastic-assistant-common/impl/schemas';

import { AnonymizedAlertsRetriever } from './anonymized_alerts_retriever';
import type { GraphState } from '../../types';

export const getRetrieveAnonymizedAlertsNode = ({
  alertsIndexPattern,
  anonymizationFields,
  esClient,
  logger,
  onNewReplacements,
  replacements,
  size,
}: {
  alertsIndexPattern?: string;
  anonymizationFields?: AnonymizationFieldResponse[];
  esClient: ElasticsearchClient;
  logger?: Logger;
  onNewReplacements?: (replacements: Replacements) => void;
  replacements?: Replacements;
  size?: number;
}): ((state: GraphState) => Promise<GraphState>) => {
  let localReplacements = { ...(replacements ?? {}) };
  const localOnNewReplacements = (newReplacements: Replacements) => {
    localReplacements = { ...localReplacements, ...newReplacements };

    onNewReplacements?.(localReplacements); // invoke the callback with the latest replacements
  };

  const retrieveAnonymizedAlerts = async (state: GraphState): Promise<GraphState> => {
    logger?.debug(() => '---RETRIEVE ANONYMIZED ALERTS---');

    const { end, filter, start } = state;

    const retriever = new AnonymizedAlertsRetriever({
      alertsIndexPattern,
      anonymizationFields,
      end,
      esClient,
      filter,
      onNewReplacements: localOnNewReplacements,
      replacements,
      size,
      start,
    });

    const documents = await retriever
      .withConfig({ runName: 'runAnonymizedAlertsRetriever' })
      .invoke('');

    return {
      ...state,
      anonymizedAlerts: documents,
      replacements: localReplacements,
    };
  };

  return retrieveAnonymizedAlerts;
};
