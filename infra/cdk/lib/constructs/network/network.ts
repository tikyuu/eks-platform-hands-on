import { CfnInternetGateway, CfnNatGateway, CfnRouteTable, CfnSubnet, CfnVPC, CfnVPCGatewayAttachment } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { attachInternetGateway, createInternetGateway, createRegionalNatGateway, InternetGatewayConfig, NatGatewayConfig } from './gateway';
import { associateSubnetRouteTable, createInternetGatewayRoute, createNatGatewayRoute, createRouteTable, RouteTableConfig } from './route-tables';
import { createSubnet, SubnetConfig } from './subnets';
import { createVpc, VpcConfig } from './vpc';

export interface NetworkProps {
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

export class Network extends Construct {
  readonly vpc: CfnVPC;
  readonly internetGateway: CfnInternetGateway;
  readonly internetGatewayAttachment: CfnVPCGatewayAttachment;
  readonly natGateway: CfnNatGateway;
  readonly publicRouteTable: CfnRouteTable;
  readonly privateAppRouteTable: CfnRouteTable;
  readonly privateDbRouteTable: CfnRouteTable;
  readonly publicSubnets: readonly CfnSubnet[];
  readonly privateAppSubnets: readonly CfnSubnet[];
  readonly privateDbSubnets: readonly CfnSubnet[];

  constructor(scope: Construct, id: string, props: NetworkProps) {
    super(scope, id);

    this.vpc = createVpc(this, 'Vpc', props.vpcConfig);

    this.internetGateway = createInternetGateway(this, 'InternetGateway', props.internetGatewayConfig);
    this.internetGatewayAttachment = attachInternetGateway(this, 'InternetGatewayAttachment', this.vpc.ref, this.internetGateway.ref);

    this.natGateway = createRegionalNatGateway(this, 'NatGateway', this.vpc.ref, props.natGatewayConfig);
    this.natGateway.addResourceDependency(this.internetGatewayAttachment);

    this.publicRouteTable = createRouteTable(this, 'PublicRouteTable', this.vpc.ref, props.publicRouteTableConfig);
    this.privateAppRouteTable = createRouteTable(this, 'PrivateAppRouteTable', this.vpc.ref, props.privateAppRouteTableConfig);
    this.privateDbRouteTable = createRouteTable(this, 'PrivateDbRouteTable', this.vpc.ref, props.privateDbRouteTableConfig);

    const publicInternetRoute = createInternetGatewayRoute(this, 'PublicInternetRoute', this.publicRouteTable.ref, this.internetGateway.ref);
    publicInternetRoute.addResourceDependency(this.internetGatewayAttachment);

    createNatGatewayRoute(this, 'PrivateAppInternetRoute', this.privateAppRouteTable.ref, this.natGateway.ref);

    this.publicSubnets = props.publicSubnetConfigs.map((config) =>
      createSubnet(this, `PublicSubnet-${config.availabilityZone}`, this.vpc.ref, config),
    );

    this.publicSubnets.forEach((subnet) => {
      associateSubnetRouteTable(this, `${subnet.node.id}RouteTableAssociation`, subnet.ref, this.publicRouteTable.ref);
    });

    this.privateAppSubnets = props.privateAppSubnetConfigs.map((config) =>
      createSubnet(this, `PrivateAppSubnet-${config.availabilityZone}`, this.vpc.ref, config),
    );

    this.privateAppSubnets.forEach((subnet) => {
      associateSubnetRouteTable(this, `${subnet.node.id}RouteTableAssociation`, subnet.ref, this.privateAppRouteTable.ref);
    });

    this.privateDbSubnets = props.privateDbSubnetConfigs.map((config) =>
      createSubnet(this, `PrivateDbSubnet-${config.availabilityZone}`, this.vpc.ref, config),
    );

    this.privateDbSubnets.forEach((subnet) => {
      associateSubnetRouteTable(this, `${subnet.node.id}RouteTableAssociation`, subnet.ref, this.privateDbRouteTable.ref);
    });
  }
}
