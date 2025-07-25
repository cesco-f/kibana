/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * Flyout component for viewing and editing job detector rules.
 */

import PropTypes from 'prop-types';
import React, { Component } from 'react';

import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCheckbox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { withKibana } from '@kbn/kibana-react-plugin/public';
import {
  ML_DETECTOR_RULE_ACTION,
  ML_DETECTOR_RULE_CONDITIONS_NOT_SUPPORTED_FUNCTIONS,
} from '@kbn/ml-anomaly-utils';

import { DetectorDescriptionList } from './components/detector_description_list';
import { ActionsSection } from './actions_section';
import { checkPermission } from '../../capabilities/check_capabilities';
import { ConditionsSection } from './conditions_section';
import { ScopeSection } from './scope_section';
import { SelectRuleAction } from './select_rule_action';
import {
  getNewRuleDefaults,
  getNewConditionDefaults,
  isValidRule,
  saveJobRule,
  deleteJobRule,
  addItemToFilter,
} from './utils';

import { getPartitioningFieldNames } from '../../../../common/util/job_utils';
import { mlJobServiceFactory } from '../../services/job_service';
import { toastNotificationServiceProvider } from '../../services/toast_notification_service';

class RuleEditorFlyoutUI extends Component {
  static propTypes = {
    setShowFunction: PropTypes.func.isRequired,
    unsetShowFunction: PropTypes.func.isRequired,
    selectedJob: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      anomaly: {},
      job: {},
      ruleIndex: -1,
      rule: getNewRuleDefaults(),
      skipModelUpdate: false,
      isConditionsEnabled: false,
      isScopeEnabled: false,
      filterListIds: [],
      isFlyoutVisible: false,
    };

    this.partitioningFieldNames = [];
    this.canGetFilters = checkPermission('canGetFilters');

