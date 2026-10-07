import { Stack, StackProps } from 'aws-cdk-lib';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { AwsLogDriver, Cluster, ContainerImage, FargateService, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { Repository, TagMutability } from 'aws-cdk-lib/aws-ecr';
import { ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, TargetType } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { Network } from '../constructs/network/network';

export interface EcsStackProps extends StackProps {
  readonly network: Network;
}

export class EcsStack extends Stack {
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    const cluster = new Cluster(this, 'EcsCluster', {
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

    new FargateService(this, 'ProductApiService', {
      serviceName: 'ecs-stg-service-product-api',
      cluster,
      taskDefinition: productApiTaskDefinition,
      desiredCount: 1,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
    });

    const productApiAlb = new ApplicationLoadBalancer(this, 'ProductApiAlb', {
      loadBalancerName: 'ecs-stg-alb-product-api',
      vpc: props.network.vpcReference,
      internetFacing: true,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
    });

    const productApiTargetGroup = new ApplicationTargetGroup(this, 'ProductApiTargetGroup', {
      targetGroupName: 'ecs-stg-tg-product-api',
      vpc: props.network.vpcReference,
      port: 8000,
      protocol: ApplicationProtocol.HTTP,
      targetType: TargetType.IP,
      healthCheck: { path: '/readyz' },
    });

    productApiAlb.addListener('ProductApiHttpListener', {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      open: true,
      defaultTargetGroups: [productApiTargetGroup],
    });
  }
}
