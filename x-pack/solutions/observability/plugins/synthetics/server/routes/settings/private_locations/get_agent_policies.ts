/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ALL_SPACES_ID } from '@kbn/spaces-plugin/common/constants';
import type { AgentPolicyInfo } from '../../../../common/types';
import type { SyntheticsServerSetup } from '../../../types';
import type { SyntheticsRestApiRouteFactory } from '../../types';
import { SYNTHETICS_API_URLS } from '../../../../common/constants';
import { getAgentPolicyInfo } from './helpers';

export const getAgentPoliciesRoute: SyntheticsRestApiRouteFactory = () => ({
  method: 'GET',
  path: SYNTHETICS_API_URLS.AGENT_POLICIES,
  validate: {},
  handler: async ({ server, spaceId }): Promise<AgentPolicyInfo[]> => {
    return getAgentPoliciesAsInternalUser({ server, withAgentCount: true, spaceId });
  },
});

export const getAgentPoliciesAsInternalUser = async ({
  server,
  withAgentCount = false,
  spaceId,
}: {
  server: SyntheticsServerSetup;
  withAgentCount?: boolean;
  spaceId?: string;
}) => {
  const soClient = server.coreStart.savedObjects.createInternalRepository();
  const esClient = server.coreStart.elasticsearch.client.asInternalUser;

  const agentPolicies = await server.fleet?.agentPolicyService.list(soClient, {
    page: 1,
    perPage: 10000,
    sortField: 'name',
    sortOrder: 'asc',
    kuery: 'ingest-agent-policies.is_managed : false',
    esClient,
    withAgentCount,
    spaceId: spaceId || ALL_SPACES_ID,
  });

  return agentPolicies.items.map(getAgentPolicyInfo);
};
