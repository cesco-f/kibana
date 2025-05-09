/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */
import React, { Fragment } from 'react';
import { snakeCase } from 'lodash';
import {
  AnnotationDomainType,
  CustomAnnotationTooltip,
  LineAnnotation,
  Position,
  RectAnnotation,
} from '@elastic/charts';
import moment from 'moment';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiPanel,
  EuiSpacer,
  EuiTitle,
  UseEuiTheme,
} from '@elastic/eui';
import type {
  EventAnnotationOutput,
  ManualPointEventAnnotationArgs,
  ManualRangeEventAnnotationRow,
} from '@kbn/event-annotation-plugin/common';
import type { FieldFormat, FormatFactory } from '@kbn/field-formats-plugin/common';
import { defaultAnnotationColor, defaultAnnotationRangeColor } from '@kbn/event-annotation-common';
import { Datatable, DatatableColumn, DatatableRow } from '@kbn/expressions-plugin/common';
import { PointEventAnnotationRow } from '@kbn/event-annotation-plugin/common/manual_event_annotation/types';
import { FormattedMessage } from '@kbn/i18n-react';
import { css } from '@emotion/react';
import type { MergedAnnotation } from '../../common';
import { AnnotationIcon, hasIcon, Marker, MarkerBody } from '../helpers';
import { mapVerticalToHorizontalPlacement, LINES_MARKER_SIZE } from '../helpers';

export interface AnnotationsProps {
  groupedLineAnnotations: MergedAnnotation[];
  rangeAnnotations: ManualRangeEventAnnotationRow[];
  timeFormat?: string;
  isHorizontal: boolean;
  paddingMap: Partial<Record<Position, number>>;
  simpleView?: boolean;
  minInterval?: number;
  isBarChart?: boolean;
  outsideDimension: number;
}

const TooltipAnnotationDetails = ({
  row,
  extraFields,
}: {
  row: PointEventAnnotationRow;
  extraFields: Array<{
    key: string;
    name: string;
    formatter: FieldFormat | undefined;
  }>;
}) => {
  return extraFields.length > 0 ? (
    <div css={styles.tooltipExtraFields}>
      {extraFields.map((field) => (
        <EuiFlexGroup gutterSize="s" key={`${field.key}-${field.name}`}>
          <EuiFlexItem css={styles.tooltipExtraFieldsKey}>{field.name}:</EuiFlexItem>
          <EuiFlexItem css={styles.tooltipExtraFieldsValue}>
            {field.formatter ? field.formatter.convert(row[field.key]) : row[field.key]}
          </EuiFlexItem>
        </EuiFlexGroup>
      ))}
    </div>
  ) : null;
};

const getExtraFields = (
  row: PointEventAnnotationRow,
  formatFactory: FormatFactory,
  columns: DatatableColumn[] | undefined
) => {
  return Object.keys(row)
    .filter((key) => key.startsWith('field:'))
    .map((key) => {
      const columnFormatter = columns?.find((c) => c.id === key)?.meta?.params;
      return {
        key,
        name: key.replace('field:', ''),
        formatter: columnFormatter && formatFactory(columnFormatter),
      };
    });
};

const DISPLAYED_COUNT_OF_ROWS = 5;

const createCustomTooltip =
  (
    rows: PointEventAnnotationRow[],
    formatFactory: FormatFactory,
    columns: DatatableColumn[] | undefined,
    timeFormat: string
  ): CustomAnnotationTooltip =>
  () => {
    const lastElement = rows[rows.length - 1];
    const skippedCountFromRequest = lastElement.skippedCount || 0;
    const displayedSkippedCount =
      rows.length > DISPLAYED_COUNT_OF_ROWS ? rows.length - DISPLAYED_COUNT_OF_ROWS : 0;
    const skippedCount = skippedCountFromRequest + displayedSkippedCount;

    return (
      <EuiPanel
        color="plain"
        hasShadow={false}
        hasBorder={false}
        paddingSize="none"
        borderRadius="none"
        css={styles.tooltip}
      >
        <div css={styles.tooltipRows}>
          {rows.slice(0, DISPLAYED_COUNT_OF_ROWS).map((row, index) => {
            const extraFields = getExtraFields(row, formatFactory, columns);

            return (
              <Fragment key={row.time}>
                {index > 0 && (
                  <>
                    <EuiSpacer size="xs" />
                    <EuiHorizontalRule margin="none" />
                    <EuiSpacer size="xs" />
                  </>
                )}
                <div css={styles.tooltipRow}>
                  <EuiFlexGroup gutterSize="xs">
                    <EuiFlexItem grow={false}>
                      <AnnotationIcon
                        type={hasIcon(row.icon) ? row.icon : 'empty'}
                        color={row.color}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiTitle size="xxxs">
                        <h6>{row.label}</h6>
                      </EuiTitle>
                      <EuiFlexItem>{moment(row.time).format(timeFormat)}</EuiFlexItem>
                      <TooltipAnnotationDetails
                        key={snakeCase(row.time)}
                        row={row}
                        extraFields={extraFields}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </div>
              </Fragment>
            );
          })}
        </div>
        {skippedCount ? (
          <div css={styles.tooltipSkippedCount}>
            <EuiSpacer size="xs" />
            <EuiHorizontalRule margin="none" />
            <EuiSpacer size="xs" />
            <div css={styles.tooltipRow}>
              <FormattedMessage
                id="expressionXY.annotations.skippedCount"
                defaultMessage="+{value} more…"
                values={{ value: skippedCount }}
              />
            </div>
          </div>
        ) : null}
      </EuiPanel>
    );
  };

