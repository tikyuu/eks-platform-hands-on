import { CfnRoute, CfnRouteTable, CfnSubnetRouteTableAssociation } from 'aws-cdk-lib/aws-ec2';
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

export function createInternetGatewayRoute(scope: Construct, id: string, routeTableId: string, internetGatewayId: string): CfnRoute {
  return new CfnRoute(scope, id, {
    routeTableId,
    destinationCidrBlock: '0.0.0.0/0',
    gatewayId: internetGatewayId,
  });
}

export function createNatGatewayRoute(scope: Construct, id: string, routeTableId: string, natGatewayId: string): CfnRoute {
  return new CfnRoute(scope, id, {
    routeTableId,
    destinationCidrBlock: '0.0.0.0/0',
    natGatewayId,
  });
}

export function associateSubnetRouteTable(scope: Construct, id: string, subnetId: string, routeTableId: string): CfnSubnetRouteTableAssociation {
  return new CfnSubnetRouteTableAssociation(scope, id, {
    subnetId,
    routeTableId,
  });
}
