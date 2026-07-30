export interface UserProfile {
  userId: string;
  display_name?: string;
  default_translation?: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    display_name?: string;
  };
  token: string;
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}