function getCommonProperty<T, K extends keyof ManualPointEventAnnotationArgs>(
  configArr: ManualPointEventAnnotationArgs[],
  propertyName: K,
  fallbackValue: T
) {
  const firstStyle = configArr[0][propertyName];
  if (configArr.every((config) => firstStyle === config[propertyName])) {
    return firstStyle;
  }
  return fallbackValue;
}

const getCommonStyles = (configArr: ManualPointEventAnnotationArgs[]) => {
  return {
    color: getCommonProperty<ManualPointEventAnnotationArgs['color'], 'color'>(
      configArr,
      'color',
      defaultAnnotationColor
    ),
    lineWidth: getCommonProperty(configArr, 'lineWidth', 1),
    lineStyle: getCommonProperty(configArr, 'lineStyle', 'solid'),
    textVisibility: getCommonProperty(configArr, 'textVisibility', false),
  };
};

export const isRangeAnnotation = (row: DatatableRow): row is ManualRangeEventAnnotationRow =>
  'type' in row && row.type === 'range';

export const getRangeAnnotations = (datatable: Datatable) =>
  datatable.rows.filter(
    (row): row is ManualRangeEventAnnotationRow => 'type' in row && row.type === 'range'
  );

export const OUTSIDE_RECT_ANNOTATION_WIDTH = 8;
export const OUTSIDE_RECT_ANNOTATION_WIDTH_SUGGESTION = 2;

export const getAnnotationsGroupedByInterval = (
  annotations: PointEventAnnotationRow[],
  configs: EventAnnotationOutput[] | undefined,
  columns: DatatableColumn[] | undefined,
  formatFactory: FormatFactory,
  timeFormat: string
) => {
  const visibleGroupedConfigs = annotations.reduce<Record<string, PointEventAnnotationRow[]>>(
    (acc, current) => {
      const timebucket = moment(current.timebucket).valueOf();
      return {
        ...acc,
        [timebucket]: acc[timebucket] ? [...acc[timebucket], current] : [current],
      };
    },
    {}
  );
  return Object.entries(visibleGroupedConfigs).map(([timebucket, rowsPerBucket]) => {
    const firstRow = rowsPerBucket[0];

    const config = configs?.find((c) => c.id === firstRow.id);
    const textField = config && 'textField' in config && config?.textField;
    const columnFormatter = columns?.find((c) => c.id === `field:${textField}`)?.meta?.params;
    const formatter = columnFormatter && formatFactory(columnFormatter);
    const label =
      textField && formatter && `field:${textField}` in firstRow
        ? formatter.convert(firstRow[`field:${textField}`])
        : firstRow.label;
    const mergedAnnotation: MergedAnnotation = {
      ...firstRow,
      label,
      icon: firstRow.icon || 'triangle',
      timebucket: Number(timebucket),
      position: 'bottom',
      customTooltip: createCustomTooltip(rowsPerBucket, formatFactory, columns, timeFormat),
      isGrouped: false,
    };
    if (rowsPerBucket.length > 1) {
      const commonStyles = getCommonStyles(rowsPerBucket);
      return {
        ...mergedAnnotation,
        ...commonStyles,
        label: '',
        isGrouped: true,
        icon: String(rowsPerBucket.length),
      };
    }
    return mergedAnnotation;
  });
};

// todo: remove when closed https://github.com/elastic/elastic-charts/issues/1647
RectAnnotation.displayName = 'RectAnnotation';

