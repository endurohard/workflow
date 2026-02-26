/**
 * User role enumeration
 */
export enum UserRole {
  ADMIN = 'admin',
  DISPATCHER = 'dispatcher',
  TECHNICIAN = 'technician',
  CLIENT = 'client',
}

/**
 * User status enumeration
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/**
 * User entity interface
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  profile_photo_url: string | null;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

/**
 * User creation data (without auto-generated fields)
 */
export interface CreateUserData {
  email: string;
  password: string; // Plain password, will be hashed
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  status?: UserStatus;
  profile_photo_url?: string;
}

/**
 * User update data (all fields optional except id)
 */
export interface UpdateUserData {
  email?: string;
  password?: string; // Plain password, will be hashed if provided
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  profile_photo_url?: string;
}

/**
 * User response (without sensitive data)
 */
export interface UserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  profile_photo_url: string | null;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

/**
 * User list query parameters
 */
export interface UserListQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string; // Search in email, first_name, last_name
  sortBy?: 'created_at' | 'email' | 'first_name' | 'last_name';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated user list response
 */
export interface PaginatedUserResponse {
  users: UserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
