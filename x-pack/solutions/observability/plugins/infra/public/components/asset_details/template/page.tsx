/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect } from 'react';
import type { InventoryItemType } from '@kbn/metrics-data-access-plugin/common';
import { EuiLoadingSpinner } from '@elastic/eui';
import type { SupportedDataSources } from '../../../../common/metrics_sources/get_has_data';
import { useMetricsBreadcrumbs } from '../../../hooks/use_metrics_breadcrumbs';
import { useParentBreadcrumbResolver } from '../../../hooks/use_parent_breadcrumb_resolver';
import { useKibanaContextForPlugin } from '../../../hooks/use_kibana';
import { ASSET_DETAILS_PAGE_COMPONENT_NAME } from '../constants';
import { Content } from '../content/content';
import { useAssetDetailsRenderPropsContext } from '../hooks/use_asset_details_render_props';
import { useMetadataStateContext } from '../hooks/use_metadata_state';
import { usePageHeader } from '../hooks/use_page_header';
import { useTabSwitcherContext } from '../hooks/use_tab_switcher';
import type { ContentTemplateProps } from '../types';
import { getIntegrationsAvailable } from '../utils';
import { InfraPageTemplate } from '../../shared/templates/infra_page_template';
import { OnboardingFlow } from '../../shared/templates/no_data_config';
import { PageTitleWithPopover } from '../header/page_title_with_popover';

const DATA_SOURCE_PER_TYPE: Partial<Record<InventoryItemType, SupportedDataSources>> = {
  host: 'host',
};

export const Page = ({ tabs = [], links = [] }: ContentTemplateProps) => {
  const { loading } = useAssetDetailsRenderPropsContext();
  const { metadata, loading: metadataLoading } = useMetadataStateContext();
  const { rightSideItems, tabEntries, breadcrumbs: headerBreadcrumbs } = usePageHeader(tabs, links);
  const { asset } = useAssetDetailsRenderPropsContext();
  const trackOnlyOnce = React.useRef(false);
  const { activeTabId } = useTabSwitcherContext();
  const {
    services: { telemetry },
  } = useKibanaContextForPlugin();

  const parentBreadcrumbResolver = useParentBreadcrumbResolver();
  const breadcrumbOptions = parentBreadcrumbResolver.getBreadcrumbOptions(asset.type);
  useMetricsBreadcrumbs([
    {
      ...breadcrumbOptions.link,
      text: breadcrumbOptions.text,
    },
    {
      text: asset.name,
    },
  ]);

  useEffect(() => {
    if (trackOnlyOnce.current) {
      return;
    }
    if (!metadataLoading && metadata) {
      const integrations = getIntegrationsAvailable(metadata);
      const telemetryParams = {
        componentName: ASSET_DETAILS_PAGE_COMPONENT_NAME,
        assetType: asset.type,
        tabId: activeTabId,
      };

      telemetry.reportAssetDetailsPageViewed(
        integrations.length > 0
          ? {
              ...telemetryParams,
              integrations,
            }
          : telemetryParams
      );
      trackOnlyOnce.current = true;
    }
  }, [activeTabId, asset.type, metadata, metadataLoading, telemetry]);

  return (
    <InfraPageTemplate
      onboardingFlow={asset.type === 'host' ? OnboardingFlow.Hosts : OnboardingFlow.Infra}
      dataSourceAvailability={DATA_SOURCE_PER_TYPE[asset.type] || undefined}
      pageHeader={{
        pageTitle: loading ? (
          <EuiLoadingSpinner size="m" />
        ) : asset.type === 'host' ? (
          <PageTitleWithPopover name={asset.name} />
        ) : (
          asset.name
        ),
        tabs: tabEntries,
        rightSideItems,
        breadcrumbs: headerBreadcrumbs,
      }}
      data-component-name={ASSET_DETAILS_PAGE_COMPONENT_NAME}
      data-asset-type={asset.type}
    >
      <Content />
    </InfraPageTemplate>
  );
};
