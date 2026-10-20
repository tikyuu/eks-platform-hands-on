import { App } from 'aws-cdk-lib';
import { stgEcsApiDomainConfig, stgInternetGatewayConfig, stgNatGatewayConfig, stgPrivateAppRouteTableConfig, stgPrivateAppSubnetConfigs, stgPrivateDbRouteTableConfig, stgPrivateDbSubnetConfigs, stgPublicRouteTableConfig, stgPublicSubnetConfigs, stgVpcConfig } from '../lib/config/stg';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { EcsStack } from '../lib/stacks/ecs-stack';
import { EcrStack } from '../lib/stacks/ecr-stack';
import { GitHubActionsStack } from '../lib/stacks/github-actions-stack';
import { NetworkStack } from '../lib/stacks/network-stack';

const app = new App();

// インフラ更新時に、Actionsで配信済みのタスク定義を引き継ぐための入力。
const productApiTaskDefinitionArn = app.node.tryGetContext('productApiTaskDefinitionArn');
if (productApiTaskDefinitionArn !== undefined && !isRevisionedTaskDefinitionArn(productApiTaskDefinitionArn)) {
  throw new Error('productApiTaskDefinitionArnにはリビジョン付きのタスク定義ARNを指定してください。');
}

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

new GitHubActionsStack(app, 'GitHubActionsStack', {
  productApiRepository: ecrStack.productApiRepository,
  storefrontRepository: ecrStack.storefrontRepository,
});

const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  network: networkStack.network,
});

new EcsStack(app, 'EcsStack', {
  network: networkStack.network,
  domainConfig: stgEcsApiDomainConfig,
  productApiRepository: ecrStack.productApiRepository,
  storefrontRepository: ecrStack.storefrontRepository,
  productApiTaskDefinitionArn,
  databaseInitRepository: ecrStack.databaseInitRepository,
  database: databaseStack.database,
  databaseAdminSecret: databaseStack.adminSecret,
  productApiSecret: databaseStack.productApiSecret,
  databaseSecurityGroup: databaseStack.databaseSecurityGroup,
});

app.synth();

function isRevisionedTaskDefinitionArn(value: unknown): value is string {
  const pattern = /^arn:[a-z0-9-]+:ecs:[a-z0-9-]+:\d{12}:task-definition\/[A-Za-z0-9_-]+:[1-9]\d*$/;
  return typeof value === 'string' && pattern.test(value);
}
