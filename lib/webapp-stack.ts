import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import { ApiGatewayToLambda } from '@aws-solutions-constructs/aws-apigateway-lambda';
import * as lambda from '@aws-cdk/aws-lambda';
import { IMonitoring } from './dashboard-stack';

export interface WebAppStackProps extends cdk.StackProps {
  readonly table: dynamodb.Table;
  readonly domainName: string;
  readonly monitoring: IMonitoring;
}

export class WebAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: WebAppStackProps) {
    super(scope, id, props);

    const func = new ApiGatewayToLambda(this, 'API', {
      lambdaFunctionProps: {
        runtime: lambda.Runtime.NODEJS_10_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(`${__dirname}/lambda`),
        environment: {
          TABLE_ARN: props.table.tableArn
        }
      }
    });

    // S3 bucket to hold the website with a CloudFront distribution
    const bucket = new s3.Bucket(this, 'Bucket');
    const distribution = new cloudfront.Distribution(this, 'Dist', {
      defaultBehavior: { origin: new origins.S3Origin(bucket) },
    });

    // Upload assets to the S3 bucket
    new s3deploy.BucketDeployment(this, 'Deploy', {
      destinationBucket: bucket,
      sources: [s3deploy.Source.asset(`${__dirname}/../website`)],
      distribution,
    });

    // Monitoring!
    props.monitoring.addGraphs('Application',
      new cloudwatch.GraphWidget({
        title: 'Latencies (p99)',
        left: [
          func.apiGateway.metricLatency({ statistic: 'p99' }),
          func.apiGateway.metricIntegrationLatency({ statistic: 'p99' }),
        ],
      }),

      new cloudwatch.GraphWidget({
        title: 'Counts vs errors',
        left: [
          func.apiGateway.metricCount(),
        ],
        right: [
          func.apiGateway.metricClientError(),
          func.apiGateway.metricServerError(),
        ],
      }),
    );
  }
}
