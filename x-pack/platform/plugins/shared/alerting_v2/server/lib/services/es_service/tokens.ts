/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ElasticsearchClient } from '@kbn/core/server';
import { createToken } from '@kbn/core-di';

export const EsServiceInternalToken = createToken<ElasticsearchClient>(
  'alerting_v2.EsServiceInternal'
);

export const EsServiceScopedToken = createToken<ElasticsearchClient>('alerting_v2.EsServiceScoped');
