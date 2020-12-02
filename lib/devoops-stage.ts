import { Stage, Construct, StageProps } from '@aws-cdk/core';
import { DatabaseStack } from '../lib/database-stack';
import { DashboardStack } from './dashboard-stack';
import { WebAppStack } from './webapp-stack';

export interface DevoopsStageProps extends StageProps {
  readonly domainName: string;
}

export class DevoopsStage extends Stage {
  constructor(scope: Construct, id: string, props: DevoopsStageProps) {
    super(scope, id, props);

    const monitoring = new DashboardStack(this, 'Dashboard');

    const db = new DatabaseStack(this, 'Database', {
      terminationProtection: true,
      monitoring,
    });

    new WebAppStack(this, 'App', {
      table: db.table,
      domainName: props.domainName,
      monitoring,
    });
  }
}

