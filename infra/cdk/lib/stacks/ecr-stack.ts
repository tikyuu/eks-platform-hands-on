import { Stack, StackProps } from 'aws-cdk-lib';
import { Repository, TagMutability } from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class EcrStack extends Stack {
  readonly productApiRepository: Repository;
  readonly storefrontRepository: Repository;
  readonly databaseInitRepository: Repository;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.productApiRepository = new Repository(this, 'ProductApiRepository', {
      repositoryName: 'ecs-stg-ecr-product-api',
      imageTagMutability: TagMutability.IMMUTABLE,
    });

    this.storefrontRepository = new Repository(this, 'StorefrontRepository', {
      repositoryName: 'ecs-stg-ecr-storefront',
      imageTagMutability: TagMutability.IMMUTABLE,
    });

    this.databaseInitRepository = new Repository(this, 'DatabaseInitRepository', {
      repositoryName: 'ecs-stg-ecr-db-init',
      imageTagMutability: TagMutability.IMMUTABLE,
    });
  }
}
