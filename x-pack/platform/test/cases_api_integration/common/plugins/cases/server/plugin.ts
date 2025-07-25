/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Plugin, CoreSetup, PluginInitializerContext, Logger } from '@kbn/core/server';
import type { FeaturesPluginSetup } from '@kbn/features-plugin/server';
import type { SpacesPluginStart } from '@kbn/spaces-plugin/server';
import type { SecurityPluginStart } from '@kbn/security-plugin/server';
import type { CasesServerStart, CasesServerSetup } from '@kbn/cases-plugin/server';
import type { FilesSetup } from '@kbn/files-plugin/server';
import type { PluginStartContract as ActionsPluginsStart } from '@kbn/actions-plugin/server/plugin';
import { KibanaFeatureScope } from '@kbn/features-plugin/common';
import type { TaskManagerStartContract } from '@kbn/task-manager-plugin/server';
import { getPersistableStateAttachment } from './attachments/persistable_state';
import { getExternalReferenceAttachment } from './attachments/external_reference';
import { registerRoutes } from './routes';
import { registerCaseFixtureFileKinds } from './files';

export interface FixtureSetupDeps {
  features: FeaturesPluginSetup;
  cases: CasesServerSetup;
  files: FilesSetup;
}

export interface FixtureStartDeps {
  actions: ActionsPluginsStart;
  security?: SecurityPluginStart;
  spaces?: SpacesPluginStart;
  cases: CasesServerStart;
  taskManager: TaskManagerStartContract;
}

export class FixturePlugin implements Plugin<void, void, FixtureSetupDeps, FixtureStartDeps> {
  private readonly log: Logger;
  constructor(initContext: PluginInitializerContext) {
    this.log = initContext.logger.get();
  }

  public setup(core: CoreSetup<FixtureStartDeps>, deps: FixtureSetupDeps) {
    deps.cases.attachmentFramework.registerExternalReference(getExternalReferenceAttachment());
    deps.cases.attachmentFramework.registerPersistableState(getPersistableStateAttachment());

    registerRoutes(core, this.log);
    registerCaseFixtureFileKinds(deps.files);

    /**
     * Kibana features
     */

    deps.features.registerKibanaFeature({
      id: 'testNoCasesConnectorFixture',
      name: 'TestNoCasesConnectorFixture',
      app: ['kibana'],
      category: { id: 'cases-fixtures', label: 'Cases Fixtures' },
      scope: [KibanaFeatureScope.Spaces, KibanaFeatureScope.Security],
      cases: ['testNoCasesConnectorFixture'],
      privileges: {
        all: {
          api: [],
          app: ['kibana'],
          cases: {
            create: ['testNoCasesConnectorFixture'],
            read: ['testNoCasesConnectorFixture'],
            update: ['testNoCasesConnectorFixture'],
          },
          savedObject: {
            all: [],
            read: [],
          },
          ui: [],
        },
        read: {
          app: ['kibana'],
          cases: {
            read: ['testNoCasesConnectorFixture'],
          },
          savedObject: {
            all: [],
            read: [],
          },
          ui: [],
        },
      },
    });
  }

  public start() {}

  public stop() {}
}
