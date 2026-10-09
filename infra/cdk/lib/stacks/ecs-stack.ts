import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { Alarm, ComparisonOperator, TreatMissingData } from 'aws-cdk-lib/aws-cloudwatch';
import { ISecurityGroup, Port, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { AlarmBehavior, AlternateTarget, AwsLogDriver, Cluster, ContainerImage, DeploymentStrategy, FargateService, FargateTaskDefinition, ListenerRuleConfiguration } from 'aws-cdk-lib/aws-ecs';
import { IRepository } from 'aws-cdk-lib/aws-ecr';
import { ApplicationListenerRule, ApplicationLoadBalancer, ApplicationProtocol, ApplicationTargetGroup, HttpCodeTarget, ListenerAction, ListenerCondition, TargetType } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { LoadBalancerTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { Network } from '../constructs/network/network';

export interface EcsApiDomainConfig {
  readonly domainName: string;
  readonly hostedZoneName: string;
  readonly hostedZoneId: string;
}

export interface EcsStackProps extends StackProps {
  readonly network: Network;
  readonly domainConfig: EcsApiDomainConfig;
  readonly productApiRepository: IRepository;
  readonly databaseSecurityGroup: ISecurityGroup;
}

export class EcsStack extends Stack {
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'EcsApiHostedZone', {
      hostedZoneId: props.domainConfig.hostedZoneId,
      zoneName: props.domainConfig.hostedZoneName,
    });

    const productApiCertificate = new Certificate(this, 'ProductApiCertificate', {
      domainName: props.domainConfig.domainName,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    const cluster = new Cluster(this, 'EcsCluster', {
      clusterName: 'ecs-stg-cluster',
      vpc: props.network.vpcReference,
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
      image: ContainerImage.fromEcrRepository(props.productApiRepository, 'v1'),
      portMappings: [{ containerPort: 8000 }],
      logging: new AwsLogDriver({
        logGroup: productApiLogGroup,
        streamPrefix: 'product-api',
      }),
    });

    const productApiService = new FargateService(this, 'ProductApiService', {
      serviceName: 'ecs-stg-service-product-api',
      cluster,
      taskDefinition: productApiTaskDefinition,
      desiredCount: 1,
      deploymentStrategy: DeploymentStrategy.BLUE_GREEN,
      bakeTime: Duration.minutes(5),
      circuitBreaker: { enable: true, rollback: true },
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
    });

    // Keep the rule in EcsStack so DatabaseStack does not depend on EcsStack.
    productApiService.connections.securityGroups.forEach((securityGroup) => {
      props.databaseSecurityGroup.addIngressRule(
        securityGroup,
        Port.tcp(5432),
        'Allow PostgreSQL from product API tasks',
        true,
      );
    });

    const productApiAlb = new ApplicationLoadBalancer(this, 'ProductApiAlb', {
      loadBalancerName: 'ecs-stg-alb-product-api',
      vpc: props.network.vpcReference,
      internetFacing: true,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
    });

    const productApiServerErrorAlarm = new Alarm(this, 'ProductApiServerErrorAlarm', {
      alarmName: 'ecs-stg-alarm-product-api-5xx',
      metric: productApiAlb.metrics.httpCodeTarget(HttpCodeTarget.TARGET_5XX_COUNT, {
        period: Duration.minutes(1),
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    });

    productApiService.enableDeploymentAlarms(
      [productApiServerErrorAlarm.alarmName],
      { behavior: AlarmBehavior.ROLLBACK_ON_ALARM },
    );

    const productApiTargetGroup = new ApplicationTargetGroup(this, 'ProductApiTargetGroup', {
      targetGroupName: 'ecs-stg-tg-product-api',
      vpc: props.network.vpcReference,
      port: 8000,
      protocol: ApplicationProtocol.HTTP,
      targetType: TargetType.IP,
      healthCheck: { path: '/readyz' },
    });

    const productApiAlternateTargetGroup = new ApplicationTargetGroup(this, 'ProductApiAlternateTargetGroup', {
      targetGroupName: 'ecs-stg-tg-product-api-alt',
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
      defaultAction: ListenerAction.redirect({
        protocol: ApplicationProtocol.HTTPS,
        port: '443',
        permanent: true,
      }),
    });

    const productApiHttpsListener = productApiAlb.addListener('ProductApiHttpsListener', {
      port: 443,
      protocol: ApplicationProtocol.HTTPS,
      certificates: [productApiCertificate],
      open: true,
      defaultAction: ListenerAction.fixedResponse(404),
    });

    const productApiProductionRule = new ApplicationListenerRule(this, 'ProductApiProductionRule', {
      listener: productApiHttpsListener,
      priority: 1,
      conditions: [ListenerCondition.pathPatterns(['/*'])],
      action: ListenerAction.forward([productApiTargetGroup]),
    });

    const productApiAlternateTarget = new AlternateTarget('ProductApiAlternateTarget', {
      alternateTargetGroup: productApiAlternateTargetGroup,
      productionListener: ListenerRuleConfiguration.applicationListenerRule(productApiProductionRule),
    });

    new ARecord(this, 'ProductApiAliasRecord', {
      zone: hostedZone,
      recordName: `${props.domainConfig.domainName}.`,
      target: RecordTarget.fromAlias(new LoadBalancerTarget(productApiAlb)),
    });

    productApiTargetGroup.addTarget(
      productApiService.loadBalancerTarget({
        containerName: 'ProductApiContainer',
        containerPort: 8000,
        alternateTarget: productApiAlternateTarget,
      }),
    );
  }
}
