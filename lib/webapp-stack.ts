import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as certmgr from '@aws-cdk/aws-certificatemanager';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as lambda from '@aws-cdk/aws-lambda';
import { IMonitoring } from './monitoring-stack';

export interface WebAppStackProps extends cdk.StackProps {
  /**
   * Table to use as backing store for the Lambda Function
   */
  readonly table: dynamodb.ITable;

  /**
   * Domain name for the CloudFront distribution
   *
   * @default - Automatically generated domain name under CloudFront domain
   */
  readonly domainName?: string;

  /**
   * Certificate for the CloudFront distribution
   *
   * @default - Automatically generated domain name under CloudFront domain
   */
  readonly certificate?: certmgr.ICertificate;

  /**
   * Where to add metrics
   */
  readonly monitoring: IMonitoring;
}

export class WebAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: WebAppStackProps) {
    super(scope, id, props);

    if (!!props.domainName !== !!props.certificate) {
      throw new Error('Supply either both or neither of \'domainName\' and \'certificate\'');
    }

    const func = new lambda.Function(this, 'API', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(`${__dirname}/../build/handler`),
      environment: {
        TABLE_ARN: props.table.tableArn
      },
      timeout: cdk.Duration.seconds(10),
    });

    const apiGateway = new apigateway.LambdaRestApi(this, 'Gateway', {
      handler: func,
    });

    // S3 bucket to hold the website with a CloudFront distribution
    const bucket = new s3.Bucket(this, 'Bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const distribution = new cloudfront.Distribution(this, 'Dist', {
      defaultBehavior: { origin: new origins.S3Origin(bucket) },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(`${apiGateway.restApiId}.execute-api.${this.region}.amazonaws.com`, {
            originPath: `/${apiGateway.deploymentStage.stageName}`,
          }),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        },
      },
      defaultRootObject: 'index.html',
      domainNames: props.domainName ? [props.domainName] : undefined,
      certificate: props.certificate,
    });

    // Upload assets to the S3 bucket
    new s3deploy.BucketDeployment(this, 'Deploy', {
      destinationBucket: bucket,
      sources: [s3deploy.Source.asset(`${__dirname}/../website`)],
      distribution,
      prune: false,
    });

    // Monitoring
    props.monitoring.addGraphs('Application',
      new cloudwatch.GraphWidget({
        title: 'Latencies (p99)',
        left: [
          apiGateway.metricLatency({ statistic: 'p99' }),
          apiGateway.metricIntegrationLatency({ statistic: 'p99' }),
        ],
      }),

      new cloudwatch.GraphWidget({
        title: 'Counts vs errors',
        left: [
          apiGateway.metricCount(),
        ],
        right: [
          apiGateway.metricClientError(),
          apiGateway.metricServerError(),
        ],
      }),
    );
  }
}
