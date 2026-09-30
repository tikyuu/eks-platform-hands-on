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

  private_app_subnets = {
    "ap-northeast-1a" = {
      name       = "eks-stg-subnet-app-1a"
      cidr_block = "10.20.0.0/22"
    }
    "ap-northeast-1c" = {
      name       = "eks-stg-subnet-app-1c"
      cidr_block = "10.20.4.0/22"
    }
    "ap-northeast-1d" = {
      name       = "eks-stg-subnet-app-1d"
      cidr_block = "10.20.8.0/22"
    }
  }

  private_db_subnets = {
    "ap-northeast-1a" = {
      name       = "eks-stg-subnet-db-1a"
      cidr_block = "10.20.12.192/26"
    }
    "ap-northeast-1c" = {
      name       = "eks-stg-subnet-db-1c"
      cidr_block = "10.20.13.0/26"
    }
    "ap-northeast-1d" = {
      name       = "eks-stg-subnet-db-1d"
      cidr_block = "10.20.13.64/26"
    }
  }
}
