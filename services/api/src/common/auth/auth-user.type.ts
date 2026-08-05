/** Authenticated principal attached to the request by the AuthGuard. */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  permissions: string[];
}
