import { ArnFormat, Stack, StackProps } from 'aws-cdk-lib';
import { IRepository } from 'aws-cdk-lib/aws-ecr';
import { OidcProviderNative, OpenIdConnectPrincipal, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface GitHubActionsStackProps extends StackProps {
  readonly productApiRepository: IRepository;
}

export class GitHubActionsStack extends Stack {
  constructor(scope: Construct, id: string, props: GitHubActionsStackProps) {
    super(scope, id, props);

    const githubOidcProvider = new OidcProviderNative(this, 'GitHubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    const infrastructureDeployRole = new Role(this, 'InfrastructureDeployRole', {
      roleName: 'ecs-stg-role-github-infra-deploy',
      assumedBy: new OpenIdConnectPrincipal(githubOidcProvider, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub':
            'repo:tikyuu@224914317/eks-platform-hands-on@1389884351:ref:refs/heads/main',
        },
      }),
    });

    infrastructureDeployRole.addToPolicy(new PolicyStatement({
      actions: ['ecs:DescribeServices'],
      resources: [this.formatArn({
        service: 'ecs',
        resource: 'service',
        resourceName: 'ecs-stg-cluster/ecs-stg-service-product-api',
        arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
      })],
    }));

    // 標準のcdk bootstrapで作る読み取り用ロールだけを引き受ける。
    infrastructureDeployRole.addToPolicy(new PolicyStatement({
      actions: ['sts:AssumeRole'],
      resources: [this.formatArn({
        service: 'iam',
        region: '',
        resource: 'role',
        resourceName: `cdk-hnb659fds-lookup-role-${this.account}-${this.region}`,
        arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
      })],
    }));

    // CloudFormationへ更新を依頼するため、標準のCDKデプロイ用ロールを引き受ける。
    infrastructureDeployRole.addToPolicy(new PolicyStatement({
      actions: ['sts:AssumeRole'],
      resources: [this.formatArn({
        service: 'iam',
        region: '',
        resource: 'role',
        resourceName: `cdk-hnb659fds-deploy-role-${this.account}-${this.region}`,
        arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
      })],
    }));

    // 生成したテンプレートをCDK用S3へ置くため、標準のファイルアップロード用ロールを引き受ける。
    infrastructureDeployRole.addToPolicy(new PolicyStatement({
      actions: ['sts:AssumeRole'],
      resources: [this.formatArn({
        service: 'iam',
        region: '',
        resource: 'role',
        resourceName: `cdk-hnb659fds-file-publishing-role-${this.account}-${this.region}`,
        arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
      })],
    }));

    const productApiPublishRole = new Role(this, 'ProductApiPublishRole', {
      roleName: 'ecs-stg-role-github-product-api-push',
      assumedBy: new OpenIdConnectPrincipal(githubOidcProvider, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub':
            'repo:tikyuu@224914317/eks-platform-hands-on@1389884351:ref:refs/heads/main',
        },
      }),
    });

    props.productApiRepository.grantPush(productApiPublishRole);

    productApiPublishRole.addToPolicy(new PolicyStatement({
      actions: ['ecs:RegisterTaskDefinition'],
      resources: ['*'],
    }));

    productApiPublishRole.addToPolicy(new PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [this.formatArn({
        service: 'iam',
        region: '',
        resource: 'role',
        resourceName: 'ecs-stg-role-product-api-execution',
        arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
      })],
      conditions: {
        StringEquals: {
          'iam:PassedToService': 'ecs-tasks.amazonaws.com',
        },
      },
    }));

    productApiPublishRole.addToPolicy(new PolicyStatement({
      actions: ['ecs:UpdateService', 'ecs:DescribeServices'],
      resources: [this.formatArn({
        service: 'ecs',
        resource: 'service',
        resourceName: 'ecs-stg-cluster/ecs-stg-service-product-api',
        arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
      })],
    }));

    productApiPublishRole.addToPolicy(new PolicyStatement({
      actions: ['cloudformation:DescribeStacks'],
      resources: ['DatabaseStack', 'EcsStack'].map((stackName) => this.formatArn({
        service: 'cloudformation',
        resource: 'stack',
        resourceName: `${stackName}/*`,
        arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
      })),
    }));
  }
}
