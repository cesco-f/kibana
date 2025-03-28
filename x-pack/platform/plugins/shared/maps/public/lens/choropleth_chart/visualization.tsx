/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import { dynamic } from '@kbn/shared-ux-utility';
import type { PaletteRegistry } from '@kbn/coloring';
import { ThemeServiceStart } from '@kbn/core/public';
import { layerTypes } from '@kbn/lens-plugin/public';
import type { OperationMetadata, SuggestionRequest, Visualization } from '@kbn/lens-plugin/public';
import { IconRegionMap } from '@kbn/chart-icons';
import { getSuggestionsLazy } from './suggestions_lazy';
import type { ChoroplethChartState } from './types';

const REGION_KEY_GROUP_ID = 'region_key';
const METRIC_GROUP_ID = 'metric';

const CHART_LABEL = i18n.translate('xpack.maps.lens.choropleth.label', {
  defaultMessage: 'Region map',
});

export const getVisualization = ({
  paletteService,
  theme,
}: {
  paletteService: PaletteRegistry;
  theme: ThemeServiceStart;
}): Visualization<ChoroplethChartState> => ({
  id: 'lnsChoropleth',

  getVisualizationTypeId() {
    return this.id;
  },
  visualizationTypes: [
    {
      id: 'lnsChoropleth',
      icon: IconRegionMap,
      label: CHART_LABEL,
      sortPriority: 10,
      description: i18n.translate('xpack.maps.regionMap.visualizationDescription', {
        defaultMessage: 'Show geographic data using colored regions.',
      }),
    },
  ],

  clearLayer(state) {
    const newState = { ...state };
    delete newState.emsLayerId;
    delete newState.emsField;
    delete newState.regionAccessor;
    delete newState.valueAccessor;
    return newState;
  },

  getLayerIds(state) {
    return [state.layerId];
  },

  getDescription() {
    return {
      icon: IconRegionMap,
      label: CHART_LABEL,
    };
  },

  getSuggestions(suggestionRequest: SuggestionRequest<ChoroplethChartState>) {
    return getSuggestionsLazy(suggestionRequest);
  },

  initialize(addNewLayer, state) {
    return (
      state || {
        layerId: addNewLayer(),
        layerType: layerTypes.DATA,
      }
    );
  },

  getConfiguration({ state }) {
    return {
      groups: [
        {
          groupId: REGION_KEY_GROUP_ID,
          groupLabel: i18n.translate('xpack.maps.lens.choroplethChart.regionKeyLabel', {
            defaultMessage: 'Region key',
          }),
          layerId: state.layerId,
          accessors: state.regionAccessor ? [{ columnId: state.regionAccessor }] : [],
          supportsMoreColumns: !state.regionAccessor,
          filterOperations: (op: OperationMetadata) => op.isBucketed && op.dataType === 'string',
          enableDimensionEditor: true,
          requiredMinDimensionCount: 1,
          dataTestSubj: 'lnsChoropleth_regionKeyDimensionPanel',
        },
        {
          groupId: METRIC_GROUP_ID,
          groupLabel: i18n.translate('xpack.maps.lens.choroplethChart.metricValueLabel', {
            defaultMessage: 'Metric',
          }),
          layerId: state.layerId,
          accessors: state.valueAccessor ? [{ columnId: state.valueAccessor }] : [],
          supportsMoreColumns: !state.valueAccessor,
          filterOperations: (op: OperationMetadata) => !op.isBucketed && op.dataType === 'number',
          enableDimensionEditor: true,
          isMetricDimension: true,
          requiredMinDimensionCount: 1,
          dataTestSubj: 'lnsChoropleth_valueDimensionPanel',
        },
      ],
    };
  },

  getSupportedLayers() {
    return [
      {
        type: layerTypes.DATA,
        label: i18n.translate('xpack.maps.lens.choroplethChart.addLayer', {
          defaultMessage: 'Add visualization layer',
        }),
      },
    ];
  },

  getLayerType(layerId, state) {
    if (state?.layerId === layerId) {
      return layerTypes.DATA;
    }
  },

  toExpression: (state, datasourceLayers, attributes, datasourceExpressionsByLayers = {}) => {
    if (!state.regionAccessor || !state.valueAccessor) {
      return null;
    }

    const datasourceExpression = datasourceExpressionsByLayers[state.layerId];
    return {
      type: 'expression',
      chain: [
        ...(datasourceExpression ? datasourceExpression.chain : []),
        {
          type: 'function',
          function: 'lens_choropleth_chart',
          arguments: {
            title: [attributes?.title || ''],
            layerId: [state.layerId],
            emsField: state.emsField ? [state.emsField] : [],
            emsLayerId: state.emsLayerId ? [state.emsLayerId] : [],
            regionAccessor: [state.regionAccessor],
            valueAccessor: [state.valueAccessor],
          },
        },
      ],
    };
  },

  toPreviewExpression: (state, datasourceLayers) => {
    return null;
  },

  setDimension({ columnId, groupId, prevState }) {
    const update: Partial<ChoroplethChartState> = {};
    if (groupId === REGION_KEY_GROUP_ID) {
      update.regionAccessor = columnId;
    } else if (groupId === METRIC_GROUP_ID) {
      update.valueAccessor = columnId;
    }
    return {
      ...prevState,
      ...update,
    };
  },

  removeDimension({ prevState, layerId, columnId }) {
    const update = { ...prevState };

    if (prevState.regionAccessor === columnId) {
      delete update.regionAccessor;
      delete update.emsLayerId;
      delete update.emsField;
    } else if (prevState.valueAccessor === columnId) {
      delete update.valueAccessor;
    }

    return update;
  },

  DimensionEditorComponent(props) {
    if (props.groupId === REGION_KEY_GROUP_ID) {
      const DimensionEditor = dynamic(async () => {
        const { RegionKeyEditor } = await import('./region_key_editor');
        return {
          default: RegionKeyEditor,
        };
      });
      return <DimensionEditor state={props.state} setState={props.setState} />;
    }
    return null;
  },
});
