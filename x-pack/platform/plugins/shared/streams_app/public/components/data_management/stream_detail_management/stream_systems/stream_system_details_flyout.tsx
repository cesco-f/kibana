/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiMarkdownEditor,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import type { Streams, System } from '@kbn/streams-schema';
import { FormattedMessage } from '@kbn/i18n-react';
import { i18n } from '@kbn/i18n';
import { EditableConditionPanel } from '../../shared';
import { SystemEventsData } from './system_events_data';
import { useStreamSystemsApi } from '../../../../hooks/use_stream_systems_api';

export const StreamSystemDetailsFlyout = ({
  system,
  definition,
  closeFlyout,
}: {
  system: System;
  definition: Streams.all.Definition;
  closeFlyout: () => void;
}) => {
  const [systemDescription, setSystemDescription] = React.useState(system.description);
  const { upsertQuery } = useStreamSystemsApi(definition);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [systemFilter, setSystemFilter] = React.useState(system.filter);
  const [isEditingCondition, setIsEditingCondition] = React.useState(false);

  const toggleIsEditingCondition = () => {
    setIsEditingCondition((v) => !v);
  };

  const updateSystem = () => {
    setIsUpdating(true);
    upsertQuery(system.name, {
      description: systemDescription,
      filter: systemFilter,
    }).finally(() => {
      setIsUpdating(false);
      closeFlyout();
    });
  };

  return (
    <EuiFlyout
      ownFocus
      onClose={closeFlyout}
      hideCloseButton
      aria-label={i18n.translate('xpack.streams.systemDetails.flyoutAriaLabel', {
        defaultMessage: 'System details',
      })}
      size="m"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2>{system.name}</h2>
        </EuiTitle>
        <EuiSpacer size="s" />
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <div>
          <EuiTitle size="xs">
            <h3>
              {i18n.translate('xpack.streams.streamDetailView.systemDetailExpanded.description', {
                defaultMessage: 'Description',
              })}
            </h3>
          </EuiTitle>
          <EuiMarkdownEditor
            aria-label={i18n.translate(
              'xpack.streams.streamDetailView.systemDetailExpanded.markdownEditorAriaLabel',
              {
                defaultMessage: 'System description markdown editor',
              }
            )}
            value={systemDescription}
            onChange={setSystemDescription}
            height={400}
            readOnly={false}
            initialViewMode="viewing"
          />
          <EuiSpacer size="m" />
          <EuiFlexGroup direction="column" gutterSize="none">
            <EuiFlexGroup justifyContent="flexStart" gutterSize="xs" alignItems="center">
              <EuiTitle size="xs">
                <h3>
                  {i18n.translate('xpack.streams.streamDetailView.systemDetailExpanded.filter', {
                    defaultMessage: 'Filter',
                  })}
                </h3>
              </EuiTitle>
              <EuiButtonIcon
                iconType="pencil"
                onClick={toggleIsEditingCondition}
                aria-label={i18n.translate(
                  'xpack.streams.streamDetailView.systemDetailExpanded.filter.edit',
                  {
                    defaultMessage: 'Edit filter',
                  }
                )}
              />
            </EuiFlexGroup>
            <EditableConditionPanel
              condition={systemFilter}
              isEditingCondition={isEditingCondition}
              setCondition={setSystemFilter}
            />
          </EuiFlexGroup>
          <EuiSpacer size="m" />
          <SystemEventsData system={system} />
        </div>
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              isLoading={isUpdating}
              iconType="cross"
              onClick={closeFlyout}
              flush="left"
              aria-label={i18n.translate('xpack.streams.systemDetails.closeButtonAriaLabel', {
                defaultMessage: 'Close flyout',
              })}
            >
              <FormattedMessage
                id="xpack.streams.systemDetails.cancelButton"
                defaultMessage="Cancel"
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton isLoading={isUpdating} onClick={updateSystem} fill>
              <FormattedMessage
                id="xpack.streams.systemDetails.saveChanges"
                defaultMessage="Save changes"
              />
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};
