/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { Container, ContainerModule } from 'inversify';
import { Logger } from '@kbn/core-di';
import { CoreStart, PluginInitializer, Request } from '@kbn/core-di-server';
import { coreMock } from '@kbn/core/server/mocks';
import { elasticsearchServiceMock } from '@kbn/core-elasticsearch-server-mocks';
import { httpServerMock } from '@kbn/core-http-server-mocks';
import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import { PROJECT_ROUTING_ALL, PROJECT_ROUTING_ORIGIN } from '@kbn/cps-server-utils';
import { configSchema } from '../config';
import { EsServiceInternalToken, EsServiceScopedToken } from '../lib/services/es_service/tokens';
import {
  QueryServiceScopedToken,
  QueryServiceForRuleQueryToken,
} from '../lib/services/query_service/tokens';
import { bindServices } from './bind_services';

describe('bindServices - Elasticsearch client routing', () => {
  let container: Container;
  let elasticsearch: ReturnType<typeof elasticsearchServiceMock.createStart>;
  let request: ReturnType<typeof httpServerMock.createKibanaRequest>;

  beforeEach(() => {
    container = new Container();
    elasticsearch = elasticsearchServiceMock.createStart();
    request = httpServerMock.createKibanaRequest();

    container.bind(CoreStart('elasticsearch')).toConstantValue(elasticsearch);
    container.bind(Request).toConstantValue(request);
    container.bind(Logger).toConstantValue(loggingSystemMock.createLogger());
    container
      .bind(PluginInitializer('config'))
      .toConstantValue(coreMock.createPluginInitializerContext(configSchema.validate({})).config);

    container.load(new ContainerModule((options) => bindServices(options)));
  });

  it('binds the internal client to asInternalUser (origin-only, local)', () => {
    expect(container.get(EsServiceInternalToken)).toBe(elasticsearch.client.asInternalUser);
    expect(elasticsearch.client.asScoped).not.toHaveBeenCalled();
  });

  it('binds the scoped client to asCurrentUser without project routing (local)', () => {
    const client = container.get(EsServiceScopedToken);

    expect(elasticsearch.client.asScoped).toHaveBeenCalledTimes(1);
    expect(elasticsearch.client.asScoped).toHaveBeenCalledWith(request);
    expect(client).toBe(elasticsearch.client.asScoped.mock.results[0].value.asCurrentUser);
  });

  it('wires the scoped QueryService to the origin-only (local) client', () => {
    container.get(QueryServiceScopedToken);

    expect(elasticsearch.client.asScoped).toHaveBeenCalledTimes(1);
    expect(elasticsearch.client.asScoped).toHaveBeenCalledWith(request);
  });

  describe('QueryServiceForRuleQueryToken factory', () => {
    it("maps 'space' to projectRouting: 'space'", () => {
      const factory = container.get(QueryServiceForRuleQueryToken);
      factory('space');

      expect(elasticsearch.client.asScoped).toHaveBeenCalledTimes(1);
      expect(elasticsearch.client.asScoped).toHaveBeenCalledWith(request, {
        projectRouting: 'space',
      });
    });

    it("maps 'all' to the CPS all-projects expression", () => {
      const factory = container.get(QueryServiceForRuleQueryToken);
      factory('all');

      expect(elasticsearch.client.asScoped).toHaveBeenCalledTimes(1);
      expect(elasticsearch.client.asScoped).toHaveBeenCalledWith(request, {
        projectRouting: 'expression',
        value: PROJECT_ROUTING_ALL,
      });
    });

    it("maps 'origin' to the CPS origin-project expression", () => {
      const factory = container.get(QueryServiceForRuleQueryToken);
      factory('origin');

      expect(elasticsearch.client.asScoped).toHaveBeenCalledTimes(1);
      expect(elasticsearch.client.asScoped).toHaveBeenCalledWith(request, {
        projectRouting: 'expression',
        value: PROJECT_ROUTING_ORIGIN,
      });
    });

    it('builds a new scoped client on every call, not reusing across routings', () => {
      const factory = container.get(QueryServiceForRuleQueryToken);
      factory('space');
      factory('all');

      expect(elasticsearch.client.asScoped).toHaveBeenCalledTimes(2);
    });
  });
});
