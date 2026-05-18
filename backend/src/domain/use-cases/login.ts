import type { UserRepository } from '../user/UserRepository';
import type { TokenPair, TokenService } from '../auth/TokenService';
import type { PublicUser } from '../user/User';
import { User } from '../user/User';
import { UnauthorizedError } from '../errors';

export interface PasswordVerifier {
  compare(password: string, hash: string): Promise<boolean>;
}

export interface LoginInput { email: string; password: string; }
export interface LoginResult { user: PublicUser; tokens: TokenPair; }

export interface LoginDeps {
  userRepo: UserRepository;
  tokens: TokenService;
  verifier: PasswordVerifier;
}

const GENERIC_AUTH_ERROR = 'Invalid email or password';

export function login(deps: LoginDeps) {
  return async (input: LoginInput): Promise<LoginResult> => {
    const email = input.email.trim().toLowerCase();
    const user = await deps.userRepo.findByEmail(email);
    if (!user) throw new UnauthorizedError(GENERIC_AUTH_ERROR);

    const ok = await deps.verifier.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError(GENERIC_AUTH_ERROR);

    const tokens = await deps.tokens.signPair({ userId: user.userId, email: user.email });
    return { user: User.toPublic(user), tokens };
  };
}
