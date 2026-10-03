import { CfnRouteTable } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface RouteTableConfig {
  readonly name: string;
}

export function createRouteTable(scope: Construct, id: string, vpcId: string, config: RouteTableConfig): CfnRouteTable {
  return new CfnRouteTable(scope, id, {
    vpcId,
    tags: [{ key: 'Name', value: config.name }],
  });
}
