import {
  DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import type {
  EvaluationRepository, ListFilters, PaginatedEvaluations,
} from '../../domain/evaluation/EvaluationRepository';
import type { Evaluation } from '../../domain/evaluation/Evaluation';
import { makeDocClient } from './dynamoClient';

const GSI_NAME = 'userId-createdAt-index';

export class DynamoEvaluationRepository implements EvaluationRepository {
  constructor(
    private readonly tableName: string,
    private readonly doc: DynamoDBDocumentClient = makeDocClient(),
  ) {}

  async save(e: Evaluation): Promise<void> {
    await this.doc.send(new PutCommand({ TableName: this.tableName, Item: e }));
  }

  async update(e: Evaluation): Promise<void> {
    await this.doc.send(new PutCommand({ TableName: this.tableName, Item: e }));
  }

  async findById(id: string): Promise<Evaluation | null> {
    const r = await this.doc.send(new GetCommand({
      TableName: this.tableName, Key: { evaluationId: id },
    }));
    return (r.Item as Evaluation | undefined) ?? null;
  }

  async listByUser(userId: string, f: ListFilters): Promise<PaginatedEvaluations> {
    const limit = f.limit ?? 25;
    const filterParts: string[] = ['(attribute_not_exists(deletedAt) OR deletedAt = :null)'];
    const values: Record<string, unknown> = { ':uid': userId, ':null': null };
    const names: Record<string, string> = {};

    if (f.status) {
      filterParts.push('#st = :st');
      names['#st'] = 'status';
      values[':st'] = f.status;
    }
    if (f.courseId) {
      filterParts.push('courseId = :cid');
      values[':cid'] = f.courseId;
    }

    const exclusiveStartKey = f.cursor
      ? JSON.parse(Buffer.from(f.cursor, 'base64').toString('utf-8'))
      : undefined;

    const r = await this.doc.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: GSI_NAME,
      KeyConditionExpression: 'userId = :uid',
      FilterExpression: filterParts.join(' AND '),
      ExpressionAttributeValues: values,
      ...(Object.keys(names).length > 0 ? { ExpressionAttributeNames: names } : {}),
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: exclusiveStartKey,
    }));

    const nextCursor = r.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(r.LastEvaluatedKey)).toString('base64')
      : null;

    return { items: (r.Items as Evaluation[]) ?? [], nextCursor };
  }
}
