import Joi from 'joi';
import { UserRole, UserStatus } from '../models/user.model';

/**
 * Validation schema for creating a user
 */
export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  first_name: Joi.string().min(2).max(100).required(),
  last_name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow('', null),
  role: Joi.string().valid(...Object.values(UserRole)).required(),
  status: Joi.string().valid(...Object.values(UserStatus)).optional(),
  profile_photo_url: Joi.string().uri().optional().allow('', null),
});

/**
 * Validation schema for updating a user
 */
export const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  password: Joi.string().min(8).optional(),
  first_name: Joi.string().min(2).max(100).optional(),
  last_name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().allow('', null),
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  status: Joi.string().valid(...Object.values(UserStatus)).optional(),
  profile_photo_url: Joi.string().uri().optional().allow('', null),
}).min(1);

/**
 * Validation schema for user list query parameters
 */
export const userListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  status: Joi.string().valid(...Object.values(UserStatus)).optional(),
  search: Joi.string().optional(),
  sortBy: Joi.string().valid('created_at', 'email', 'first_name', 'last_name').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

/**
 * Validation schema for updating user status
 */
export const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(UserStatus)).required(),
});
