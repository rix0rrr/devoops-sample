import { Stage, Construct, StageProps } from '@aws-cdk/core';
import { DatabaseStack } from '../lib/database-stack';
import { MonitoringStack } from './monitoring-stack';
import { WebAppStack } from './webapp-stack';

export interface DevoopsStageProps extends StageProps {
  /**
   * Domain name to use
   *
   * @default - If not given, an automatically generated CloudFront URL will be used
   */
  readonly domainName?: string;
}

export class DevoopsStage extends Stage {
  constructor(scope: Construct, id: string, props: DevoopsStageProps) {
    super(scope, id, props);

    const monitoring = new MonitoringStack(this, 'Dashboard');

    const db = new DatabaseStack(this, 'Database', {
      terminationProtection: true,
      domainName: props.domainName,
      monitoring,
    });

    new WebAppStack(this, 'App', {
      table: db.table,
      domainName: props.domainName,
      certificate: db.certificate,
      monitoring,
    });
  }
}

