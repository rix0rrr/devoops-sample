import * as AWS from 'aws-sdk';

const s3 = new AWS.S3();

export async function handler(event: any, context: any) {

  if (event.RequestType === 'Create' || event.RequestType === 'Update') {
    // Write config
    await s3.putObject({
      Bucket: event.ResourceProperties.Bucket,
      Key: event.ResourceProperties.ObjectKey,
      Body: JSON.stringify(event.ResourceProperties.Value),
    }).promise();

    // Invalidate distribution
    if (event.ResourceProperties.DistributionId) {
      const cf = new AWS.CloudFront();

      await cf.createInvalidation({
        DistributionId: event.ResourceProperties.DistributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: 1,
            Items: [`/${event.ResourceProperties.ObjectKey}`],
          },
          CallerReference: `${Date.now()}`,
        }
      }).promise();
    }

    return {
      PhysicalResourceId: `${event.ResourceProperties.Bucket}-${event.ResourceProperties.ObjectKey}`,
    };
  }

  if (event.RequestType === 'Delete') {
    await s3.deleteObject({
      Bucket: event.ResourceProperties.Bucket,
      Key: event.ResourceProperties.ObjectKey,
    }).promise();
    return {};
  }

  throw new Error(`Unrecognized event: ${event.RequestType}`);
}