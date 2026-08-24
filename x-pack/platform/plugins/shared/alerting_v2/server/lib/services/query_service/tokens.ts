/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { createToken } from '@kbn/core-di';
import type { RuleProjectRouting } from '@kbn/alerting-v2-schemas';
import type { QueryServiceContract } from './query_service';

/**
 * QueryService flavor that uses an Elasticsearch client scoped to the current request user:
 * `elasticsearch.client.asScoped(request).asCurrentUser`.
 * Requests stay scoped to the origin project.
 */
export const QueryServiceScopedToken = createToken<QueryServiceContract>(
  'alerting_v2.QueryServiceScoped'
);

/**
 * Builds a `QueryServiceContract` scoped to the current request user, with the CPS project
 * routing mapped from a rule's `project_routing` value (see `toRuleQueryAsScopedOptions`). Used
 * for rule-execution queries against user data (breach, recovery, no-data).
 *
 * The parameter is required — the rule is only known once `FetchRule` runs, so callers must pass
 * `rule.project_routing` explicitly rather than relying on a default that could be reused by
 * mistake for a rule with a different scope.
 */
export type QueryServiceForRuleQueryFactory = (
  projectRouting: RuleProjectRouting
) => QueryServiceContract;

export const QueryServiceForRuleQueryToken = createToken<QueryServiceForRuleQueryFactory>(
  'alerting_v2.QueryServiceForRuleQuery'
);

/**
 * QueryService flavor that uses the internal Kibana system user:
 * `elasticsearch.client.asInternalUser`
 */
export const QueryServiceInternalToken = createToken<QueryServiceContract>(
  'alerting_v2.QueryServiceInternal'
);
