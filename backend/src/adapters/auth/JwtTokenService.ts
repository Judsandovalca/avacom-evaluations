import { SignJWT, jwtVerify } from 'jose';
import type { TokenService, TokenPayload, TokenPair } from '../../domain/auth/TokenService';

export interface TokenTtls {
  accessTtl: string;   // jose format: '15m', '7d', etc.
  refreshTtl: string;
}

export class JwtTokenService implements TokenService {
  private readonly secret: Uint8Array;
  constructor(secret: string, private readonly ttls: TokenTtls) {
    this.secret = new TextEncoder().encode(secret);
  }

  async signAccess(payload: TokenPayload): Promise<string> {
    return new SignJWT({ ...payload, typ: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setSubject(payload.userId)
      .setExpirationTime(this.ttls.accessTtl)
      .sign(this.secret);
  }

  private async signRefresh(payload: TokenPayload): Promise<string> {
    return new SignJWT({ ...payload, typ: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setSubject(payload.userId)
      .setExpirationTime(this.ttls.refreshTtl)
      .sign(this.secret);
  }

  async signPair(payload: TokenPayload): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccess(payload),
      this.signRefresh(payload),
    ]);
    return { accessToken, refreshToken };
  }

  async verifyAccess(token: string): Promise<TokenPayload> {
    return this.verify(token, 'access');
  }

  async verifyRefresh(token: string): Promise<TokenPayload> {
    return this.verify(token, 'refresh');
  }

  private async verify(token: string, expectedTyp: 'access' | 'refresh'): Promise<TokenPayload> {
    const { payload } = await jwtVerify(token, this.secret, { algorithms: ['HS256'] });
    if (payload.typ !== expectedTyp) throw new Error(`Token type mismatch: expected ${expectedTyp}`);
    return { userId: payload.userId as string, email: payload.email as string };
  }
}
