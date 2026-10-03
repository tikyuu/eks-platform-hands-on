import { CfnInternetGateway, CfnNatGateway, CfnVPCGatewayAttachment } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface InternetGatewayConfig {
  readonly name: string;
}

export function createInternetGateway(scope: Construct, id: string, config: InternetGatewayConfig): CfnInternetGateway {
  return new CfnInternetGateway(scope, id, {
    tags: [{ key: 'Name', value: config.name }],
  });
}

export function attachInternetGateway(scope: Construct, id: string, vpcId: string, internetGatewayId: string): CfnVPCGatewayAttachment {
  return new CfnVPCGatewayAttachment(scope, id, {
    vpcId,
    internetGatewayId,
  });
}

export interface NatGatewayConfig {
  readonly name: string;
}

export function createRegionalNatGateway(scope: Construct, id: string, vpcId: string, config: NatGatewayConfig): CfnNatGateway {
  return new CfnNatGateway(scope, id, {
    vpcId,
    availabilityMode: 'regional',
    tags: [{ key: 'Name', value: config.name }],
  });
}
