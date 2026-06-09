export type UserRole = "USER" | "OPERATOR" | "ADMIN";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthTokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: CurrentUser;
};

export type Session = {
  user: CurrentUser;
};
