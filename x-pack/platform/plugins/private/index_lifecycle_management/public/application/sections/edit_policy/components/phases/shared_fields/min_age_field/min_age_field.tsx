/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { FunctionComponent, useEffect } from 'react';
import { get } from 'lodash';

import {
  EuiFieldNumber,
  EuiFieldNumberProps,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSelect,
  EuiText,
  EuiIconTip,
} from '@elastic/eui';

import { PhaseWithTiming } from '../../../../../../../../common/types';
import { getFieldValidityAndErrorMessage, useFormData } from '../../../../../../../shared_imports';
import { UseField, useConfiguration, useGlobalFields } from '../../../../form';
import { getPhaseMinAgeInMilliseconds } from '../../../../lib';
import { timeUnits } from '../../../../constants';
import { getUnitsAriaLabelForPhase, getTimingLabelForPhase } from './util';
import { i18nTexts } from '../../../../i18n_texts';

interface Props {
  phase: PhaseWithTiming;
}

export const MinAgeField: FunctionComponent<Props> = ({ phase }): React.ReactElement => {
  const minAgeValuePath = `phases.${phase}.min_age`;
  const minAgeUnitPath = `_meta.${phase}.minAgeUnit`;

  const { isUsingRollover } = useConfiguration();
  const globalFields = useGlobalFields();

  const { setValue: setMillisecondValue } =
    globalFields[`${phase}MinAgeMilliSeconds` as 'coldMinAgeMilliSeconds'];
  const [formData] = useFormData({ watch: [minAgeValuePath, minAgeUnitPath] });
  const minAgeValue = get(formData, minAgeValuePath);
  const minAgeUnit = get(formData, minAgeUnitPath);

  useEffect(() => {
    // Whenever the min_age value of the field OR the min_age unit
    // changes, we update the corresponding millisecond global field for the phase
    if (minAgeValue === undefined) {
      return;
    }

    const milliseconds =
      minAgeValue.trim() === '' ? -1 : getPhaseMinAgeInMilliseconds(minAgeValue, minAgeUnit);

    setMillisecondValue(milliseconds);
  }, [minAgeValue, minAgeUnit, setMillisecondValue]);

  useEffect(() => {
    return () => {
      // When unmounting (meaning we have disabled the phase), we remove
      // the millisecond value so the next time we enable the phase it will
      // be updated and trigger the validation
      setMillisecondValue(-1);
    };
  }, [setMillisecondValue]);

  return (
    <UseField path={minAgeValuePath}>
      {(field) => {
        const { isInvalid, errorMessage } = getFieldValidityAndErrorMessage(field);
        return (
          <EuiFormRow fullWidth isInvalid={isInvalid} error={errorMessage}>
            <EuiFlexGroup
              gutterSize={'s'}
              alignItems={'center'}
              justifyContent={'spaceBetween'}
              wrap
            >
              <EuiFlexItem grow={false}>
                <EuiText className={'eui-textNoWrap'} size={'xs'}>
                  {`${i18nTexts.editPolicy.minAgeLabel}:`}
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={true}>
                <EuiFlexGroup gutterSize={'s'}>
                  <EuiFlexItem grow={false}>
                    <EuiFieldNumber
                      style={{ minWidth: 50 }}
                      compressed
                      aria-label={getTimingLabelForPhase(phase)}
                      isInvalid={isInvalid}
                      value={field.value as EuiFieldNumberProps['value']}
                      onChange={field.onChange}
                      isLoading={field.isValidating}
                      data-test-subj={`${phase}-selectedMinimumAge`}
                      min={0}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem grow={true} style={{ minWidth: 165 }}>
                    <UseField path={minAgeUnitPath}>
                      {(unitField) => {
                        const { isInvalid: isUnitFieldInvalid } =
                          getFieldValidityAndErrorMessage(unitField);
                        const icon = (
                          <>
                            {/* This element is rendered for testing purposes only */}
                            <div data-test-subj={`${phase}-rolloverMinAgeInputIconTip`} />
                            <EuiIconTip
                              type="info"
                              aria-label={i18nTexts.editPolicy.rolloverToolTipDescription}
                              content={i18nTexts.editPolicy.rolloverToolTipDescription}
                            />
                          </>
                        );
                        const selectAppendValue: Array<string | React.ReactElement> =
                          isUsingRollover
                            ? [i18nTexts.editPolicy.minAgeUnitFieldSuffix, icon]
                            : [i18nTexts.editPolicy.minAgeUnitFieldSuffix];
                        const unitValue = unitField.value as string;

                        let unitOptions = timeUnits;
                        // if current unit is no longer supported as a valid time unit (e.g. nanos, micros, millis or seconds),
                        // add it back to correctly display the current state
                        if (unitValue && !unitOptions.some((unit) => unit.value === unitValue)) {
                          unitOptions = [...timeUnits, { value: unitValue, text: unitValue }];
                        }

                        return (
                          <EuiSelect
                            compressed
                            value={unitValue}
                            onChange={(e) => {
                              unitField.setValue(e.target.value);
                            }}
                            isInvalid={isUnitFieldInvalid}
                            append={selectAppendValue}
                            data-test-subj={`${phase}-selectedMinimumAgeUnits`}
                            aria-label={getUnitsAriaLabelForPhase(phase)}
                            options={unitOptions}
                          />
                        );
                      }}
                    </UseField>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFormRow>
        );
      }}
    </UseField>
  );
};
