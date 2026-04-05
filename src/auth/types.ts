import { Role } from './utils';

export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone?: string;
  isActive: boolean;
}

export interface Session {
  user: User;
  expires: string;
}

export interface AuthCredentials {
  email?: string;
  username?: string;
  password: string;
}
