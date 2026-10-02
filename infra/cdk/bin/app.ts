import { App } from 'aws-cdk-lib';
import { stgInternetGatewayConfig, stgPrivateAppSubnetConfigs, stgPrivateDbSubnetConfigs, stgPublicSubnetConfigs, stgVpcConfig } from '../lib/config/stg';
import { NetworkStack } from '../lib/stacks/network-stack';

const app = new App();

new NetworkStack(app, 'NetworkStack', {
  vpcConfig: stgVpcConfig,
  internetGatewayConfig: stgInternetGatewayConfig,
  publicSubnetConfigs: stgPublicSubnetConfigs,
  privateAppSubnetConfigs: stgPrivateAppSubnetConfigs,
  privateDbSubnetConfigs: stgPrivateDbSubnetConfigs,
});

app.synth();
