import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import { Construct, CustomResource, CustomResourceProvider, CustomResourceProviderRuntime } from "@aws-cdk/core";

export interface StaticWebsiteConfigProps {
  readonly bucket: s3.IBucket;
  readonly objectKey: string;
  readonly value: any;
  readonly distribution?: cloudfront.IDistribution;
}

export class StaticWebsiteConfig extends Construct {
  constructor(scope: Construct, id: string, props: StaticWebsiteConfigProps) {
    super(scope, id);

    const serviceToken = CustomResourceProvider.getOrCreate(this, 'StaticWebsiteConfigProvider', {
      codeDirectory: `${__dirname}/../build/lib/static-website-config-handler`,
      runtime: CustomResourceProviderRuntime.NODEJS_12,
      policyStatements: [
        {
          Effect: 'Allow',
          Action: ['s3:PutObject', 's3:DeleteObject'],
          Resource: '*',
        },
        {
          Effect: 'Allow',
          Action: ['cloudfront:CreateInvalidation'],
          Resource: '*',
        },
      ],
    });

    new CustomResource(this, 'Default', {
      serviceToken,
      properties: {
        Bucket: props.bucket.bucketName,
        ObjectKey: props.objectKey,
        Value: props.value,
        DistributionId: props.distribution?.distributionId,
      },
    });
  }
}
