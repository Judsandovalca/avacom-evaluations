// scripts/init-local-tables.mjs
// Creates the 3 local DynamoDB tables for `npm run dev` if they don't exist.
// Idempotent: existing tables are left alone.

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'us-east-1',
  credentials: { accessKeyId: 'fake', secretAccessKey: 'fake' },
});

const tables = [
  {
    TableName: 'avacom-evaluations-local',
    AttributeDefinitions: [
      { AttributeName: 'evaluationId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    KeySchema: [{ AttributeName: 'evaluationId', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [{
      IndexName: 'userId-createdAt-index',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: 'avacom-users-local',
    AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: 'avacom-courses-local',
    AttributeDefinitions: [{ AttributeName: 'courseId', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'courseId', KeyType: 'HASH' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
];

async function exists(name) {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }));
    return true;
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') return false;
    throw err;
  }
}

for (const spec of tables) {
  if (await exists(spec.TableName)) {
    console.log(`[skip] ${spec.TableName} already exists`);
    continue;
  }
  await client.send(new CreateTableCommand(spec));
  console.log(`[ok]   created ${spec.TableName}`);
}

console.log('Local tables ready.');
