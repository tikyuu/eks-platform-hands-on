import { App } from 'aws-cdk-lib';
import { stgInternetGatewayConfig, stgNatGatewayConfig, stgPrivateAppRouteTableConfig, stgPrivateAppSubnetConfigs, stgPrivateDbSubnetConfigs, stgPublicRouteTableConfig, stgPublicSubnetConfigs, stgVpcConfig } from '../lib/config/stg';
import { NetworkStack } from '../lib/stacks/network-stack';

const app = new App();

new NetworkStack(app, 'NetworkStack', {
  vpcConfig: stgVpcConfig,
  internetGatewayConfig: stgInternetGatewayConfig,
  natGatewayConfig: stgNatGatewayConfig,
  publicRouteTableConfig: stgPublicRouteTableConfig,
  privateAppRouteTableConfig: stgPrivateAppRouteTableConfig,
  publicSubnetConfigs: stgPublicSubnetConfigs,
  privateAppSubnetConfigs: stgPrivateAppSubnetConfigs,
  privateDbSubnetConfigs: stgPrivateDbSubnetConfigs,
});

app.synth();