export const Annotations = ({
  groupedLineAnnotations,
  rangeAnnotations,
  timeFormat,
  isHorizontal,
  paddingMap,
  simpleView,
  minInterval,
  isBarChart,
  outsideDimension,
}: AnnotationsProps) => {
  return (
    <>
      {groupedLineAnnotations.map((annotation) => {
        const markerPositionVertical = Position.Top;
        const hasReducedPadding = paddingMap[markerPositionVertical] === LINES_MARKER_SIZE;
        const { timebucket, time, isGrouped, id: configId } = annotation;
        const strokeWidth = simpleView ? 1 : annotation.lineWidth || 1;
        const id = snakeCase(`${configId}-${time}`);
        const markerBodyLabel =
          !simpleView && !isGrouped && annotation.textVisibility && !hasReducedPadding
            ? annotation.label
            : undefined;
        return (
          <LineAnnotation
            id={id}
            key={id}
            domainType={AnnotationDomainType.XDomain}
            marker={
              !simpleView ? (
                <Marker
                  {...{
                    config: annotation,
                    isHorizontal: !isHorizontal,
                    hasReducedPadding,
                    label: !isGrouped ? annotation.label : undefined,
                    rotateClassName: isHorizontal ? 'xyAnnotationIcon_rotate90' : undefined,
                  }}
                />
              ) : undefined
            }
            markerBody={
              markerBodyLabel ? (
                <MarkerBody label={markerBodyLabel} isHorizontal={!isHorizontal} />
              ) : undefined
            }
            markerPosition={
              isHorizontal
                ? mapVerticalToHorizontalPlacement(markerPositionVertical)
                : markerPositionVertical
            }
            dataValues={[
              {
                dataValue: isGrouped
                  ? moment(
                      isBarChart && minInterval ? timebucket + minInterval / 2 : timebucket
                    ).valueOf()
                  : moment(time).valueOf(),
                details: annotation.label,
              },
            ]}
            customTooltip={annotation.customTooltip}
            placement="bottom"
            style={{
              line: {
                strokeWidth,
                stroke: annotation.color || defaultAnnotationColor,
                dash:
                  annotation.lineStyle === 'dashed'
                    ? [strokeWidth * 3, strokeWidth]
                    : annotation.lineStyle === 'dotted'
                    ? [strokeWidth, strokeWidth]
                    : undefined,
                opacity: 1,
              },
            }}
          />
        );
      })}
      {rangeAnnotations.map(({ id, label, time, color, endTime, outside }) => {
        return (
          <RectAnnotation
            id={id}
            key={id}
            customTooltip={() => (
              <EuiPanel
                color="plain"
                hasShadow={false}
                hasBorder={false}
                paddingSize="none"
                borderRadius="none"
                css={styles.tooltip}
              >
                <div css={styles.tooltipRow}>
                  <EuiFlexGroup gutterSize="xs">
                    <EuiFlexItem grow={false}>
                      <EuiIcon type="stopFilled" color={color} />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiTitle size="xxxs">
                        <h6>{label}</h6>
                      </EuiTitle>
                      <EuiFlexItem>{`${moment(time).format(timeFormat)} — ${moment(endTime).format(
                        timeFormat
                      )}`}</EuiFlexItem>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </div>
              </EuiPanel>
            )}
            dataValues={[
              {
                coordinates: {
                  x0: moment(time).valueOf(),
                  x1: moment(endTime).valueOf(),
                },
                details: label,
              },
            ]}
            style={{ fill: color || defaultAnnotationRangeColor, opacity: 1 }}
            outside={Boolean(outside)}
            outsideDimension={outsideDimension}
          />
        );
      })}
    </>
  );
};

const styles = {
  tooltip: css({
    borderRadius: '0 !important',
  }),
  tooltipRows: css({
    // maxHeight: '60vh',
    overflowY: 'hidden',
  }),
  tooltipRow: ({ euiTheme }: UseEuiTheme) =>
    css({
      fontWeight: euiTheme.font.weight.regular,
      padding: `${euiTheme.size.s} ${euiTheme.size.m} ${euiTheme.size.s} ${euiTheme.size.s}`,
      borderRadius: '0 !important',
    }),
  tooltipExtraFields: ({ euiTheme }: UseEuiTheme) =>
    css({
      color: euiTheme.colors.darkShade,
      marginTop: euiTheme.size.s,
    }),
  tooltipExtraFieldsKey: css({
    overflowWrap: 'anywhere',
    hyphens: 'auto',
  }),
  tooltipExtraFieldsValue: css({
    textAlign: 'right',
    overflowWrap: 'anywhere',
    hyphens: 'auto',
  }),
  tooltipSkippedCount: ({ euiTheme }: UseEuiTheme) =>
    css({
      position: 'relative',
      textAlign: 'right',
      fontWeight: euiTheme.font.weight.regular,
    }),
};
