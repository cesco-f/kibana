/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { DEFAULT_DOWNLOAD_SOURCE_URI } from '../../../../common/constants';
import type { DownloadSource, FleetProxy } from '../../../types';

function getfleetServerHostsEnrollArgs(
  apiKey: string,
  fleetServerHost: string,
  fleetProxy?: FleetProxy,
  showInstallServers: boolean = false
) {
  const proxyHeadersArgs = fleetProxy?.proxy_headers
    ? Object.entries(fleetProxy.proxy_headers).reduce((acc, [proxyKey, proyVal]) => {
        acc += ` --proxy-header "${proxyKey}=${proyVal}"`;

        return acc;
      }, '')
    : '';
  const proxyArgs = fleetProxy ? ` --proxy-url=${fleetProxy.url}${proxyHeadersArgs}` : '';
  const showInstallServersArgs = showInstallServers ? ' --install-servers' : '';
  return `--url=${
    fleetServerHost || `FLEET_SERVER_HOST`
  } --enrollment-token=${apiKey}${proxyArgs}${showInstallServersArgs}`;
}

export const getDownloadBaseUrl = (downloadSource?: DownloadSource) => {
  const source = downloadSource?.host || DEFAULT_DOWNLOAD_SOURCE_URI;
  return source.endsWith('/') ? source.substring(0, source.length - 1) : source;
};

export const getDownloadSourceProxyArgs = (downloadSourceProxy?: FleetProxy) => {
  const windows = `${downloadSourceProxy?.url ? `-Proxy "${downloadSourceProxy.url}"` : ''} ${
    downloadSourceProxy?.proxy_headers
      ? `-Headers @{${Object.entries(downloadSourceProxy.proxy_headers)
          .reduce((acc, [proxyKey, proyVal]) => {
            acc.push(`"${proxyKey}"="${proyVal}"`);
            return acc;
          }, [] as string[])
          .join('; ')}}`
      : ''
  }`.trim();
  const curl = `${downloadSourceProxy?.url ? `--proxy ${downloadSourceProxy.url}` : ''} ${
    downloadSourceProxy?.proxy_headers
      ? Object.entries(downloadSourceProxy.proxy_headers)
          .reduce((acc, [proxyKey, proyVal]) => {
            acc.push(`--proxy-header "${proxyKey}=${proyVal}"`);
            return acc;
          }, [] as string[])
          .join(' ')
      : ''
  }`.trim();

  return {
    windows,
    curl,
  };
};

