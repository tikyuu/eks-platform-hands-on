import { Stack, StackProps } from 'aws-cdk-lib';
import { Repository, TagMutability } from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class EcsStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    new Repository(this, 'ProductApiRepository', {
      repositoryName: 'ecs-stg-ecr-product-api',
      imageTagMutability: TagMutability.IMMUTABLE,
    });
  }
}
