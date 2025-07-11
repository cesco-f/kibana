/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { uniq } from 'lodash';
import type { Query, AggregateQuery } from '@kbn/es-query';
import { isOfAggregateQueryType } from '@kbn/es-query';
import type { DataView } from '@kbn/data-views-plugin/public';
import type { SortOrder } from '@kbn/saved-search-plugin/public';
import { getSortArray } from '@kbn/discover-utils';
import type { DiscoverAppState } from '../discover_app_state_container';
import { createDataViewDataSource } from '../../../../../common/data_sources';

/**
 * Helper function to remove or adapt the currently selected columns/sort to be valid with the next
 * data view, returns a new state object
 */
export function getDataViewAppState(
  currentDataView: DataView,
  nextDataView: DataView,
  defaultColumns: string[],
  currentColumns: string[],
  currentSort: SortOrder[],
  modifyColumns: boolean = true,
  sortDirection: string = 'desc',
  query?: Query | AggregateQuery
): Partial<DiscoverAppState> {
  let columns = currentColumns || [];

  if (modifyColumns) {
    const currentUnknownColumns = columns.filter(
      (column) => !currentDataView.fields.getByName(column) && !defaultColumns.includes(column)
    );
    const currentColumnsRefreshed = uniq([...columns, ...defaultColumns]);
    columns = currentColumnsRefreshed.filter(
      (column) => nextDataView.fields.getByName(column) || currentUnknownColumns.includes(column)
    );
  }

  const isEsqlQuery = isOfAggregateQueryType(query);

  if (isEsqlQuery) {
    columns = [];
  }

  // when switching from an data view with timeField to an data view without timeField
  // filter out sorting by timeField in case it is set. data views without timeField don't
  // prepend this field in the table, so in legacy grid you would need to add this column to
  // remove sorting
  let nextSort = getSortArray(currentSort, nextDataView, isEsqlQuery).filter((value) => {
    return nextDataView.timeFieldName || value[0] !== currentDataView.timeFieldName;
  });

  if (nextDataView.isTimeBased() && !nextSort.length) {
    // set default sorting if it was not set
    nextSort = [[nextDataView.timeFieldName, sortDirection]];
  } else if (
    nextDataView.isTimeBased() &&
    currentDataView.isTimeBased() &&
    nextDataView.timeFieldName !== currentDataView.timeFieldName
  ) {
    // switch time fields
    nextSort = nextSort.map((cur) =>
      cur[0] === currentDataView.timeFieldName ? [nextDataView.timeFieldName, cur[1]] : cur
    );
  }

  return {
    dataSource: nextDataView.id
      ? createDataViewDataSource({ dataViewId: nextDataView.id })
      : undefined,
    columns,
    sort: nextSort,
  };
}
