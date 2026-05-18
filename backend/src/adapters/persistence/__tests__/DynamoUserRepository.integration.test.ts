import { describe, it, expect, beforeEach } from 'vitest';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoUserRepository } from '../DynamoUserRepository';
import { User } from '../../../domain/user/User';
import { ddbClient, TEST_USERS_TABLE } from '../../../__tests__/setup-integration';

const doc = DynamoDBDocumentClient.from(ddbClient);

async function clearTable() {
  const all = await doc.send(new ScanCommand({ TableName: TEST_USERS_TABLE }));
  for (const item of all.Items ?? []) {
    await doc.send(new DeleteCommand({ TableName: TEST_USERS_TABLE, Key: { email: item.email } }));
  }
}

describe('DynamoUserRepository (integration)', () => {
  const repo = new DynamoUserRepository(TEST_USERS_TABLE, doc);
  beforeEach(clearTable);

  it('save() and findByEmail() roundtrip', async () => {
    const u = User.create({ email: 'a@b.com', passwordHash: 'h', name: 'A' });
    await repo.save(u);
    expect(await repo.findByEmail('a@b.com')).toEqual(u);
  });

  it('findByEmail() returns null when not found', async () => {
    expect(await repo.findByEmail('missing@example.com')).toBeNull();
  });

  it('findByEmail() normalizes lookup to lowercase', async () => {
    const u = User.create({ email: 'lower@case.com', passwordHash: 'h', name: 'A' });
    await repo.save(u);
    expect(await repo.findByEmail('LOWER@CASE.com')).toEqual(u);
  });

  it('save() rejects when email already exists', async () => {
    const u1 = User.create({ email: 'dup@x.com', passwordHash: 'h', name: 'A' });
    await repo.save(u1);
    const u2 = User.create({ email: 'dup@x.com', passwordHash: 'h2', name: 'B' });
    await expect(repo.save(u2)).rejects.toThrow();
  });
});
