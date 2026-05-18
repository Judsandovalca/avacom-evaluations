import { describe, it, expect, beforeEach } from 'vitest';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoEvaluationRepository } from '../DynamoEvaluationRepository';
import { Evaluation } from '../../../domain/evaluation/Evaluation';
import { ddbClient, TEST_EVALUATIONS_TABLE } from '../../../__tests__/setup-integration';

const doc = DynamoDBDocumentClient.from(ddbClient);

async function clearTable() {
  const all = await doc.send(new ScanCommand({ TableName: TEST_EVALUATIONS_TABLE }));
  for (const item of all.Items ?? []) {
    await doc.send(new DeleteCommand({
      TableName: TEST_EVALUATIONS_TABLE, Key: { evaluationId: item.evaluationId },
    }));
  }
}

describe('DynamoEvaluationRepository (integration)', () => {
  const repo = new DynamoEvaluationRepository(TEST_EVALUATIONS_TABLE, doc);
  beforeEach(clearTable);

  it('save() and findById() roundtrip', async () => {
    const e = Evaluation.create({
      userId: 'u-1', courseId: 'CS101', title: 't', description: 'd',
      dueDate: '2026-06-01T12:00:00.000Z', status: 'active',
    });
    await repo.save(e);
    expect(await repo.findById(e.evaluationId)).toEqual(e);
  });

  it('findById() returns null when not found', async () => {
    expect(await repo.findById('missing')).toBeNull();
  });

  it('listByUser() returns user evaluations sorted by createdAt desc', async () => {
    const eOld = Evaluation.create({ userId: 'u-1', courseId: 'c', title: 'old', description: 'd', dueDate: '2026', status: 'active' });
    await new Promise(r => setTimeout(r, 5));
    const eNew = Evaluation.create({ userId: 'u-1', courseId: 'c', title: 'new', description: 'd', dueDate: '2026', status: 'active' });
    const eOther = Evaluation.create({ userId: 'other', courseId: 'c', title: 'x', description: 'd', dueDate: '2026', status: 'active' });
    await Promise.all([repo.save(eOld), repo.save(eNew), repo.save(eOther)]);

    const result = await repo.listByUser('u-1', {});
    expect(result.items.map(i => i.title)).toEqual(['new', 'old']);
    expect(result.nextCursor).toBeNull();
  });

  it('listByUser() filters by status', async () => {
    await repo.save(Evaluation.create({ userId: 'u-1', courseId: 'c', title: 'a', description: 'd', dueDate: '2026', status: 'active' }));
    await repo.save(Evaluation.create({ userId: 'u-1', courseId: 'c', title: 'b', description: 'd', dueDate: '2026', status: 'completed' }));
    const r = await repo.listByUser('u-1', { status: 'completed' });
    expect(r.items.map(i => i.title)).toEqual(['b']);
  });

  it('listByUser() filters by courseId', async () => {
    await repo.save(Evaluation.create({ userId: 'u-1', courseId: 'A', title: 'a', description: 'd', dueDate: '2026', status: 'active' }));
    await repo.save(Evaluation.create({ userId: 'u-1', courseId: 'B', title: 'b', description: 'd', dueDate: '2026', status: 'active' }));
    const r = await repo.listByUser('u-1', { courseId: 'B' });
    expect(r.items.map(i => i.title)).toEqual(['b']);
  });

  it('listByUser() excludes soft-deleted', async () => {
    const a = Evaluation.create({ userId: 'u-1', courseId: 'c', title: 'a', description: 'd', dueDate: '2026', status: 'active' });
    const b = Evaluation.create({ userId: 'u-1', courseId: 'c', title: 'b', description: 'd', dueDate: '2026', status: 'active' });
    await repo.save(a);
    await repo.save(Evaluation.softDelete(b));
    const r = await repo.listByUser('u-1', {});
    expect(r.items.map(i => i.title)).toEqual(['a']);
  });

  it('listByUser() paginates with cursor', async () => {
    for (let i = 0; i < 3; i++) {
      await repo.save(Evaluation.create({ userId: 'u-1', courseId: 'c', title: `t${i}`, description: 'd', dueDate: '2026', status: 'active' }));
      await new Promise(r => setTimeout(r, 5));
    }
    const first = await repo.listByUser('u-1', { limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();
    const second = await repo.listByUser('u-1', { limit: 2, cursor: first.nextCursor! });
    expect(second.items).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
  });

  it('update() persists changes', async () => {
    const e = Evaluation.create({ userId: 'u-1', courseId: 'c', title: 'old', description: 'd', dueDate: '2026', status: 'active' });
    await repo.save(e);
    const updated = Evaluation.applyPatch(e, { title: 'new' });
    await repo.update(updated);
    expect((await repo.findById(e.evaluationId))?.title).toBe('new');
  });
});
