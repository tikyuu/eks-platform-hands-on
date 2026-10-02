import { VpcConfig } from '../constructs/network/vpc';

export const stgVpcConfig: VpcConfig = {
  name: 'eks-stg-vpc',
  cidrBlock: '10.20.0.0/19',
};
