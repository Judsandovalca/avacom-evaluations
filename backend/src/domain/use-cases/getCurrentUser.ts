import type { UserRepository } from '../user/UserRepository';
import type { PublicUser } from '../user/User';
import { User } from '../user/User';
import { NotFoundError } from '../errors';

export interface GetCurrentUserDeps { userRepo: UserRepository; }
export interface GetCurrentUserInput { email: string; }

export function getCurrentUser(deps: GetCurrentUserDeps) {
  return async (input: GetCurrentUserInput): Promise<PublicUser> => {
    const u = await deps.userRepo.findByEmail(input.email);
    if (!u) throw new NotFoundError('User not found');
    return User.toPublic(u);
  };
}
