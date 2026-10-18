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
