import { describe, it, expect } from 'vitest';
import {
  DomainError, ValidationError, NotFoundError, ForbiddenError,
  UnauthorizedError, ConflictError,
} from '../errors';

describe('domain errors', () => {
  it('DomainError captures code and message', () => {
    const e = new DomainError('TEST_CODE', 'msg');
    expect(e.code).toBe('TEST_CODE');
    expect(e.message).toBe('msg');
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('DomainError');
  });

  it('subclasses set correct code and name', () => {
    expect(new ValidationError('bad').code).toBe('VALIDATION_ERROR');
    expect(new NotFoundError('x').code).toBe('NOT_FOUND');
    expect(new ForbiddenError('no').code).toBe('FORBIDDEN');
    expect(new UnauthorizedError('au').code).toBe('UNAUTHORIZED');
    expect(new ConflictError('dup').code).toBe('CONFLICT');
    expect(new ValidationError('x').name).toBe('ValidationError');
  });

  it('ValidationError accepts optional details', () => {
    const e = new ValidationError('bad', { field: 'title' });
    expect(e.details).toEqual({ field: 'title' });
  });
});
