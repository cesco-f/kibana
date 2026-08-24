/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import { ruleSavedObjectAttributesSchema as ruleSavedObjectAttributesSchemaV3 } from './v3';

/**
 * v4 adds the optional `project_routing` field: the Cross-Project Search (CPS)
 * scope for the rule's user-data queries. Absent means "space" (today's
 * default behaviour), so no backfill is needed and existing rules are
 * unaffected. Not indexed — nothing queries, filters, sorts, or aggregates on
 * this field.
 */
export const ruleSavedObjectAttributesSchema = ruleSavedObjectAttributesSchemaV3.extends({
  project_routing: schema.maybe(
    schema.oneOf([schema.literal('space'), schema.literal('all'), schema.literal('origin')])
  ),
});
