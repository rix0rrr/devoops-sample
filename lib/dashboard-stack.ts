import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as cdk from '@aws-cdk/core';

export interface IMonitoring {
  addGraphs(title: string, ...widgets: cloudwatch.IWidget[]): void;
}

export class DashboardStack extends cdk.Stack implements IMonitoring {
  private dashboard: cloudwatch.Dashboard;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard');
  }

  public addGraphs(title: string, ...widgets: cloudwatch.IWidget[]): void {
    this.dashboard.addWidgets(new cloudwatch.TextWidget({
      markdown: `# ${title}`,
    }));
    this.dashboard.addWidgets(...widgets);
  }
}

