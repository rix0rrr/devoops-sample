import { DatabaseStack } from '../lib/database-stack';
import { PipelineStack } from '../lib/pipeline-stack';
import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import { DevoopsStage } from '../lib/devoops-stage';

const app = new cdk.App();

// Directly deploy stacks to local development environments
if (process.env.MY_DOMAIN_NAME) {
  new DevoopsStage(app, 'Local', {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
    domainName: process.env.MY_DOMAIN_NAME,
  });
}

// The pipeline stack is deployed to the shared services account
new PipelineStack(app, 'SharedPipeline', {
  env: {
    account: '01234567890',
    region: 'us-east-1'
  }
});