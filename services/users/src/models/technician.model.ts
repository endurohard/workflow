import { UserResponse } from './user.model';

/**
 * Technician entity interface
 */
export interface Technician {
  id: string;
  user_id: string;
  specialization: string | null;
  certification_level: string | null;
  rating: number;
  total_tasks_completed: number;
  bio: string | null;
  skills: string[];
  service_radius_km: number;
  hourly_rate: number | null;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Technician creation data
 */
export interface CreateTechnicianData {
  user_id: string;
  specialization?: string;
  certification_level?: string;
  bio?: string;
  skills?: string[];
  service_radius_km?: number;
  hourly_rate?: number;
  is_available?: boolean;
}

/**
 * Technician update data
 */
export interface UpdateTechnicianData {
  specialization?: string;
  certification_level?: string;
  bio?: string;
  skills?: string[];
  service_radius_km?: number;
  hourly_rate?: number;
  is_available?: boolean;
}

/**
 * Technician response with user details
 */
export interface TechnicianResponse {
  id: string;
  user: UserResponse;
  specialization: string | null;
  certification_level: string | null;
  rating: number;
  total_tasks_completed: number;
  bio: string | null;
  skills: string[];
  service_radius_km: number;
  hourly_rate: number | null;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Technician list query parameters
 */
export interface TechnicianListQuery {
  page?: number;
  limit?: number;
  specialization?: string;
  is_available?: boolean;
  min_rating?: number;
  skills?: string[]; // Filter by skills
  search?: string; // Search in user name, specialization
  sortBy?: 'rating' | 'total_tasks_completed' | 'hourly_rate' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated technician list response
 */
export interface PaginatedTechnicianResponse {
  technicians: TechnicianResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Technician statistics
 */
export interface TechnicianStatistics {
  technician_id: string;
  user: UserResponse;
  total_tasks_completed: number;
  total_hours_worked: number;
  average_rating: number;
  total_revenue: number;
  tasks_this_month: number;
  hours_this_month: number;
  revenue_this_month: number;
}

/**
 * Technician schedule entry
 */
export interface TechnicianSchedule {
  id: string;
  technician_id: string;
  date: Date;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create technician schedule data
 */
export interface CreateScheduleData {
  technician_id: string;
  date: Date;
  start_time: string;
  end_time: string;
  is_available?: boolean;
  notes?: string;
}

/**
 * Update technician schedule data
 */
export interface UpdateScheduleData {
  date?: Date;
  start_time?: string;
  end_time?: string;
  is_available?: boolean;
  notes?: string;
}
