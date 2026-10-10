import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion, StorageType } from 'aws-cdk-lib/aws-rds';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { Network } from '../constructs/network/network';

export interface DatabaseStackProps extends StackProps {
  readonly network: Network;
}

export class DatabaseStack extends Stack {
  readonly database: DatabaseInstance;
  readonly databaseSecurityGroup: SecurityGroup;
  readonly productApiSecret: Secret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    this.databaseSecurityGroup = new SecurityGroup(this, 'DatabaseSecurityGroup', {
      securityGroupName: 'ecs-stg-sg-rds',
      description: 'Allow PostgreSQL connections from the product API ECS tasks.',
      vpc: props.network.vpcReference,
      allowAllOutbound: false,
    });

    const adminSecret = new Secret(this, 'DatabaseAdminSecret', {
      description: 'Administrative database credentials; do not pass to the product API.',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'db_admin' }),
        generateStringKey: 'password',
        passwordLength: 32,
        excludePunctuation: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.database = new DatabaseInstance(this, 'Database', {
      instanceIdentifier: 'ecs-stg-rds',
      databaseName: 'ecs_app',
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.of('18.6', '18'),
      }),
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
      credentials: Credentials.fromSecret(adminSecret),
      vpc: props.network.vpcReference,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
      securityGroups: [this.databaseSecurityGroup],
      port: 5432,
      publiclyAccessible: false,
      multiAz: false,
      storageType: StorageType.GP3,
      allocatedStorage: 20,
      maxAllocatedStorage: 30,
      storageEncrypted: true,
      autoMinorVersionUpgrade: true,
      backupRetention: Duration.days(7),
      deletionProtection: false,
      deleteAutomatedBackups: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // This stores credentials only. Creating the PostgreSQL user and grants is a later step.
    this.productApiSecret = new Secret(this, 'ProductApiDatabaseSecret', {
      description: 'Database credentials for product_api_app; provision the DB user before use.',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'product_api_app' }),
        generateStringKey: 'password',
        passwordLength: 32,
        excludePunctuation: true,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }
}
