import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InternetGatewayConfig, NatGatewayConfig } from '../constructs/network/gateway';
import { Network } from '../constructs/network/network';
import { RouteTableConfig } from '../constructs/network/route-tables';
import { SubnetConfig } from '../constructs/network/subnets';
import { VpcConfig } from '../constructs/network/vpc';

export interface NetworkStackProps extends StackProps {
  readonly vpcConfig: VpcConfig;
  readonly internetGatewayConfig: InternetGatewayConfig;
  readonly natGatewayConfig: NatGatewayConfig;
  readonly publicRouteTableConfig: RouteTableConfig;
  readonly privateAppRouteTableConfig: RouteTableConfig;
  readonly privateDbRouteTableConfig: RouteTableConfig;
  readonly publicSubnetConfigs: readonly SubnetConfig[];
  readonly privateAppSubnetConfigs: readonly SubnetConfig[];
  readonly privateDbSubnetConfigs: readonly SubnetConfig[];
}

export class NetworkStack extends Stack {
  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    new Network(this, 'Network', {
      vpcConfig: props.vpcConfig,
      internetGatewayConfig: props.internetGatewayConfig,
      natGatewayConfig: props.natGatewayConfig,
      publicRouteTableConfig: props.publicRouteTableConfig,
      privateAppRouteTableConfig: props.privateAppRouteTableConfig,
      privateDbRouteTableConfig: props.privateDbRouteTableConfig,
      publicSubnetConfigs: props.publicSubnetConfigs,
      privateAppSubnetConfigs: props.privateAppSubnetConfigs,
      privateDbSubnetConfigs: props.privateDbSubnetConfigs,
    });
  }
}
