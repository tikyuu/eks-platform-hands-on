import { CfnInternetGateway, CfnRouteTable, CfnSubnet, CfnVPC, CfnVPCGatewayAttachment } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { attachInternetGateway, createInternetGateway, InternetGatewayConfig } from './gateway';
import { createRouteTable, RouteTableConfig } from './route-tables';
import { createSubnet, SubnetConfig } from './subnets';
import { createVpc, VpcConfig } from './vpc';

export interface NetworkProps {
  readonly vpcConfig: VpcConfig;
  readonly internetGatewayConfig: InternetGatewayConfig;
  readonly publicRouteTableConfig: RouteTableConfig;
  readonly publicSubnetConfigs: readonly SubnetConfig[];
  readonly privateAppSubnetConfigs: readonly SubnetConfig[];
  readonly privateDbSubnetConfigs: readonly SubnetConfig[];
}

export class Network extends Construct {
  readonly vpc: CfnVPC;
  readonly internetGateway: CfnInternetGateway;
  readonly internetGatewayAttachment: CfnVPCGatewayAttachment;
  readonly publicRouteTable: CfnRouteTable;
  readonly publicSubnets: readonly CfnSubnet[];
  readonly privateAppSubnets: readonly CfnSubnet[];
  readonly privateDbSubnets: readonly CfnSubnet[];

  constructor(scope: Construct, id: string, props: NetworkProps) {
    super(scope, id);

    this.vpc = createVpc(this, 'Vpc', props.vpcConfig);

    this.internetGateway = createInternetGateway(this, 'InternetGateway', props.internetGatewayConfig);
    this.internetGatewayAttachment = attachInternetGateway(this, 'InternetGatewayAttachment', this.vpc.ref, this.internetGateway.ref);

    this.publicRouteTable = createRouteTable(this, 'PublicRouteTable', this.vpc.ref, props.publicRouteTableConfig);

    this.publicSubnets = props.publicSubnetConfigs.map((config) =>
      createSubnet(this, `PublicSubnet-${config.availabilityZone}`, this.vpc.ref, config),
    );

    this.privateAppSubnets = props.privateAppSubnetConfigs.map((config) =>
      createSubnet(this, `PrivateAppSubnet-${config.availabilityZone}`, this.vpc.ref, config),
    );

    this.privateDbSubnets = props.privateDbSubnetConfigs.map((config) =>
      createSubnet(this, `PrivateDbSubnet-${config.availabilityZone}`, this.vpc.ref, config),
    );
  }
}
