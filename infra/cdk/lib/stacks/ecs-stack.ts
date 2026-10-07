import { Stack, StackProps } from 'aws-cdk-lib';
import { AwsLogDriver, Cluster, ContainerImage, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { Repository, TagMutability } from 'aws-cdk-lib/aws-ecr';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { Network } from '../constructs/network/network';

export interface EcsStackProps extends StackProps {
  readonly network: Network;
}

export class EcsStack extends Stack {
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    new Cluster(this, 'EcsCluster', {
      clusterName: 'ecs-stg-cluster',
      vpc: props.network.vpcReference,
    });

    const productApiRepository = new Repository(this, 'ProductApiRepository', {
      repositoryName: 'ecs-stg-ecr-product-api',
      imageTagMutability: TagMutability.IMMUTABLE,
    });

    const productApiLogGroup = new LogGroup(this, 'ProductApiLogGroup', {
      logGroupName: 'ecs-stg-logs-product-api',
      retention: RetentionDays.ONE_MONTH,
    });

    const productApiTaskDefinition = new FargateTaskDefinition(this, 'ProductApiTaskDefinition', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    productApiTaskDefinition.addContainer('ProductApiContainer', {
      image: ContainerImage.fromEcrRepository(productApiRepository, 'v1'),
      portMappings: [{ containerPort: 8000 }],
      logging: new AwsLogDriver({
        logGroup: productApiLogGroup,
        streamPrefix: 'product-api',
      }),
    });
  }
}