export const ManualInstructions = ({
  apiKey,
  fleetServerHost,
  fleetProxy,
  downloadSource,
  downloadSourceProxy,
  agentVersion: agentVersion,
  gcpProjectId = '<PROJECT_ID>',
  gcpOrganizationId = '<ORGANIZATION_ID>',
  gcpAccountType,
  showInstallServers,
  showCompleteAgentInstructions,
}: {
  apiKey: string;
  fleetServerHost: string;
  fleetProxy?: FleetProxy;
  downloadSource?: DownloadSource;
  downloadSourceProxy?: FleetProxy;
  agentVersion: string;
  gcpProjectId?: string;
  gcpOrganizationId?: string;
  gcpAccountType?: string;
  showInstallServers?: boolean;
  showCompleteAgentInstructions: boolean;
}) => {
  // TODO: check how the instructions should change based on the showCompleteAgentInstructions flag
  const elasticAgentName = showCompleteAgentInstructions
    ? 'elastic-agent-complete'
    : 'elastic-agent';

  const enrollArgs = getfleetServerHostsEnrollArgs(
    apiKey,
    fleetServerHost,
    fleetProxy,
    showInstallServers
  );
  const downloadBaseUrl = getDownloadBaseUrl(downloadSource);

  const fleetServerUrl = enrollArgs?.split('--url=')?.pop()?.split('--enrollment')[0];
  const enrollmentToken = enrollArgs?.split('--enrollment-token=')[1];

  const k8sCommand = `kubectl apply -f ${elasticAgentName}-managed-kubernetes.yml`;

  const { windows: windowsDownloadSourceProxyArgs, curl: curlDownloadSourceProxyArgs } =
    getDownloadSourceProxyArgs(downloadSourceProxy);

  const linuxAarch64Command = `curl -L -O ${downloadBaseUrl}/beats/elastic-agent/${elasticAgentName}-${agentVersion}-linux-arm64.tar.gz ${curlDownloadSourceProxyArgs}
  tar xzvf ${elasticAgentName}-${agentVersion}-linux-arm64.tar.gz
  cd ${elasticAgentName}-${agentVersion}-linux-arm64
  sudo ./${elasticAgentName} install ${enrollArgs}`;

  const linuxX8664Command = `curl -L -O ${downloadBaseUrl}/beats/elastic-agent/${elasticAgentName}-${agentVersion}-linux-x86_64.tar.gz ${curlDownloadSourceProxyArgs}
tar xzvf ${elasticAgentName}-${agentVersion}-linux-x86_64.tar.gz
cd ${elasticAgentName}-${agentVersion}-linux-x86_64
sudo ./${elasticAgentName} install ${enrollArgs}`;

  const macAarch64Command = `curl -L -O ${downloadBaseUrl}/beats/elastic-agent/${elasticAgentName}-${agentVersion}-darwin-aarch64.tar.gz ${curlDownloadSourceProxyArgs}
tar xzvf ${elasticAgentName}-${agentVersion}-darwin-aarch64.tar.gz
cd ${elasticAgentName}-${agentVersion}-darwin-aarch64
sudo ./${elasticAgentName} install ${enrollArgs}`;

  const macX8664Command = `curl -L -O ${downloadBaseUrl}/beats/elastic-agent/${elasticAgentName}-${agentVersion}-darwin-x86_64.tar.gz ${curlDownloadSourceProxyArgs}
tar xzvf ${elasticAgentName}-${agentVersion}-darwin-x86_64.tar.gz
cd ${elasticAgentName}-${agentVersion}-darwin-x86_64
sudo ./${elasticAgentName} install ${enrollArgs}`;

  const windowsCommand = `$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -Uri ${downloadBaseUrl}/beats/elastic-agent/${elasticAgentName}-${agentVersion}-windows-x86_64.zip -OutFile ${elasticAgentName}-${agentVersion}-windows-x86_64.zip ${windowsDownloadSourceProxyArgs}
Expand-Archive .\\${elasticAgentName}-${agentVersion}-windows-x86_64.zip -DestinationPath .
cd ${elasticAgentName}-${agentVersion}-windows-x86_64
.\\${elasticAgentName}.exe install ${enrollArgs}`;

  const linuxDebAarch64Command = `curl -L -O ${downloadBaseUrl}/beats/elastic-agent/${elasticAgentName}-${agentVersion}-arm64.deb ${curlDownloadSourceProxyArgs}
sudo dpkg -i ${elasticAgentName}-${agentVersion}-arm64.deb
sudo systemctl enable ${elasticAgentName} \nsudo systemctl start ${elasticAgentName} \nsudo ${elasticAgentName} enroll ${enrollArgs} \n`;

  const linuxDebX8664Command = `curl -L -O ${downloadBaseUrl}/beats/elastic-agent/${elasticAgentName}-${agentVersion}-amd64.deb ${curlDownloadSourceProxyArgs}
sudo dpkg -i ${elasticAgentName}-${agentVersion}-amd64.deb
sudo systemctl enable ${elasticAgentName} \nsudo systemctl start ${elasticAgentName} \nsudo ${elasticAgentName} enroll ${enrollArgs} \n`;

  const linuxRpmAarch64Command = `curl -L -O ${downloadBaseUrl}/beats/elastic-agent/${elasticAgentName}-${agentVersion}-aarch64.rpm ${curlDownloadSourceProxyArgs}
sudo rpm -vi ${elasticAgentName}-${agentVersion}-aarch64.rpm
sudo systemctl enable ${elasticAgentName} \nsudo systemctl start ${elasticAgentName} \nsudo ${elasticAgentName} enroll ${enrollArgs} \n`;

  const linuxRpmX8664Command = `curl -L -O ${downloadBaseUrl}/beats/elastic-agent/${elasticAgentName}-${agentVersion}-x86_64.rpm ${curlDownloadSourceProxyArgs}
sudo rpm -vi ${elasticAgentName}-${agentVersion}-x86_64.rpm
sudo systemctl enable ${elasticAgentName} \nsudo systemctl start ${elasticAgentName} \nsudo ${elasticAgentName} enroll ${enrollArgs} \n`;

  const googleCloudShellCommand = `gcloud config set project ${gcpProjectId} && ${
    gcpAccountType === 'organization-account' ? `ORG_ID=${gcpOrganizationId}` : ``
  } FLEET_URL=${fleetServerUrl?.trim()} ENROLLMENT_TOKEN=${enrollmentToken} STACK_VERSION=${agentVersion} ./deploy.sh`;

  return {
    linux_aarch64: linuxAarch64Command,
    linux_x86_64: linuxX8664Command,
    mac_aarch64: macAarch64Command,
    mac_x86_64: macX8664Command,
    windows: windowsCommand,
    deb_aarch64: linuxDebAarch64Command,
    deb_x86_64: linuxDebX8664Command,
    rpm_aarch64: linuxRpmAarch64Command,
    rpm_x86_64: linuxRpmX8664Command,
    kubernetes: k8sCommand,
    cloudFormation: '',
    googleCloudShell: googleCloudShellCommand,
  };
};
