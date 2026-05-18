import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export function makeDocClient(endpoint?: string): DynamoDBDocumentClient {
  const client = new DynamoDBClient(
    endpoint
      ? { endpoint, region: 'us-east-1', credentials: { accessKeyId: 'fake', secretAccessKey: 'fake' } }
      : {},
  );
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });
}
