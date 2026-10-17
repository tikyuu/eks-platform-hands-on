import { Stack, StackProps } from 'aws-cdk-lib';
import { OidcProviderNative, OpenIdConnectPrincipal, Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class GitHubActionsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const githubOidcProvider = new OidcProviderNative(this, 'GitHubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    new Role(this, 'ProductApiPublishRole', {
      roleName: 'ecs-stg-role-github-product-api-push',
      assumedBy: new OpenIdConnectPrincipal(githubOidcProvider, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub':
            'repo:tikyuu@224914317/eks-platform-hands-on@1389884351:ref:refs/heads/main',
        },
      }),
    });
  }
}
