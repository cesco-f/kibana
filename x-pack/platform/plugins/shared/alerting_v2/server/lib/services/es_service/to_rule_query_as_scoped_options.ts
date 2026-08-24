/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AsScopedOptions } from '@kbn/core-elasticsearch-server';
import { PROJECT_ROUTING_ALL, PROJECT_ROUTING_ORIGIN } from '@kbn/cps-server-utils';
import type { RuleProjectRouting } from '@kbn/alerting-v2-schemas';

/**
 * Maps a rule's `project_routing` value to the Cross-Project Search (CPS)
 * scope `asScoped` needs to apply it. Only affects requests when CPS is
 * enabled; ignored otherwise.
 */
export const toRuleQueryAsScopedOptions = (routing: RuleProjectRouting): AsScopedOptions => {
  switch (routing) {
    case 'space':
      return { projectRouting: 'space' };
    case 'all':
      return { projectRouting: 'expression', value: PROJECT_ROUTING_ALL };
    case 'origin':
      return { projectRouting: 'expression', value: PROJECT_ROUTING_ORIGIN };
    default: {
      const unhandled: never = routing;
      throw new Error(`Unhandled project routing: ${unhandled}`);
    }
  }
};
