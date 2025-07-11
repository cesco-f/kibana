/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V.
 * Licensed under the Elastic License 2.0.
 */

import expect from '@kbn/expect';
import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ getService }: FtrProviderContext) {
  const supertest = getService('supertestWithoutAuth');

  describe('Synthetics public test monitor API', () => {
    const path = (id: string) => `/api/synthetics/monitor/test/${id}`;
    const monitorPath = (id?: string) => `/api/synthetics/monitors${id ? `/${id}` : ''}`;

    let monitorId: string | undefined;

    afterEach(async () => {
      if (monitorId) {
        await supertest.delete(monitorPath(monitorId)).set('kbn-xsrf', 'true').expect(200);
        monitorId = undefined;
      }
    });

    it('returns 404 when monitor does not exist', async () => {
      await supertest.post(path('non-existent-monitor')).set('kbn-xsrf', 'true').expect(404);
    });

    it('triggers an existing monitor and returns expected payload', async () => {
      // 1. Create monitor
      const monitorPayload = {
        name: 'public-test-monitor',
        schedule: { number: 10, unit: 'm' },
        enabled: true,
        type: 'http',
        urls: 'https://example.com',
        locations: [
          {
            id: 'us_central',
            label: 'US Central',
            isServiceManaged: true,
          },
        ],
        origin: 'ui',
      };

      const createRes = await supertest
        .post(monitorPath())
        .query({ internal: true })
        .set('kbn-xsrf', 'true')
        .send(monitorPayload)
        .expect(200);

      monitorId = createRes.body.id ?? createRes.body.config_id ?? createRes.body._id;
      expect(monitorId).to.be.a('string');

      // 2. Trigger test via public API
      const triggerRes = await supertest.post(path(monitorId!)).set('kbn-xsrf', 'true').expect(200);

      // 3. Basic field assertions
      const expectedKeys = ['testRunId', 'schedule', 'locations', 'configId', 'monitor'];
      expectedKeys.forEach((k) => expect(triggerRes.body).to.have.property(k));
      expect(triggerRes.body.configId).to.eql(monitorId);
    });
  });
}
