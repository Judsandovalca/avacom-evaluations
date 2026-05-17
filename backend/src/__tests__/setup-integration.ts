import { beforeAll, afterAll } from 'vitest';
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from '@aws-sdk/client-dynamodb';

export const TEST_EVALUATIONS_TABLE = 'test-Evaluations';
export const TEST_USERS_TABLE = 'test-Users';

export const ddbClient = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'us-east-1',
  credentials: { accessKeyId: 'fake', secretAccessKey: 'fake' },
});

async function createEvaluationsTable() {
  await ddbClient.send(new CreateTableCommand({
    TableName: TEST_EVALUATIONS_TABLE,
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
  }));
}

async function createUsersTable() {
  await ddbClient.send(new CreateTableCommand({
    TableName: TEST_USERS_TABLE,
    AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  }));
}

async function dropTables() {
  for (const name of [TEST_EVALUATIONS_TABLE, TEST_USERS_TABLE]) {
    try { await ddbClient.send(new DeleteTableCommand({ TableName: name })); }
    catch { /* not exist */ }
  }
}

beforeAll(async () => {
  await dropTables();
  await createEvaluationsTable();
  await createUsersTable();
});

afterAll(async () => {
  await dropTables();
});
