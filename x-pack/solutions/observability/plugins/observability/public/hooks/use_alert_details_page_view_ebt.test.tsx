/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { renderHook } from '@testing-library/react';
import { useAlertDetailsPageViewEbt } from './use_alert_details_page_view_ebt';
import { ALERT_DETAILS_PAGE_VIEW_EVENT_TYPE } from '../../common/constants';

jest.mock('../utils/kibana_react', () => ({
  useKibana: jest.fn(),
}));

import { useKibana } from '../utils/kibana_react';

describe('useAlertDetailsPageViewEbt', () => {
  const getServices = (reportEvent: jest.Mock) => ({ services: { analytics: { reportEvent } } });

  it('fires event when ruleType provided', () => {
    const reportEvent = jest.fn();
    (useKibana as jest.Mock).mockReturnValue(getServices(reportEvent));

    renderHook(() => useAlertDetailsPageViewEbt({ ruleType: 'logs.alert.document.count' }));

    expect(reportEvent).toHaveBeenCalledWith(ALERT_DETAILS_PAGE_VIEW_EVENT_TYPE, {
      rule_type: 'logs.alert.document.count',
    });
  });
});
