/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Indicator, Objective } from '@kbn/slo-schema';

interface SloListFilter {
  kqlQuery: string;
  page: number;
  perPage: number;
  sortBy: string;
  sortDirection: string;
  filters: string;
  lastRefresh?: number;
}

interface SloGroupListFilter {
  page: number;
  perPage: number;
  groupBy: string;
  kqlQuery: string;
  filters: string;
  lastRefresh?: number;
  groupsFilter?: string[];
}

interface SLOOverviewFilter {
  kqlQuery: string;
  filters: string;
  lastRefresh?: number;
}

export const sloKeys = {
  all: ['slo'] as const,
  lists: () => [...sloKeys.all, 'list'] as const,
  list: (filters: SloListFilter) => [...sloKeys.lists(), filters] as const,
  group: (filters: SloGroupListFilter) => [...sloKeys.groups(), filters] as const,
  groups: () => [...sloKeys.all, 'group'] as const,
  overview: (filters: SLOOverviewFilter) => ['overview', filters] as const,
  details: () => [...sloKeys.all, 'details'] as const,
  detail: (sloId: string, instanceId: string | undefined, remoteName: string | undefined) =>
    [...sloKeys.details(), { sloId, instanceId, remoteName }] as const,
  rules: () => [...sloKeys.all, 'rules'] as const,
  rule: (sloIds: string[]) => [...sloKeys.rules(), sloIds] as const,
  activeAlerts: () => [...sloKeys.all, 'activeAlerts'] as const,
  activeAlert: (sloIdsAndInstanceIds: Array<[string, string]>) =>
    [...sloKeys.activeAlerts(), ...sloIdsAndInstanceIds.flat()] as const,
  historicalSummaries: () => [...sloKeys.all, 'historicalSummary'] as const,
  historicalSummary: (list: Array<{ sloId: string; instanceId: string }>) =>
    [...sloKeys.historicalSummaries(), list] as const,
  allDefinitions: () => [...sloKeys.all, 'definitions'],
  definitions: (params: {
    search: string;
    page: number;
    perPage: number;
    includeOutdatedOnly: boolean;
    validTags: string;
  }) => [...sloKeys.allDefinitions(), params],
  globalDiagnosis: () => [...sloKeys.all, 'globalDiagnosis'] as const,
  health: (list: Array<{ sloId: string; sloInstanceId: string }>) =>
    [...sloKeys.all, 'health', list] as const,
  burnRates: (
    sloId: string,
    instanceId: string | undefined,
    windows: Array<{ name: string; duration: string }>
  ) => [...sloKeys.all, 'burnRates', sloId, instanceId, windows] as const,
  preview: (params: {
    remoteName?: string;
    groupings?: Record<string, string | number>;
    objective?: Objective;
    indicator: Indicator;
    range: {
      from: Date;
      to: Date;
    };
    groupBy?: string[];
  }) => [...sloKeys.all, 'preview', params] as const,
  burnRateRules: (search: string) => [...sloKeys.all, 'burnRateRules', search],
  groupings: (params: {
    sloId: string;
    instanceId: string;
    groupingKey: string;
    search?: string;
    afterKey?: string;
    excludeStale?: boolean;
    remoteName?: string;
  }) => [...sloKeys.all, 'fetch_slo_groupings', params] as const,
  bulkDeleteStatus: (taskId: string) => [...sloKeys.all, 'bulkDeleteStatus', taskId] as const,
};

export type SloKeys = typeof sloKeys;
