import { CfnSubnet, CfnVPC } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { createSubnet, SubnetConfig } from './subnets';
import { createVpc, VpcConfig } from './vpc';

export class Network extends Construct {
  readonly vpc: CfnVPC;
  readonly publicSubnets: readonly CfnSubnet[];
  readonly privateAppSubnets: readonly CfnSubnet[];

  constructor(scope: Construct, id: string, vpcConfig: VpcConfig, publicSubnetConfigs: readonly SubnetConfig[], privateAppSubnetConfigs: readonly SubnetConfig[]) {
    super(scope, id);

    this.vpc = createVpc(this, 'Vpc', vpcConfig);

    this.publicSubnets = publicSubnetConfigs.map((config) =>
      createSubnet(this, `PublicSubnet-${config.availabilityZone}`, this.vpc.ref, config),
    );

    this.privateAppSubnets = privateAppSubnetConfigs.map((config) =>
      createSubnet(this, `PrivateAppSubnet-${config.availabilityZone}`, this.vpc.ref, config),
    );
  }
}
