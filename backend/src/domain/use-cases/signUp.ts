import type { UserRepository } from '../user/UserRepository';
import type { TokenPair, TokenService } from '../auth/TokenService';
import type { PublicUser } from '../user/User';
import { User } from '../user/User';
import { ConflictError, ValidationError } from '../errors';

export interface Hasher {
  hash(password: string, rounds: number): Promise<string>;
}

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
}

export interface SignUpResult {
  user: PublicUser;
  tokens: TokenPair;
}

export interface SignUpDeps {
  userRepo: UserRepository;
  tokens: TokenService;
  hasher: Hasher;
}

export function signUp(deps: SignUpDeps) {
  return async (input: SignUpInput): Promise<SignUpResult> => {
    if (input.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    const email = input.email.trim().toLowerCase();
    const existing = await deps.userRepo.findByEmail(email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await deps.hasher.hash(input.password, 10);
    const user = User.create({ email, passwordHash, name: input.name });
    await deps.userRepo.save(user);

    const tokens = await deps.tokens.signPair({ userId: user.userId, email: user.email });
    return { user: User.toPublic(user), tokens };
  };
}
