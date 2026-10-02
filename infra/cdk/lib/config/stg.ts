import { SubnetConfig } from '../constructs/network/subnets';
import { VpcConfig } from '../constructs/network/vpc';

export const stgVpcConfig: VpcConfig = {
  name: 'eks-stg-vpc',
  cidrBlock: '10.20.0.0/19',
};

export const stgPublicSubnetConfigs: readonly SubnetConfig[] = [
  {
    name: 'eks-stg-subnet-public-1a',
    availabilityZone: 'ap-northeast-1a',
    cidrBlock: '10.20.12.0/26',
  },
  {
    name: 'eks-stg-subnet-public-1c',
    availabilityZone: 'ap-northeast-1c',
    cidrBlock: '10.20.12.64/26',
  },
  {
    name: 'eks-stg-subnet-public-1d',
    availabilityZone: 'ap-northeast-1d',
    cidrBlock: '10.20.12.128/26',
  },
];

export const stgPrivateAppSubnetConfigs: readonly SubnetConfig[] = [
  {
    name: 'eks-stg-subnet-app-1a',
    availabilityZone: 'ap-northeast-1a',
    cidrBlock: '10.20.0.0/22',
  },
  {
    name: 'eks-stg-subnet-app-1c',
    availabilityZone: 'ap-northeast-1c',
    cidrBlock: '10.20.4.0/22',
  },
  {
    name: 'eks-stg-subnet-app-1d',
    availabilityZone: 'ap-northeast-1d',
    cidrBlock: '10.20.8.0/22',
  },
];
