import {
  DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import type {
  CourseRepository, ListCoursesOptions, PaginatedCourses,
} from '../../domain/course/CourseRepository';
import type { Course } from '../../domain/course/Course';
import { makeDocClient } from './dynamoClient';
import { Logger } from '@aws-lambda-powertools/logger';
const logger = new Logger({ serviceName: 'avacom-api' });

const DEFAULT_LIMIT = 25;
const NOT_DELETED_FILTER = 'attribute_not_exists(deletedAt) OR deletedAt = :null';

function encodeCursor(key: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(key)).toString('base64');
}

function decodeCursor(cursor: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
}

export class DynamoCourseRepository implements CourseRepository {
  constructor(
    private readonly tableName: string,
    private readonly doc: DynamoDBDocumentClient = makeDocClient(),
  ) {}

  async save(c: Course): Promise<void> {
    await this.doc.send(new PutCommand({ TableName: this.tableName, Item: c }));
  }

  async update(c: Course): Promise<void> {
    await this.doc.send(new PutCommand({ TableName: this.tableName, Item: c }));
  }

  async findById(id: string): Promise<Course | null> {
    const r = await this.doc.send(new GetCommand({
      TableName: this.tableName, Key: { courseId: id },
    }));
    return (r.Item as Course | undefined) ?? null;
  }

  async findByName(name: string): Promise<Course | null> {
    const target = name.trim().toLowerCase();
    let exclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const r = await this.doc.send(new ScanCommand({
        TableName: this.tableName,
        FilterExpression: NOT_DELETED_FILTER,
        ExpressionAttributeValues: { ':null': null },
        ExclusiveStartKey: exclusiveStartKey,
      }));
      const match = (r.Items as Course[] | undefined)?.find(
        (c) => c.name.toLowerCase() === target,
      );
      if (match) return match;
      exclusiveStartKey = r.LastEvaluatedKey;
    } while (exclusiveStartKey);
    return null;
  }

  async list(opts: ListCoursesOptions = {}): Promise<PaginatedCourses> {
    const limit = opts.limit ?? DEFAULT_LIMIT;
    logger.info('list_courses', { limit, key: opts.key });

    const r = await this.doc.send(new ScanCommand({
      TableName: this.tableName,
      FilterExpression: NOT_DELETED_FILTER,
      ExpressionAttributeValues: { ':null': null },
      Limit: limit,
      ExclusiveStartKey: opts.key ? decodeCursor(opts.key) : undefined,
    }));

    const nextKey = r.LastEvaluatedKey ? encodeCursor(r.LastEvaluatedKey) : null;
    return { items: (r.Items as Course[] | undefined) ?? [], nextKey };
  }
}
