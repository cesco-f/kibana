/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ReactNode } from 'react';
import React, { useState, useCallback, useMemo } from 'react';
import type { EuiBasicTableColumn } from '@elastic/eui';
import { EuiBasicTable, EuiButtonIcon, EuiScreenReaderOnly } from '@elastic/eui';
import { v4 as uuidv4 } from 'uuid';
import { type Streams, type System } from '@kbn/streams-schema';
import { i18n } from '@kbn/i18n';
import { ConditionPanel } from '../../shared';
import { SystemEventsSparkline } from './system_events_sparkline';
import { SystemDetailExpanded } from './system_detail_expanded';
import { TableTitle } from './table_title';

export function StreamSystemsTable({
  definition,
  systems,
  selectedSystemNames,
  setSelectedSystemNames,
  setSystems,
}: {
  definition: Streams.all.Definition;
  systems: System[];
  selectedSystemNames: Set<string>;
  setSelectedSystemNames: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSystems: React.Dispatch<React.SetStateAction<System[]>>;
}) {
  const [expandedSystemNames, setExpandedSystemNames] = useState<Set<string>>(new Set());

  const itemIdToExpandedRowMap = useMemo(() => {
    const map: Record<string, ReactNode> = {};
    systems.forEach((s) => {
      if (expandedSystemNames.has(s.name)) {
        map[s.name] = <SystemDetailExpanded system={s} setSystems={setSystems} />;
      }
    });
    return map;
  }, [expandedSystemNames, systems, setSystems]);

  const selectedSystems = useMemo(() => {
    return systems.filter((s) => selectedSystemNames.has(s.name));
  }, [systems, selectedSystemNames]);

  const onSelectionChange = useCallback(
    (newSelectedSystems: System[]) => {
      setSelectedSystemNames(new Set(newSelectedSystems.map((s) => s.name)));
    },
    [setSelectedSystemNames]
  );

  const columns: Array<EuiBasicTableColumn<System>> = [
    {
      field: 'name',
      name: i18n.translate('xpack.streams.streamSystemsTable.columns.title', {
        defaultMessage: 'Title',
      }),
      width: '15%',
      sortable: true,
      truncateText: true,
    },
    {
      field: 'description',
      name: i18n.translate('xpack.streams.streamSystemsTable.columns.description', {
        defaultMessage: 'Description',
      }),
      width: '30%',
      truncateText: {
        lines: 4,
      },
    },
    {
      field: 'filter',
      name: i18n.translate('xpack.streams.streamSystemsTable.columns.filter', {
        defaultMessage: 'Filter',
      }),
      width: '25%',
      render: (filter: System['filter']) => {
        return <ConditionPanel condition={filter} />;
      },
    },
    {
      name: i18n.translate('xpack.streams.streamSystemsTable.columns.eventsLast24Hours', {
        defaultMessage: 'Events (last 24 hours)',
      }),
      width: '20%',
      render: (system: System) => {
        return <SystemEventsSparkline system={system} definition={definition} />;
      },
    },
    {
      name: 'Actions',
      width: '5%',
      actions: [
        {
          name: i18n.translate('xpack.streams.streamSystemsTable.columns.actions.cloneActionName', {
            defaultMessage: 'Clone',
          }),
          description: i18n.translate(
            'xpack.streams.streamSystemsTable.columns.actions.cloneActionDescription',
            { defaultMessage: 'Clone this system' }
          ),
          type: 'icon',
          icon: 'copy',
          onClick: (system) => {
            setSystems((prev) => prev.concat({ ...system, name: `${system.name}-${uuidv4()}` }));
          },
        },
        {
          name: i18n.translate('xpack.streams.streamSystemsTable.columns.actions.editActionName', {
            defaultMessage: 'Edit',
          }),
          description: i18n.translate(
            'xpack.streams.streamSystemsTable.columns.actions.editActionDescription',
            { defaultMessage: 'Edit this system' }
          ),
          type: 'icon',
          icon: 'pencil',
          onClick: (system) => {
            setExpandedSystemNames((prev) => new Set(prev).add(system.name));
          },
        },
        {
          name: i18n.translate(
            'xpack.streams.streamSystemsTable.columns.actions.deleteActionName',
            {
              defaultMessage: 'Delete',
            }
          ),
          description: i18n.translate(
            'xpack.streams.streamSystemsTable.columns.actions.deleteActionDescription',
            { defaultMessage: 'Delete this system' }
          ),
          type: 'icon',
          icon: 'trash',
          onClick: (system) => {
            setSystems(systems.filter((selectedSystem) => selectedSystem.name !== system.name));
            setSelectedSystemNames(
              new Set(
                Array.from(selectedSystemNames).filter(
                  (selectedSystemName) => selectedSystemName !== system.name
                )
              )
            );
            setExpandedSystemNames((prev) => {
              const next = new Set(prev);
              next.delete(system.name);
              return next;
            });
          },
        },
      ],
    },
  ];

  const toggleDetails = useCallback((system: System) => {
    setExpandedSystemNames((prev) => {
      const next = new Set(prev);
      if (next.has(system.name)) {
        next.delete(system.name);
      } else {
        next.add(system.name);
      }
      return next;
    });
  }, []);

  const columnsWithExpandingRowToggle: Array<EuiBasicTableColumn<System>> = [
    {
      align: 'right',
      width: '40px',
      isExpander: true,
      name: (
        <EuiScreenReaderOnly>
          <span>
            {i18n.translate('xpack.streams.streamSystemsTable.columns.expand', {
              defaultMessage: 'Expand row',
            })}
          </span>
        </EuiScreenReaderOnly>
      ),
      mobileOptions: { header: false },
      render: (system: System) => {
        const isExpanded = expandedSystemNames.has(system.name);

        return (
          <EuiButtonIcon
            onClick={() => toggleDetails(system)}
            aria-label={
              isExpanded
                ? i18n.translate('xpack.streams.streamSystemsTable.columns.collapseDetails', {
                    defaultMessage: 'Collapse details',
                  })
                : i18n.translate('xpack.streams.streamSystemsTable.columns.expandDetails', {
                    defaultMessage: 'Expand details',
                  })
            }
            iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
          />
        );
      },
    },
    ...columns,
  ];

  return (
    <>
      <TableTitle
        pageIndex={0}
        pageSize={10}
        total={systems.length}
        label={i18n.translate('xpack.streams.streamSystemsTable.tableTitle', {
          defaultMessage: 'Systems',
        })}
      />
      <EuiBasicTable
        tableCaption={i18n.translate('xpack.streams.streamSystemsTable.tableCaption', {
          defaultMessage: 'List of systems',
        })}
        items={systems}
        itemId="name"
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
        columns={columnsWithExpandingRowToggle}
        selection={{
          selected: selectedSystems,
          onSelectionChange,
        }}
      />
    </>
  );
}
