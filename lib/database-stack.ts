import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as route53 from '@aws-cdk/aws-route53';
import * as certmgr from '@aws-cdk/aws-certificatemanager';
import * as cdk from '@aws-cdk/core';
import { IMonitoring } from './monitoring-stack';

export interface DatabaseStackProps extends cdk.StackProps {
  /**
   * Domain name to create certificate for
   *
   * @default - If not given, a certificate will not be created.
   */
  readonly domainName?: string;

  /**
   * Where to add metrics
   */
  readonly monitoring: IMonitoring;
}

export class DatabaseStack extends cdk.Stack {
  public table: dynamodb.Table;
  public certificate?: certmgr.ICertificate;

  constructor(scope: cdk.Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    this.table = new dynamodb.Table(this, 'Table', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
    });

    if (props.domainName) {
      this.certificate = new certmgr.DnsValidatedCertificate(this, 'Certificate', {
        domainName: props.domainName,
        hostedZone: route53.HostedZone.fromLookup(this, 'HostedZone', {
          domainName: parentDomain(props.domainName),
        }),
        region: 'us-east-1', // CloudFront requires 'us-east-1' region
      });
    }

    // Monitoring!
    props.monitoring.addGraphs('Database',
      new cloudwatch.GraphWidget({
        title: 'Errors',
        left: [
          this.table.metricUserErrors(),
          this.table.metricSystemErrorsForOperations(),
          this.table.metricConditionalCheckFailedRequests(),
        ],
      }),

      new cloudwatch.GraphWidget({
        title: 'Read capacity used',
        left: [
          this.table.metricConsumedReadCapacityUnits(),
          this.table.metricConsumedWriteCapacityUnits(),
        ],
      })
    );
  }
}

function parentDomain(domain: string) {
  return domain.split('.').slice(1).join('.');
}