import {
  DynamoDBDocumentClient, GetCommand, PutCommand,
} from '@aws-sdk/lib-dynamodb';
import type { UserRepository } from '../../domain/user/UserRepository';
import type { User } from '../../domain/user/User';
import { makeDocClient } from './dynamoClient';

export class DynamoUserRepository implements UserRepository {
  constructor(
    private readonly tableName: string,
    private readonly doc: DynamoDBDocumentClient = makeDocClient(),
  ) {}

  async save(u: User): Promise<void> {
    await this.doc.send(new PutCommand({
      TableName: this.tableName,
      Item: u,
      ConditionExpression: 'attribute_not_exists(email)',
    }));
  }

  async findByEmail(email: string): Promise<User | null> {
    const r = await this.doc.send(new GetCommand({
      TableName: this.tableName,
      Key: { email: email.trim().toLowerCase() },
    }));
    return (r.Item as User | undefined) ?? null;
  }
}
