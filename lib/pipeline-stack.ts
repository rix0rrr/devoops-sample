import { Stack, Construct, StackProps, StageProps, SecretValue } from '@aws-cdk/core';
import * as cpa from '@aws-cdk/aws-codepipeline-actions';
import { CdkPipeline, SimpleSynthAction } from '@aws-cdk/pipelines';
import { DevoopsStage } from './devoops-stage';
import * as codepipeline from '@aws-cdk/aws-codepipeline';

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const pipeline = new CdkPipeline(this, 'Pipeline', {
      cloudAssemblyArtifact,
      sourceAction: new cpa.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: SecretValue.secretsManager('github-token'),
        owner: 'rix0rrr',
        repo: 'devoops-sample',
      }),
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        buildCommand: 'npm run build',
      }),
    });

    // Environment variables are *NOT* used here.

    pipeline.addApplicationStage(new DevoopsStage(this, 'Beta', {
      env: { account: '01234567891' },  // Beta Account
      domainName: 'beta-site.example.com'
    }));

    pipeline.addApplicationStage(new DevoopsStage(this, 'Gamma', {
      env: { account: '01234567892' }, // Gamma Account
      domainName: 'gamma-site.example.com'
    }));

    pipeline.addApplicationStage(new DevoopsStage(this, 'Prod', {
      env: { account: '01234567893' },  // Prod Account
      domainName: 'www.example.com'
    }));

  }
}

