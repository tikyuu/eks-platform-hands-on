import { CfnVPC } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { createVpc, VpcConfig } from './vpc';

export class Network extends Construct {
  readonly vpc: CfnVPC;

  constructor(scope: Construct, id: string, vpcConfig: VpcConfig) {
    super(scope, id);

    this.vpc = createVpc(this, 'Vpc', vpcConfig);
  }
}
