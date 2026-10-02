import { CfnSubnet } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface SubnetConfig {
  readonly name: string;
  readonly availabilityZone: string;
  readonly cidrBlock: string;
}

export function createSubnet(scope: Construct, id: string, vpcId: string, config: SubnetConfig): CfnSubnet {
  return new CfnSubnet(scope, id, {
    vpcId,
    availabilityZone: config.availabilityZone,
    cidrBlock: config.cidrBlock,
    tags: [{ key: 'Name', value: config.name }],
  });
}
