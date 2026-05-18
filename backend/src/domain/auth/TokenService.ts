export interface TokenPayload {
  userId: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenService {
  signPair(payload: TokenPayload): Promise<TokenPair>;
  signAccess(payload: TokenPayload): Promise<string>;
  verifyAccess(token: string): Promise<TokenPayload>;
  verifyRefresh(token: string): Promise<TokenPayload>;
}
