/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { i18n } from '@kbn/i18n';
import React, { useMemo } from 'react';
import { EuiFilterButton, hexToRgb } from '@elastic/eui';
import styled from '@emotion/styled';
import { FieldValueSuggestions } from '@kbn/observability-shared-plugin/public';
import { useAppDataViewContext } from '../../hooks/use_app_data_view';
import { useSeriesFilters } from '../../hooks/use_series_filters';
import { SeriesUrl } from '../../types';
import { NestedFilterOpen } from './filter_expanded';

interface Props {
  value: string;
  field: string;
  allSelectedValues?: Array<string | number>;
  negate: boolean;
  nestedField?: string;
  seriesId: number;
  series: SeriesUrl;
  isNestedOpen: {
    value: string;
    negate: boolean;
  };
  setIsNestedOpen: (val: NestedFilterOpen) => void;
}

export function FilterValueButton({
  isNestedOpen,
  setIsNestedOpen,
  value,
  field,
  negate,
  seriesId,
  series,
  nestedField,
  allSelectedValues,
}: Props) {
  const { dataViews } = useAppDataViewContext(series.dataType);

  const { setFilter, removeFilter } = useSeriesFilters({ seriesId, series });

  const hasActiveFilters = (allSelectedValues ?? []).includes(value);

  const button = (
    <FilterButton
      hasActiveFilters={hasActiveFilters}
      color={negate ? 'danger' : 'primary'}
      onClick={() => {
        if (hasActiveFilters) {
          removeFilter({ field, value, negate });
        } else {
          setFilter({ field, value, negate });
        }
        if (!hasActiveFilters) {
          setIsNestedOpen({ value, negate });
        } else {
          setIsNestedOpen({ value: '', negate });
        }
      }}
    >
      {negate
        ? i18n.translate('xpack.exploratoryView.expView.filterValueButton.negate', {
            defaultMessage: 'Not {value}',
            values: { value },
          })
        : value}
    </FilterButton>
  );

  const onNestedChange = (valuesN?: string[]) => {
    (valuesN ?? []).forEach((valN) => {
      setFilter({ field: nestedField!, value: valN! });
    });
    setIsNestedOpen({ value: '', negate });
  };

  const forceOpenNested = isNestedOpen?.value === value && isNestedOpen.negate === negate;

  const filters = useMemo(() => {
    return [
      {
        term: {
          [field]: value,
        },
      },
    ];
  }, [field, value]);

  return nestedField && forceOpenNested ? (
    <FieldValueSuggestions
      button={button}
      label={i18n.translate(
        'xpack.exploratoryView.filterValueButton.fieldValueSuggestions.versionLabel',
        { defaultMessage: 'Version' }
      )}
      sourceField={nestedField}
      onChange={onNestedChange}
      filters={filters}
      forceOpen={forceOpenNested}
      anchorPosition="rightCenter"
      time={series.time}
      asCombobox={false}
      dataViewTitle={dataViews[series.dataType]?.title}
    />
  ) : (
    button
  );
}

const FilterButton = styled(EuiFilterButton)`
  background-color: rgba(
    ${(props) => {
      const color = props.hasActiveFilters
        ? props.color === 'danger'
          ? hexToRgb(props.theme.euiTheme.colors.danger)
          : hexToRgb(props.theme.euiTheme.colors.primary)
        : 'initial';
      return `${color[0]}, ${color[1]}, ${color[2]}, 0.1`;
    }}
  );
`;
