/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  ExternalServiceSimulator,
  getExternalServiceSimulatorPath,
} from '../../../../alerting_api_integration/common/lib/actions_simulations_utils';
import { FtrProviderContext } from '../../../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const commonScreenshots = getService('commonScreenshots');
  const screenshotDirectories = ['response_ops_docs', 'stack_connectors'];
  const pageObjects = getPageObjects(['common', 'header']);
  const actions = getService('actions');
  const kibanaServer = getService('kibanaServer');
  const testSubjects = getService('testSubjects');
  const toasts = getService('toasts');
  let simulatorUrl: string;
  let editSimulatorUrl: string;

  describe('sentinelone connector', function () {
    before(async () => {
      simulatorUrl = kibanaServer.resolveUrl(
        getExternalServiceSimulatorPath(ExternalServiceSimulator.SENTINELONE)
      );
      editSimulatorUrl = simulatorUrl.replace('/elastic:changeme@', '/');
    });

    beforeEach(async () => {
      await pageObjects.common.navigateToApp('connectors');
      await pageObjects.header.waitUntilLoadingHasFinished();
    });

    it('sentinelone connector screenshots', async () => {
      await pageObjects.common.navigateToApp('connectors');
      await pageObjects.header.waitUntilLoadingHasFinished();
      await actions.common.openNewConnectorForm('sentinelone');
      await testSubjects.setValue('nameInput', 'Sentinelone test connector');
      await testSubjects.setValue('config.url-input', editSimulatorUrl);
      await testSubjects.setValue('secrets.token-input', 'tester');
      await commonScreenshots.takeScreenshot('sentinelone-connector', screenshotDirectories);
      await testSubjects.click('create-connector-flyout-save-test-btn');
      await toasts.dismissAll();
      await commonScreenshots.takeScreenshot('sentinelone-params-test', screenshotDirectories);
      await testSubjects.click('euiFlyoutCloseButton');
    });
  });
}
