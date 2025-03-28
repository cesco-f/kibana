/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

export const GET_STATUS_ROUTE = '/internal/search_indices/status';
export const GET_USER_PRIVILEGES_ROUTE = '/internal/search_indices/start_privileges/{indexName}';

export const POST_CREATE_INDEX_ROUTE = '/internal/search_indices/indices/create';

export const INDEX_DOCUMENT_ROUTE = '/internal/search_indices/{indexName}/documents/{id}';

export const SEARCH_DOCUMENTS_ROUTE = '/internal/search_indices/{indexName}/documents/search';

export const GET_ONBOARDING_TOKEN_ROUTE = '/internal/search_indices/onboarding_token';
