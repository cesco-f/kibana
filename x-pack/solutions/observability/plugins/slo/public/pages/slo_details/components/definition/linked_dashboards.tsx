/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { DASHBOARD_APP_LOCATOR } from '@kbn/deeplinks-analytics';
import React, { useMemo } from 'react';
import type { DashboardLocatorParams } from '@kbn/dashboard-plugin/common';
import type { ContentManagementPublicStart } from '@kbn/content-management-plugin/public';
import { useQuery } from '@tanstack/react-query';
import { i18n } from '@kbn/i18n';
import type { GetIn, GetResult } from '@kbn/content-management-plugin/common';
import type { SLODefinition } from '../../../../../server/domain/models';
import { useKibana } from '../../../../hooks/use_kibana';

interface Props {
  dashboards: NonNullable<NonNullable<SLODefinition['artifacts']>['dashboards']>;
}

const getDashboardsTitles = async (
  dashboardsIds: string[],
  contentManagement: ContentManagementPublicStart
): Promise<{ id: string; title: string }[]> => {
  if (dashboardsIds.length === 0) {
    return [];
  }

  return Promise.all(
    dashboardsIds.map(async (id) => {
      const res = await contentManagement.client.get<
        GetIn<'dashboard'>,
        GetResult<{ attributes: { title: string } }>
      >({
        contentTypeId: 'dashboard',
        id,
      });
      return { id, title: res.item.attributes.title };
    })
  );
};

export function LinkedDashboards({ dashboards }: Props) {
  const {
    services: { share },
    services: { contentManagement },
  } = useKibana();

  const dashboardLocator = share.url.locators.get<DashboardLocatorParams>(DASHBOARD_APP_LOCATOR);

  const dashboardsIds = useMemo(() => dashboards.map((dashboard) => dashboard.id), [dashboards]);

  const { data, isLoading } = useQuery({
    queryKey: ['SLO-dashboards', ...dashboardsIds],
    queryFn: () => getDashboardsTitles(dashboardsIds, contentManagement),
  });

  if (isLoading) {
    return <EuiLoadingSpinner size="m" />;
  }

  if (!data || data.length === 0) {
    return (
      <EuiText size="s">
        {i18n.translate('xpack.slo.sloDetails.overview.noDashboards', {
          defaultMessage: 'No linked dashboards',
        })}
      </EuiText>
    );
  }

  return (
    <EuiFlexGroup direction="column" gutterSize="xs">
      {data.map((dashboardAsset) => {
        return (
          <EuiFlexItem grow={false} key={dashboardAsset.id}>
            <EuiLink
              data-test-subj="dashboardAssetLink"
              href={dashboardLocator?.getRedirectUrl({ dashboardId: dashboardAsset.id })}
              target="_blank"
            >
              {dashboardAsset.title}
            </EuiLink>
          </EuiFlexItem>
        );
      })}
    </EuiFlexGroup>
  );
}
