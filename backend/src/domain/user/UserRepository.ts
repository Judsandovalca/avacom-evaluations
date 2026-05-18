import type { User } from './User';

export interface UserRepository {
  save(u: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
}
