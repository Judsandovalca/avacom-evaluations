import {
  DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import type { CourseRepository } from '../../domain/course/CourseRepository';
import type { Course } from '../../domain/course/Course';
import { makeDocClient } from './dynamoClient';

export class DynamoCourseRepository implements CourseRepository {
  constructor(
    private readonly tableName: string,
    private readonly doc: DynamoDBDocumentClient = makeDocClient(),
  ) {}

  async save(c: Course): Promise<void> {
    await this.doc.send(new PutCommand({ TableName: this.tableName, Item: c }));
  }

  async findById(id: string): Promise<Course | null> {
    const r = await this.doc.send(new GetCommand({
      TableName: this.tableName, Key: { courseId: id },
    }));
    return (r.Item as Course | undefined) ?? null;
  }

  async list(): Promise<Course[]> {
    const r = await this.doc.send(new ScanCommand({ TableName: this.tableName }));
    return (r.Items as Course[] | undefined) ?? [];
  }
}
