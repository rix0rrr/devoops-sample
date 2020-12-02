import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as cdk from '@aws-cdk/core';
import { IMonitoring } from './dashboard-stack';

export interface DatabaseStackProps extends cdk.StackProps {
  readonly monitoring: IMonitoring;
}

export class DatabaseStack extends cdk.Stack {
  public table: dynamodb.Table;

  constructor(scope: cdk.Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    this.table = new dynamodb.Table(this, 'Table', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
    });

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
