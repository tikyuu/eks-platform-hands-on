import { App } from 'aws-cdk-lib';
import { stgInternetGatewayConfig, stgPrivateAppSubnetConfigs, stgPrivateDbSubnetConfigs, stgPublicRouteTableConfig, stgPublicSubnetConfigs, stgVpcConfig } from '../lib/config/stg';
import { NetworkStack } from '../lib/stacks/network-stack';

const app = new App();

new NetworkStack(app, 'NetworkStack', {
  vpcConfig: stgVpcConfig,
  internetGatewayConfig: stgInternetGatewayConfig,
  publicRouteTableConfig: stgPublicRouteTableConfig,
  publicSubnetConfigs: stgPublicSubnetConfigs,
  privateAppSubnetConfigs: stgPrivateAppSubnetConfigs,
  privateDbSubnetConfigs: stgPrivateDbSubnetConfigs,
});

app.synth();
