import bcrypt from 'bcryptjs';
import type { Hasher } from '../../domain/use-cases/signUp';
import type { PasswordVerifier } from '../../domain/use-cases/login';

export class BcryptHasher implements Hasher, PasswordVerifier {
  async hash(password: string, rounds: number): Promise<string> {
    return bcrypt.hash(password, rounds);
  }
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
