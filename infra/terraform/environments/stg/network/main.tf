module "network" {
  source = "../../../modules/network"

  vpc = {
    name       = "eks-stg-vpc"
    cidr_block = "10.20.0.0/19"
  }

  public_subnets = {
    "ap-northeast-1a" = {
      name       = "eks-stg-subnet-public-1a"
      cidr_block = "10.20.12.0/26"
    }
    "ap-northeast-1c" = {
      name       = "eks-stg-subnet-public-1c"
      cidr_block = "10.20.12.64/26"
    }
    "ap-northeast-1d" = {
      name       = "eks-stg-subnet-public-1d"
      cidr_block = "10.20.12.128/26"
    }
  }
}
