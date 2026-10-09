import { App } from 'aws-cdk-lib';
import { stgEcsApiDomainConfig, stgInternetGatewayConfig, stgNatGatewayConfig, stgPrivateAppRouteTableConfig, stgPrivateAppSubnetConfigs, stgPrivateDbRouteTableConfig, stgPrivateDbSubnetConfigs, stgPublicRouteTableConfig, stgPublicSubnetConfigs, stgVpcConfig } from '../lib/config/stg';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { EcsStack } from '../lib/stacks/ecs-stack';
import { EcrStack } from '../lib/stacks/ecr-stack';
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

const ecrStack = new EcrStack(app, 'EcrStack');

new DatabaseStack(app, 'DatabaseStack', {
  network: networkStack.network,
});

new EcsStack(app, 'EcsStack', {
  network: networkStack.network,
  domainConfig: stgEcsApiDomainConfig,
  productApiRepository: ecrStack.productApiRepository,
});

app.synth();
