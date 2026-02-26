import { UserResponse } from './user.model';

/**
 * Client entity interface
 */
export interface Client {
  id: string;
  user_id: string;
  company_name: string | null;
  company_registration: string | null;
  tax_id: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  payment_terms: string | null;
  credit_limit: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Client creation data
 */
export interface CreateClientData {
  user_id: string;
  company_name?: string;
  company_registration?: string;
  tax_id?: string;
  billing_address?: string;
  shipping_address?: string;
  payment_terms?: string;
  credit_limit?: number;
  notes?: string;
}

/**
 * Client update data
 */
export interface UpdateClientData {
  company_name?: string;
  company_registration?: string;
  tax_id?: string;
  billing_address?: string;
  shipping_address?: string;
  payment_terms?: string;
  credit_limit?: number;
  notes?: string;
}

/**
 * Client response with user details
 */
export interface ClientResponse {
  id: string;
  user: UserResponse;
  company_name: string | null;
  company_registration: string | null;
  tax_id: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  payment_terms: string | null;
  credit_limit: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Client list query parameters
 */
export interface ClientListQuery {
  page?: number;
  limit?: number;
  search?: string; // Search in company_name, user name, email
  sortBy?: 'company_name' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated client list response
 */
export interface PaginatedClientResponse {
  clients: ClientResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
