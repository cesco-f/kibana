/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { DefaultEmbeddableApi, ReactEmbeddableFactory } from '@kbn/embeddable-plugin/public';
import {
  initializeTitleManager,
  PublishesWritableTitle,
  PublishesTitle,
  SerializedTitles,
  HasEditCapabilities,
} from '@kbn/presentation-publishing';
import type { StartServicesAccessor } from '@kbn/core-lifecycle-browser';
import { SYNTHETICS_MONITOR_METRICS_EMBEDDABLE } from '../constants';
import { ClientPluginsStart } from '../../../plugin';
import { MonitorMetrics } from './monitor_metrics';
import { getSyntheticsAppProps } from '../../synthetics/render_app';
import { SyntheticsSharedContext } from '../../synthetics/contexts/synthetics_shared_context';

export type MonitorMetricsEmbeddableState = SerializedTitles;

export type StatusOverviewApi = DefaultEmbeddableApi<MonitorMetricsEmbeddableState> &
  PublishesWritableTitle &
  PublishesTitle &
  HasEditCapabilities;

export const getMonitorMetricsEmbeddableFactory = (
  getStartServices: StartServicesAccessor<ClientPluginsStart>
) => {
  const factory: ReactEmbeddableFactory<
    MonitorMetricsEmbeddableState,
    MonitorMetricsEmbeddableState,
    StatusOverviewApi
  > = {
    type: SYNTHETICS_MONITOR_METRICS_EMBEDDABLE,
    deserializeState: (state) => {
      return state.rawState as MonitorMetricsEmbeddableState;
    },
    buildEmbeddable: async (state, buildApi) => {
      // const [coreStart, pluginStart] = await getStartServices();

      const titleManager = initializeTitleManager(state);

      const api = buildApi(
        {
          ...titleManager.api,
          onEdit: async () => {},
          isEditingEnabled: () => false,
          getTypeDisplayName: () => '',
          serializeState: () => {
            return { rawState: titleManager.serialize() };
          },
        },
        titleManager.comparators
      );

      return {
        api,
        Component: () => {
          const props = getSyntheticsAppProps();

          return (
            <SyntheticsSharedContext {...props}>
              <MonitorMetrics />
            </SyntheticsSharedContext>
          );
        },
      };
    },
  };
  return factory;
};
