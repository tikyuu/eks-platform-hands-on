import { App } from 'aws-cdk-lib';
import { stgInternetGatewayConfig, stgNatGatewayConfig, stgPrivateAppRouteTableConfig, stgPrivateAppSubnetConfigs, stgPrivateDbRouteTableConfig, stgPrivateDbSubnetConfigs, stgPublicRouteTableConfig, stgPublicSubnetConfigs, stgVpcConfig } from '../lib/config/stg';
import { EcsStack } from '../lib/stacks/ecs-stack';
import { NetworkStack } from '../lib/stacks/network-stack';

const app = new App();

const networkStack = new NetworkStack(app, 'NetworkStack', {
  vpcConfig: stgVpcConfig,
  internetGatewayConfig: stgInternetGatewayConfig,
  natGatewayConfig: stgNatGatewayConfig,
  publicRouteTableConfig: stgPublicRouteTableConfig,
  privateAppRouteTableConfig: stgPrivateAppRouteTableConfig,
  privateDbRouteTableConfig: stgPrivateDbRouteTableConfig,
  publicSubnetConfigs: stgPublicSubnetConfigs,
  privateAppSubnetConfigs: stgPrivateAppSubnetConfigs,
  privateDbSubnetConfigs: stgPrivateDbSubnetConfigs,
});

new EcsStack(app, 'EcsStack', { network: networkStack.network });

app.synth();
