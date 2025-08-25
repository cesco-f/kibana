/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { EuiComboBoxOptionOption } from '@elastic/eui';
import { EuiComboBox } from '@elastic/eui';
import { debounce } from 'lodash';
import type { ContentManagementPublicStart } from '@kbn/content-management-plugin/public';
import { dashboardServiceProvider, type DashboardItem } from '../common/services/dashboard_service';

export const DashboardsCombobox = ({
  contentManagement,
  selectedDashboards,
  onChange,
  placeholder,
}: {
  contentManagement: ContentManagementPublicStart;
  selectedDashboards: { id: string }[];
  onChange: (selectedOptions: Array<EuiComboBoxOptionOption<string>>) => void;
  placeholder?: string;
}) => {
  const [dashboardList, setDashboardList] = useState<
    | {
        value: string;
        label: string;
      }[]
    | undefined
  >();
  const [searchValue, setSearchValue] = useState<string>('');
  const [isLoading, setLoading] = useState(false);

  const [internalSelectedDashboards, setInternalSelectedDashboards] = useState<
    Array<EuiComboBoxOptionOption<string>> | undefined
  >();

  const [isComboBoxOpen, setIsComboBoxOpen] = useState(false);

  const fetchDashboardTitles = useCallback(async () => {
    if (!selectedDashboards?.length || !contentManagement) {
      return;
    }

    try {
      const dashboardPromises = selectedDashboards.map(async ({ id }) => {
        try {
          const fetchedDashboard = await dashboardServiceProvider(contentManagement).fetchDashboard(
            id
          );

          // Only return the dashboard if it exists, fetch was successful, and has a title
          if (
            fetchedDashboard &&
            fetchedDashboard.status === 'success' &&
            fetchedDashboard.attributes?.title
          ) {
            return {
              label: fetchedDashboard.attributes.title,
              value: id,
            };
          }
          // Return null if dashboard doesn't have required data
          return null;
        } catch (dashboardError) {
          /**
           * Swallow the error that is thrown, since this just means the selected dashboard was deleted
           * Return null when dashboard fetch fails
           */
          return null;
        }
      });

      const results = await Promise.all(dashboardPromises);

      // Filter out null results and cast to the expected type
      const validDashboards = results.filter(Boolean) as Array<EuiComboBoxOptionOption<string>>;

      setInternalSelectedDashboards(validDashboards);
    } catch (error) {
      // Set empty array or handle the error appropriately
      setInternalSelectedDashboards([]);
    }
  }, [selectedDashboards, contentManagement]);

  useEffect(() => {
    fetchDashboardTitles();
  }, [fetchDashboardTitles]);

  const internalOnChange = (selectedOptions: Array<EuiComboBoxOptionOption<string>>) => {
    onChange(selectedOptions);
    setInternalSelectedDashboards(selectedOptions);
  };

  // Debounced search change handler to avoid excessive API calls
  // useMemo is used instead of useCallback to avoid an eslint warning about exhaustive dependencies
  const onSearchChange = useMemo(
    () =>
      debounce((value: string) => {
        setSearchValue(value);
      }, 300),
    []
  );

  const getDashboardItem = (dashboard: DashboardItem) => ({
    value: dashboard.id,
    label: dashboard.attributes.title,
  });

  const loadDashboards = useCallback(async () => {
    if (contentManagement) {
      setLoading(true);
      const dashboards = await dashboardServiceProvider(contentManagement)
        .fetchDashboards({ limit: 100, text: `${searchValue}*` })
        .catch(() => {});
      const dashboardOptions = (dashboards ?? []).map((dashboard: DashboardItem) =>
        getDashboardItem(dashboard)
      );
      setDashboardList(dashboardOptions);
      setLoading(false);
    }
  }, [contentManagement, searchValue]);

  useEffect(() => {
    if (isComboBoxOpen) {
      loadDashboards();
    }
  }, [isComboBoxOpen, loadDashboards]);

  // Only load dashboards when ComboBox is focused/opened
  const handleComboBoxFocus = useCallback(() => {
    if (!isComboBoxOpen) {
      setIsComboBoxOpen(true);
      loadDashboards();
    }
  }, [isComboBoxOpen, loadDashboards]);

  return (
    <EuiComboBox
      async
      isLoading={isLoading}
      fullWidth
      options={dashboardList}
      selectedOptions={internalSelectedDashboards}
      placeholder={placeholder}
      onChange={internalOnChange}
      onFocus={handleComboBoxFocus}
      onSearchChange={onSearchChange}
      data-test-subj="dashboardsCombobox"
    />
  );
};
