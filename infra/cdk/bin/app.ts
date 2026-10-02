import { App } from 'aws-cdk-lib';
import { stgPublicSubnetConfigs, stgVpcConfig } from '../lib/config/stg';
import { NetworkStack } from '../lib/stacks/network-stack';

const app = new App();

new NetworkStack(app, 'NetworkStack', {
  vpcConfig: stgVpcConfig,
  publicSubnetConfigs: stgPublicSubnetConfigs,
});

app.synth();
