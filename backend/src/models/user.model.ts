export type Role = 'admin' | 'instructor' | 'student';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: Date;
}