    this.mlJobService = mlJobServiceFactory(props.kibana.services.mlServices.mlApi);
  }

  componentDidMount() {
    if (this.props.kibana.services.notifications) {
      this.toastNotificationService = toastNotificationServiceProvider(
        this.props.kibana.services.notifications.toasts
      );
      if (typeof this.props.setShowFunction === 'function') {
        this.props.setShowFunction(this.showFlyout);
      }
    }
  }

  componentWillUnmount() {
    if (typeof this.props.unsetShowFunction === 'function') {
      this.props.unsetShowFunction();
    }
  }

  showFlyout = (anomaly) => {
    let ruleIndex = -1;
    const job = this.props.selectedJob ?? this.mlJobService.getJob(anomaly.jobId);
    if (job === undefined) {
      // No details found for this job, display an error and
      // don't open the Flyout as no edits can be made without the job.
      const { toasts } = this.props.kibana.services.notifications;
      toasts.addDanger(
        i18n.translate(
          'xpack.ml.ruleEditor.ruleEditorFlyout.unableToConfigureRulesNotificationMesssage',
          {
            defaultMessage: 'Unable to configure job rules as no job found with ID {jobId}',
            values: { jobId: anomaly.jobId },
          }
        )
      );
      this.setState({
        job,
        isFlyoutVisible: false,
      });

      return;
    }

    this.partitioningFieldNames = getPartitioningFieldNames(job, anomaly.detectorIndex);

    // Check if any rules are configured for this detector.
    const detectorIndex = anomaly.detectorIndex;
    const detector = job.analysis_config.detectors[detectorIndex];
    if (detector.custom_rules === undefined) {
      ruleIndex = 0;
    }

    let isConditionsEnabled = false;
    if (ruleIndex === 0) {
      // Configuring the first rule for a detector.
      isConditionsEnabled = this.partitioningFieldNames.length === 0;
    }

    this.setState({
      anomaly,
      job,
      ruleIndex,
      isConditionsEnabled,
      isScopeEnabled: false,
      isFlyoutVisible: true,
    });

    if (this.partitioningFieldNames.length > 0 && this.canGetFilters) {
      // Load the current list of filters. These are used for configuring rule scope.
      this.props.kibana.services.mlServices.mlApi.filters
        .filters()
        .then((filters) => {
          const filterListIds = filters.map((filter) => filter.filter_id);
          this.setState({
            filterListIds,
          });
        })
        .catch((error) => {
          this.toastNotificationService.displayErrorToast(
            error,
            i18n.translate(
              'xpack.ml.ruleEditor.ruleEditorFlyout.errorWithLoadingFilterListsNotificationMesssage',
              {
                defaultMessage: 'Error loading the filter lists used in the job rule scope',
              }
            )
          );
        });
    }
  };

  closeFlyout = () => {
    this.setState({ isFlyoutVisible: false });
  };

  setEditRuleIndex = (ruleIndex) => {
    const detectorIndex = this.state.anomaly.detectorIndex;
    const detector = this.state.job.analysis_config.detectors[detectorIndex];
    const rules = detector.custom_rules;
    const rule =
      rules === undefined || ruleIndex >= rules.length ? getNewRuleDefaults() : rules[ruleIndex];

    const isConditionsEnabled =
      this.partitioningFieldNames.length === 0 ||
      (rule.conditions !== undefined && rule.conditions.length > 0);
    const isScopeEnabled = rule.scope !== undefined && Object.keys(rule.scope).length > 0;
    if (isScopeEnabled === true) {
      // Add 'enabled:true' to mark them as selected in the UI.
      Object.keys(rule.scope).forEach((field) => {
        rule.scope[field].enabled = true;
      });
    }

    this.setState({
      ruleIndex,
      rule,
      isConditionsEnabled,
      isScopeEnabled,
    });
  };

  onSkipResultChange = (e) => {
    const checked = e.target.checked;
    this.setState((prevState) => {
      const actions = [...prevState.rule.actions];
      const idx = actions.indexOf(ML_DETECTOR_RULE_ACTION.SKIP_RESULT);
      if (idx === -1 && checked) {
        actions.push(ML_DETECTOR_RULE_ACTION.SKIP_RESULT);
      } else if (idx > -1 && !checked) {
        actions.splice(idx, 1);
      }

      return {
        rule: { ...prevState.rule, actions },
      };
    });
  };

  onSkipModelUpdateChange = (e) => {
    const checked = e.target.checked;
    this.setState((prevState) => {
      const actions = [...prevState.rule.actions];
      const idx = actions.indexOf(ML_DETECTOR_RULE_ACTION.SKIP_MODEL_UPDATE);
      if (idx === -1 && checked) {
        actions.push(ML_DETECTOR_RULE_ACTION.SKIP_MODEL_UPDATE);
      } else if (idx > -1 && !checked) {
        actions.splice(idx, 1);
      }

      return {
        rule: { ...prevState.rule, actions },
      };
    });
  };

  onConditionsEnabledChange = (e) => {
    const isConditionsEnabled = e.target.checked;
    this.setState((prevState) => {
      let conditions;
      if (isConditionsEnabled === false) {
        // Clear any conditions that have been added.
        conditions = [];
      } else {
        // Add a default new condition.
        conditions = [getNewConditionDefaults()];
      }

      return {
        rule: { ...prevState.rule, conditions },
        isConditionsEnabled,
      };
    });
  };

  addCondition = () => {
    this.setState((prevState) => {
      const conditions = [...prevState.rule.conditions];
      conditions.push(getNewConditionDefaults());

      return {
        rule: { ...prevState.rule, conditions },
      };
    });
  };

  updateCondition = (index, appliesTo, operator, value) => {
    this.setState((prevState) => {
      const conditions = [...prevState.rule.conditions];
      if (index < conditions.length) {
        conditions[index] = {
          applies_to: appliesTo,
          operator,
          value,
        };
      }

      return {
        rule: { ...prevState.rule, conditions },
      };
    });
  };

  deleteCondition = (index) => {
    this.setState((prevState) => {
      const conditions = [...prevState.rule.conditions];
      if (index < conditions.length) {
        conditions.splice(index, 1);
      }

      return {
        rule: { ...prevState.rule, conditions },
      };
    });
  };

  onScopeEnabledChange = (e) => {
    const isScopeEnabled = e.target.checked;
    this.setState((prevState) => {
      const rule = { ...prevState.rule };
      if (isScopeEnabled === false) {
        // Clear scope property.
        delete rule.scope;
      }

      return {
        rule,
        isScopeEnabled,
      };
    });
  };

  updateScope = (fieldName, filterId, filterType, enabled) => {
    this.setState((prevState) => {
      let scope = { ...prevState.rule.scope };
      if (scope === undefined) {
        scope = {};
      }

      scope[fieldName] = {
        filter_id: filterId,
        filter_type: filterType,
        enabled,
      };

      return {
        rule: { ...prevState.rule, scope },
      };
    });
  };

  saveEdit = () => {
    const { rule, ruleIndex } = this.state;

    this.updateRuleAtIndex(ruleIndex, rule);
  };

  updateRuleAtIndex = (ruleIndex, editedRule) => {
    const mlJobService = this.mlJobService;
    const { toasts } = this.props.kibana.services.notifications;
    const { mlApi } = this.props.kibana.services.mlServices;
    const { job, anomaly } = this.state;

    const jobId = job.job_id;
    const detectorIndex = anomaly.detectorIndex;

    saveJobRule(mlJobService, job, detectorIndex, ruleIndex, editedRule, mlApi)
      .then((resp) => {
        if (resp.success) {
          toasts.add({
            title: i18n.translate(
              'xpack.ml.ruleEditor.ruleEditorFlyout.changesToJobDetectorRulesSavedNotificationMessageTitle',
              {
                defaultMessage: 'Changes to {jobId} detector rules saved',
                values: { jobId },
              }
            ),
            color: 'success',
            iconType: 'check',
            text: i18n.translate(
              'xpack.ml.ruleEditor.ruleEditorFlyout.changesToJobDetectorRulesSavedNotificationMessageDescription',
              {
                defaultMessage: 'Note that changes will take effect for new results only.',
              }
            ),
          });
          this.closeFlyout();
        } else {
          toasts.addDanger(
            i18n.translate(
              'xpack.ml.ruleEditor.ruleEditorFlyout.errorWithSavingChangesToJobDetectorRulesNotificationMessage',
              {
                defaultMessage: 'Error saving changes to {jobId} detector rules',
                values: { jobId },
              }
            )
          );
        }
      })
      .catch((error) => {
        this.toastNotificationService.displayErrorToast(
          error,
          i18n.translate(
            'xpack.ml.ruleEditor.ruleEditorFlyout.errorWithSavingChangesToJobDetectorRulesNotificationMessage',
            {
              defaultMessage: 'Error saving changes to {jobId} detector rules',
              values: { jobId },
            }
          )
        );
      });
  };

  deleteRuleAtIndex = (index) => {
    const mlJobService = this.mlJobService;
    const { toasts } = this.props.kibana.services.notifications;
    const { mlApi } = this.props.kibana.services.mlServices;
    const { job, anomaly } = this.state;
    const jobId = job.job_id;
    const detectorIndex = anomaly.detectorIndex;

    deleteJobRule(mlJobService, job, detectorIndex, index, mlApi)
      .then((resp) => {
        if (resp.success) {
          toasts.addSuccess(
            i18n.translate(
              'xpack.ml.ruleEditor.ruleEditorFlyout.ruleDeletedFromJobDetectorNotificationMessage',
              {
                defaultMessage: 'Rule deleted from {jobId} detector',
                values: { jobId },
              }
            )
          );
          const updatedJob = mlJobService.getJob(anomaly.jobId);
          const updatedDetector = updatedJob.analysis_config.detectors[detectorIndex];
          const updatedRules = updatedDetector.custom_rules;
          if (!updatedRules) {
            this.closeFlyout();
          } else {
            this.setState({ job: { ...updatedJob } });
          }
        } else {
          toasts.addDanger(
            i18n.translate(
              'xpack.ml.ruleEditor.ruleEditorFlyout.errorWithDeletingRuleFromJobDetectorNotificationMessage',
              {
                defaultMessage: 'Error deleting rule from {jobId} detector',
                values: { jobId },
              }
            )
          );
        }
      })
      .catch((error) => {
        this.toastNotificationService.displayErrorToast(
          error,
          i18n.translate(
            'xpack.ml.ruleEditor.ruleEditorFlyout.errorWithDeletingRuleFromJobDetectorNotificationMessage',
            {
              defaultMessage: 'Error deleting rule from {jobId} detector',
              values: { jobId },
            }
          )
        );
      });
  };

  addItemToFilterList = (item, filterId, closeFlyoutOnAdd) => {
    const { toasts } = this.props.kibana.services.notifications;
    const { mlApi } = this.props.kibana.services.mlServices;
    addItemToFilter(item, filterId, mlApi)
      .then(() => {
        if (closeFlyoutOnAdd === true) {
          toasts.add({
            title: i18n.translate(
              'xpack.ml.ruleEditor.ruleEditorFlyout.addedItemToFilterListNotificationMessageTitle',
              {
                defaultMessage: 'Added {item} to {filterId}',
                values: { item, filterId },
              }
            ),
            color: 'success',
            iconType: 'check',
            text: i18n.translate(
              'xpack.ml.ruleEditor.ruleEditorFlyout.addedItemToFilterListNotificationMessageDescription',
              {
                defaultMessage: 'Note that changes will take effect for new results only.',
              }
            ),
          });
          this.closeFlyout();
        }
      })
      .catch((error) => {
        this.toastNotificationService.displayErrorToast(
          error,
          i18n.translate(
            'xpack.ml.ruleEditor.ruleEditorFlyout.errorWithAddingItemToFilterListNotificationMessage',
            {
              defaultMessage: 'An error occurred adding {item} to filter {filterId}',
              values: { item, filterId },
            }
          )
        );
      });
  };

  render() {
    const docsUrl = this.props.kibana.services.docLinks?.links.ml.customRules;
    const {
      isFlyoutVisible,
      job,
      anomaly,
      ruleIndex,
      rule,
      filterListIds,
      isConditionsEnabled,
      isScopeEnabled,
    } = this.state;

    if (isFlyoutVisible === false) {
      return null;
    }

    let flyout;

    if (ruleIndex === -1) {
      flyout = (
        <EuiFlyout onClose={this.closeFlyout} aria-labelledby="flyoutTitle">
          <EuiFlyoutHeader hasBorder={true}>
            <EuiTitle size="m">
              <h1 id="flyoutTitle">
                <FormattedMessage
                  id="xpack.ml.ruleEditor.ruleEditorFlyout.editRulesTitle"
                  defaultMessage="Edit job rules"
                />
              </h1>
            </EuiTitle>
          </EuiFlyoutHeader>

          <EuiFlyoutBody>
            <SelectRuleAction
              job={job}
              anomaly={anomaly}
              setEditRuleIndex={this.setEditRuleIndex}
              updateRuleAtIndex={this.updateRuleAtIndex}
              deleteRuleAtIndex={this.deleteRuleAtIndex}
              addItemToFilterList={this.addItemToFilterList}
            />
          </EuiFlyoutBody>

          <EuiFlyoutFooter>
            <EuiFlexGroup justifyContent="spaceBetween">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty iconType="cross" onClick={this.closeFlyout} flush="left">
                  <FormattedMessage
                    id="xpack.ml.ruleEditor.ruleEditorFlyout.closeButtonLabel"
                    defaultMessage="Close"
                  />
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutFooter>
        </EuiFlyout>
      );
    } else {
      const detectorIndex = anomaly.detectorIndex;
      const detector = job.analysis_config.detectors[detectorIndex];
      const rules = detector.custom_rules;
      const isCreate = rules === undefined || ruleIndex >= rules.length;

      const hasPartitioningFields =
        this.partitioningFieldNames && this.partitioningFieldNames.length > 0;
      const conditionSupported =
        ML_DETECTOR_RULE_CONDITIONS_NOT_SUPPORTED_FUNCTIONS.indexOf(anomaly.source.function) === -1;
      const conditionsText = i18n.translate(
        'xpack.ml.ruleEditor.ruleEditorFlyout.conditionsDescription',
        {
          defaultMessage:
            'Add numeric conditions for when the job rule applies. Multiple conditions are combined using AND.',
        }
      );

      flyout = (
        <EuiFlyout
          data-test-subj="mlRuleEditorFlyout"
          onClose={this.closeFlyout}
          aria-labelledby="flyoutTitle"
        >
          <EuiFlyoutHeader hasBorder={true}>
            <EuiTitle size="m">
              <h1 id="flyoutTitle">
                {isCreate === true ? (
                  <FormattedMessage
                    id="xpack.ml.ruleEditor.ruleEditorFlyout.createRuleTitle"
                    defaultMessage="Create job rule"
                  />
                ) : (
                  <FormattedMessage
                    id="xpack.ml.ruleEditor.ruleEditorFlyout.editRuleTitle"
                    defaultMessage="Edit job rule"
                  />
                )}
              </h1>
            </EuiTitle>
          </EuiFlyoutHeader>

          <EuiFlyoutBody>
            <DetectorDescriptionList job={job} detector={detector} anomaly={anomaly} />
            <EuiSpacer size="m" />
            <EuiText>
              <p>
                <FormattedMessage
                  id="xpack.ml.ruleEditor.ruleEditorFlyout.rulesDescription"
                  defaultMessage="Job rules instruct anomaly detectors to change their behavior
                    based on domain-specific knowledge that you provide.
                    When you create a job rule, you can specify conditions, scope, and actions. When the conditions of a job rule are
                    satisfied, its actions are triggered. {learnMoreLink}"
                  values={{
                    learnMoreLink: (
                      <EuiLink href={docsUrl} target="_blank">
                        <FormattedMessage
                          id="xpack.ml.ruleEditor.ruleEditorFlyout.rulesDescription.learnMoreLinkText"
                          defaultMessage="Learn more"
                        />
                      </EuiLink>
                    ),
                  }}
                />
              </p>
            </EuiText>

            <EuiSpacer />

            <EuiTitle>
              <h2>
                <FormattedMessage
                  id="xpack.ml.ruleEditor.ruleEditorFlyout.actionTitle"
                  defaultMessage="Action"
                />
              </h2>
            </EuiTitle>
            <ActionsSection
              actions={rule.actions}
              onSkipResultChange={this.onSkipResultChange}
              onSkipModelUpdateChange={this.onSkipModelUpdateChange}
            />

            <EuiSpacer size="xl" />

            <EuiTitle>
              <h2>
                <FormattedMessage
                  id="xpack.ml.ruleEditor.ruleEditorFlyout.conditionsTitle"
                  defaultMessage="Conditions"
                />
              </h2>
            </EuiTitle>
            <EuiSpacer size="s" />
            {conditionSupported === true ? (
              <EuiCheckbox
                id="enable_conditions_checkbox"
                label={conditionsText}
                checked={isConditionsEnabled}
                onChange={this.onConditionsEnabledChange}
                disabled={!conditionSupported || !hasPartitioningFields}
              />
            ) : (
              <EuiCallOut
                title={
                  <FormattedMessage
                    id="xpack.ml.ruleEditor.ruleEditorFlyout.conditionsNotSupportedTitle"
                    defaultMessage="Conditions are not supported for detectors using the {functionName} function"
                    values={{ functionName: anomaly.source.function }}
                  />
                }
                iconType="info"
              />
            )}
            <EuiSpacer size="s" />
            <ConditionsSection
              isEnabled={isConditionsEnabled}
              conditions={rule.conditions}
              addCondition={this.addCondition}
              updateCondition={this.updateCondition}
              deleteCondition={this.deleteCondition}
            />

            <EuiSpacer size="xl" />

            <ScopeSection
              isEnabled={isScopeEnabled}
              onEnabledChange={this.onScopeEnabledChange}
              partitioningFieldNames={this.partitioningFieldNames}
              filterListIds={filterListIds}
              scope={rule.scope}
              updateScope={this.updateScope}
            />

            <EuiCallOut
              title={
                <FormattedMessage
                  id="xpack.ml.ruleEditor.ruleEditorFlyout.rerunJobTitle"
                  defaultMessage="Rerun job"
                />
              }
              color="warning"
              iconType="question"
            >
              <p>
                <FormattedMessage
                  id="xpack.ml.ruleEditor.ruleEditorFlyout.whenChangesTakeEffectDescription"
                  defaultMessage="Changes to job rules take effect for new results only."
                />
              </p>
              <p>
                <FormattedMessage
                  id="xpack.ml.ruleEditor.ruleEditorFlyout.howToApplyChangesToExistingResultsDescription"
                  defaultMessage="To apply these changes to existing results you must clone and rerun the job.
                  Note rerunning the job may take some time and should only be done once
                  you have completed all your changes to the rules for this job."
                />
              </p>
            </EuiCallOut>
          </EuiFlyoutBody>

          <EuiFlyoutFooter>
            <EuiFlexGroup justifyContent="spaceBetween">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty iconType="cross" onClick={this.closeFlyout} flush="left">
                  <FormattedMessage
                    id="xpack.ml.ruleEditor.ruleEditorFlyout.closeButtonLabel"
                    defaultMessage="Close"
                  />
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton onClick={this.saveEdit} isDisabled={!isValidRule(rule)} fill>
                  <FormattedMessage
                    id="xpack.ml.ruleEditor.ruleEditorFlyout.saveButtonLabel"
                    defaultMessage="Save"
                  />
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutFooter>
        </EuiFlyout>
      );
    }

    return <React.Fragment>{flyout}</React.Fragment>;
  }
}

export const RuleEditorFlyout = withKibana(RuleEditorFlyoutUI);
