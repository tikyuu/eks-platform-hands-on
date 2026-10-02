import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Network } from '../constructs/network/network';
import { SubnetConfig } from '../constructs/network/subnets';
import { VpcConfig } from '../constructs/network/vpc';

export interface NetworkStackProps extends StackProps {
  readonly vpcConfig: VpcConfig;
  readonly publicSubnetConfigs: readonly SubnetConfig[];
  readonly privateAppSubnetConfigs: readonly SubnetConfig[];
  readonly privateDbSubnetConfigs: readonly SubnetConfig[];
}

export class NetworkStack extends Stack {
  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    new Network(this, 'Network', props.vpcConfig, props.publicSubnetConfigs, props.privateAppSubnetConfigs, props.privateDbSubnetConfigs);
  }
}
