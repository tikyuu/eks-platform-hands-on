import { CfnInternetGateway, CfnRouteTable, CfnSubnet, CfnVPC, CfnVPCGatewayAttachment } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { attachInternetGateway, createInternetGateway, InternetGatewayConfig } from './gateway';
import { createRouteTable, RouteTableConfig } from './route-tables';
import { createSubnet, SubnetConfig } from './subnets';
import { createVpc, VpcConfig } from './vpc';

export class Network extends Construct {
  readonly vpc: CfnVPC;
  readonly internetGateway: CfnInternetGateway;
  readonly internetGatewayAttachment: CfnVPCGatewayAttachment;
  readonly publicRouteTable: CfnRouteTable;
  readonly publicSubnets: readonly CfnSubnet[];
  readonly privateAppSubnets: readonly CfnSubnet[];
  readonly privateDbSubnets: readonly CfnSubnet[];

  constructor(scope: Construct, id: string, vpcConfig: VpcConfig, publicSubnetConfigs: readonly SubnetConfig[], privateAppSubnetConfigs: readonly SubnetConfig[], privateDbSubnetConfigs: readonly SubnetConfig[], internetGatewayConfig: InternetGatewayConfig, publicRouteTableConfig: RouteTableConfig) {
    super(scope, id);

    this.vpc = createVpc(this, 'Vpc', vpcConfig);

    this.internetGateway = createInternetGateway(this, 'InternetGateway', internetGatewayConfig);
    this.internetGatewayAttachment = attachInternetGateway(this, 'InternetGatewayAttachment', this.vpc.ref, this.internetGateway.ref);

    this.publicRouteTable = createRouteTable(this, 'PublicRouteTable', this.vpc.ref, publicRouteTableConfig);

    this.publicSubnets = publicSubnetConfigs.map((config) =>
      createSubnet(this, `PublicSubnet-${config.availabilityZone}`, this.vpc.ref, config),
    );

    this.privateAppSubnets = privateAppSubnetConfigs.map((config) =>
      createSubnet(this, `PrivateAppSubnet-${config.availabilityZone}`, this.vpc.ref, config),
    );

    this.privateDbSubnets = privateDbSubnetConfigs.map((config) =>
      createSubnet(this, `PrivateDbSubnet-${config.availabilityZone}`, this.vpc.ref, config),
    );
  }
}
