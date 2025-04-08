/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { OverviewStatusMetaData } from '../../../../common/runtime_types';
import { MetricItem } from '../../synthetics/components/monitors_page/overview/overview/metric_item/metric_item';

import { useMonitorList } from '../../synthetics/components/monitors_page/hooks/use_monitor_list';

export const MonitorMetrics = () => {
  const { syntheticsMonitors, loading } = useMonitorList();

  const monitor = loading ? null : syntheticsMonitors[0];

  return monitor ? (
    <MetricItem onClick={() => {}} monitor={monitor as unknown as OverviewStatusMetaData} />
  ) : null;
};
