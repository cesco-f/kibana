/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useState } from 'react';
import { EuiMarkdownEditor, EuiTitle, EuiSpacer, EuiFlexGroup, EuiButtonIcon } from '@elastic/eui';
import type { System } from '@kbn/streams-schema';
import { i18n } from '@kbn/i18n';
import type { Condition } from '@kbn/streamlang';
import { EditableConditionPanel } from '../../shared/condition_display';

export const SystemDetailExpanded = ({
  system,
  setSystems,
}: {
  system: System;
  setSystems: React.Dispatch<React.SetStateAction<System[]>>;
}) => {
  const [isEditingCondition, setIsEditingCondition] = useState(false);
  const toggleIsEditingCondition = () => {
    setIsEditingCondition((v) => !v);
  };

  const setSystem = (updated: System) => {
    setSystems((prev) => prev.map((s) => (s.name === updated.name ? updated : s)));
  };

  const handleConditionChange = (newFilter: Condition) => {
    setSystem({ ...system, filter: newFilter });
  };

  const handleDescriptionChange = (newDescription: string) => {
    setSystem({ ...system, description: newDescription });
  };

  return (
    <EuiFlexGroup direction="column">
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
        value={system.description}
        onChange={handleDescriptionChange}
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
          condition={system.filter}
          isEditingCondition={isEditingCondition}
          setCondition={handleConditionChange}
        />
      </EuiFlexGroup>
    </EuiFlexGroup>
  );
};
