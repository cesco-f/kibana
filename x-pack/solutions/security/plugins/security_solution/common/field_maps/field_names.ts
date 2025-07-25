/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ALERT_NAMESPACE, ALERT_RULE_NAMESPACE, ALERT_RULE_PARAMETERS } from '@kbn/rule-data-utils';

export const ALERT_ANCESTORS = `${ALERT_NAMESPACE}.ancestors` as const;
export const ALERT_BUILDING_BLOCK_TYPE = `${ALERT_NAMESPACE}.building_block_type` as const;
export const ALERT_DEPTH = `${ALERT_NAMESPACE}.depth` as const;
export const ALERT_GROUP_ID = `${ALERT_NAMESPACE}.group.id` as const;
export const ALERT_GROUP_INDEX = `${ALERT_NAMESPACE}.group.index` as const;
export const ALERT_ORIGINAL_TIME = `${ALERT_NAMESPACE}.original_time` as const;
export const ALERT_THRESHOLD_RESULT = `${ALERT_NAMESPACE}.threshold_result` as const;
export const ALERT_THRESHOLD_RESULT_COUNT = `${ALERT_THRESHOLD_RESULT}.count` as const;
export const ALERT_NEW_TERMS = `${ALERT_NAMESPACE}.new_terms` as const;
export const ALERT_NEW_TERMS_FIELDS = `${ALERT_RULE_PARAMETERS}.new_terms_fields` as const;
/**
 * @deprecated Use {@link ALERT_HOST_CRITICALITY}
 */
export const LEGACY_ALERT_HOST_CRITICALITY = `${ALERT_NAMESPACE}.host.criticality_level` as const;
/**
 * @deprecated Use {@link ALERT_USER_CRITICALITY}
 */
export const LEGACY_ALERT_USER_CRITICALITY = `${ALERT_NAMESPACE}.user.criticality_level` as const;

export const ALERT_HOST_CRITICALITY = `host.asset.criticality` as const;
export const ALERT_USER_CRITICALITY = `user.asset.criticality` as const;
export const ALERT_SERVICE_CRITICALITY = `service.asset.criticality` as const;
export const ALERT_HOST_RISK_SCORE_CALCULATED_LEVEL = `host.risk.calculated_level` as const;
export const ALERT_HOST_RISK_SCORE_CALCULATED_SCORE_NORM =
  `host.risk.calculated_score_norm` as const;
export const ALERT_USER_RISK_SCORE_CALCULATED_LEVEL = `user.risk.calculated_level` as const;
export const ALERT_USER_RISK_SCORE_CALCULATED_SCORE_NORM =
  `user.risk.calculated_score_norm` as const;
export const ALERT_SERVICE_RISK_SCORE_CALCULATED_LEVEL = `service.risk.calculated_level` as const;
export const ALERT_SERVICE_RISK_SCORE_CALCULATED_SCORE_NORM =
  `service.risk.calculated_score_norm` as const;

export const ALERT_ORIGINAL_EVENT = `${ALERT_NAMESPACE}.original_event` as const;
export const ALERT_ORIGINAL_EVENT_ACTION = `${ALERT_ORIGINAL_EVENT}.action` as const;
export const ALERT_ORIGINAL_EVENT_CATEGORY = `${ALERT_ORIGINAL_EVENT}.category` as const;
export const ALERT_ORIGINAL_EVENT_KIND = `${ALERT_ORIGINAL_EVENT}.kind` as const;
export const ALERT_ORIGINAL_EVENT_MODULE = `${ALERT_ORIGINAL_EVENT}.module` as const;

export const ALERT_ORIGINAL_DATA_STREAM = `${ALERT_NAMESPACE}.original_data_stream` as const;
export const ALERT_ORIGINAL_DATA_STREAM_DATASET = `${ALERT_ORIGINAL_DATA_STREAM}.dataset` as const;
export const ALERT_ORIGINAL_DATA_STREAM_NAMESPACE =
  `${ALERT_ORIGINAL_DATA_STREAM}.namespace` as const;
export const ALERT_ORIGINAL_DATA_STREAM_TYPE = `${ALERT_ORIGINAL_DATA_STREAM}.type` as const;

export const ALERT_RULE_ACTIONS = `${ALERT_RULE_NAMESPACE}.actions` as const;
export const ALERT_RULE_EXCEPTIONS_LIST = `${ALERT_RULE_NAMESPACE}.exceptions_list` as const;
export const ALERT_RULE_FALSE_POSITIVES = `${ALERT_RULE_NAMESPACE}.false_positives` as const;
export const ALERT_RULE_IMMUTABLE = `${ALERT_RULE_NAMESPACE}.immutable` as const;
export const ALERT_RULE_MAX_SIGNALS = `${ALERT_RULE_NAMESPACE}.max_signals` as const;
export const ALERT_RULE_META = `${ALERT_RULE_NAMESPACE}.meta` as const;
export const ALERT_RULE_RISK_SCORE_MAPPING = `${ALERT_RULE_NAMESPACE}.risk_score_mapping` as const;
export const ALERT_RULE_SEVERITY_MAPPING = `${ALERT_RULE_NAMESPACE}.severity_mapping` as const;
export const ALERT_RULE_THREAT = `${ALERT_RULE_NAMESPACE}.threat` as const;
export const ALERT_RULE_THROTTLE = `${ALERT_RULE_NAMESPACE}.throttle` as const;
export const ALERT_RULE_TIMELINE_ID = `${ALERT_RULE_NAMESPACE}.timeline_id` as const;
export const ALERT_RULE_TIMELINE_TITLE = `${ALERT_RULE_NAMESPACE}.timeline_title` as const;
export const ALERT_RULE_TIMESTAMP_OVERRIDE = `${ALERT_RULE_NAMESPACE}.timestamp_override` as const;
export const ALERT_RULE_INDICES = `${ALERT_RULE_NAMESPACE}.indices` as const;
