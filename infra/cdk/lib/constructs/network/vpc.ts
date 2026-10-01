import { CfnVPC } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface VpcConfig {
  readonly name: string;
  readonly cidrBlock: string;
}

export function createVpc(scope: Construct, id: string, config: VpcConfig): CfnVPC {
  return new CfnVPC(scope, id, {
    cidrBlock: config.cidrBlock,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: [{ key: 'Name', value: config.name }],
  });
}
