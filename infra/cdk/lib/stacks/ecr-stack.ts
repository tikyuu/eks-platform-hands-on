import { Stack, StackProps } from 'aws-cdk-lib';
import { Repository, TagMutability } from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class EcrStack extends Stack {
  readonly productApiRepository: Repository;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.productApiRepository = new Repository(this, 'ProductApiRepository', {
      repositoryName: 'ecs-stg-ecr-product-api',
      imageTagMutability: TagMutability.IMMUTABLE,
    });
  }
}
