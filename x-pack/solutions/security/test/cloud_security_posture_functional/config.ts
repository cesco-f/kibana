/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { resolve } from 'path';
import {
  getKibanaCliLoggers,
  type FtrConfigProviderContext,
  type GenericFtrProviderContext,
} from '@kbn/test';
import { CLOUD_SECURITY_PLUGIN_VERSION } from '@kbn/cloud-security-posture-plugin/common/constants';
import {
  KibanaEBTServerProvider,
  KibanaEBTUIProvider,
} from '@kbn/test-suites-src/analytics/services/kibana_ebt';
import type { services as inheritedServices } from '@kbn/test-suites-xpack/functional/services';
import { pageObjects } from './page_objects';
import { services } from './services';

type SecurityTelemetryServices = typeof inheritedServices &
  typeof services & {
    kibana_ebt_ui: typeof KibanaEBTUIProvider;
  };

export type SecurityTelemetryFtrProviderContext = GenericFtrProviderContext<
  SecurityTelemetryServices,
  typeof pageObjects
>;

export default async function ({ readConfigFile }: FtrConfigProviderContext) {
  const xpackFunctionalConfig = await readConfigFile(
    require.resolve('@kbn/test-suites-xpack/functional/config.base')
  );

  return {
    ...xpackFunctionalConfig.getAll(),
    services: {
      ...xpackFunctionalConfig.get('services'),
      ...services,
      kibana_ebt_server: KibanaEBTServerProvider,
      kibana_ebt_ui: KibanaEBTUIProvider,
    },
    pageObjects,
    testFiles: [resolve(__dirname, './pages')],
    junit: {
      reportName: 'X-Pack Cloud Security Posture Functional Tests',
    },
    kbnTestServer: {
      ...xpackFunctionalConfig.get('kbnTestServer'),
      serverArgs: [
        ...xpackFunctionalConfig.get('kbnTestServer.serverArgs'),
        `--logging.loggers=${JSON.stringify([
          ...getKibanaCliLoggers(xpackFunctionalConfig.get('kbnTestServer.serverArgs')),
          {
            name: 'plugins.cloudSecurityPosture',
            level: 'all',
            appenders: ['default'],
          },
        ])}`,
        /**
         * Package version is fixed (not latest) so FTR won't suddenly break when package is changed.
         *
         * test a new package:
         * 1. build the package and start the registry with elastic-package and uncomment the 'registryUrl' flag below
         * 2. locally checkout the kibana version that matches the new package
         * 3. update the package version below to use the new package version
         * 4. run tests with NODE_EXTRA_CA_CERTS pointing to the elastic-package certificate
         * 5. when test pass:
         *   1. release a new package to EPR
         *   2. merge the updated version number change to kibana
         */
        `--uiSettings.overrides.securitySolution:enableGraphVisualization=true`,
        `--xpack.fleet.packages.0.name=cloud_security_posture`,
        `--xpack.fleet.packages.0.version=${CLOUD_SECURITY_PLUGIN_VERSION}`,
        // `--xpack.fleet.registryUrl=https://localhost:8080`,
        `--xpack.fleet.agents.fleet_server.hosts=["https://ftr.kibana:8220"]`,
        `--xpack.fleet.internal.fleetServerStandalone=true`,
        `--xpack.fleet.internal.registry.kibanaVersionCheckEnabled=false`,
        // Required for telemetry e2e tests
        `--plugin-path=${resolve(
          __dirname,
          '../../../../../src/platform/test/analytics/plugins/analytics_ftr_helpers'
        )}`,
      ],
    },
  };
}
