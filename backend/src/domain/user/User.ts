import { randomUUID } from 'node:crypto';

export interface User {
  userId: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface PublicUser {
  userId: string;
  email: string;
  name: string;
}

export interface CreateUserProps {
  email: string;
  passwordHash: string;
  name: string;
}

export const User = {
  create(props: CreateUserProps): User {
    return {
      userId: randomUUID(),
      email: props.email.trim().toLowerCase(),
      passwordHash: props.passwordHash,
      name: props.name,
      createdAt: new Date().toISOString(),
    };
  },

  toPublic(u: User): PublicUser {
    return { userId: u.userId, email: u.email, name: u.name };
  },
};
