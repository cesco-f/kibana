/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { schema } from '@kbn/config-schema';
import type { SyntheticsRestApiRouteFactory } from '../types';
import { SYNTHETICS_API_URLS } from '../../../common/constants';

export const deletePackagePolicyRoute: SyntheticsRestApiRouteFactory = () => ({
  method: 'DELETE',
  path: SYNTHETICS_API_URLS.DELETE_PACKAGE_POLICY,
  validate: {
    params: schema.object({
      packagePolicyId: schema.string({ minLength: 1, maxLength: 1024 }),
    }),
  },
  handler: async ({ request, server, syntheticsEsClient, spaceId }): Promise<any> => {
    const { packagePolicyId } = request.params;

    const soClient = server.coreStart.savedObjects
      .getUnsafeInternalClient()
      .asScopedToNamespace(spaceId);

    const response = await server.fleet.packagePolicyService.delete(
      soClient,
      syntheticsEsClient.baseESClient,
      [packagePolicyId],
      {
        force: true,
      }
    );
    if (response?.[0].success) {
      return response;
    } else {
      throw new Error(response?.[0].body?.message);
    }
  },
});
