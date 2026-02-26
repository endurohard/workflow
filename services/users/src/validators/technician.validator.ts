import Joi from 'joi';

export const createTechnicianSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  specialization: Joi.string().max(100).optional().allow('', null),
  certification_level: Joi.string().max(50).optional().allow('', null),
  bio: Joi.string().optional().allow('', null),
  skills: Joi.array().items(Joi.string()).optional(),
  service_radius_km: Joi.number().integer().min(1).max(500).optional(),
  hourly_rate: Joi.number().positive().optional().allow(null),
  is_available: Joi.boolean().optional(),
});

export const updateTechnicianSchema = Joi.object({
  specialization: Joi.string().max(100).optional().allow('', null),
  certification_level: Joi.string().max(50).optional().allow('', null),
  bio: Joi.string().optional().allow('', null),
  skills: Joi.array().items(Joi.string()).optional(),
  service_radius_km: Joi.number().integer().min(1).max(500).optional(),
  hourly_rate: Joi.number().positive().optional().allow(null),
  is_available: Joi.boolean().optional(),
}).min(1);

export const technicianListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  specialization: Joi.string().optional(),
  is_available: Joi.boolean().optional(),
  min_rating: Joi.number().min(0).max(5).optional(),
  skills: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  search: Joi.string().optional(),
  sortBy: Joi.string().valid('rating', 'total_tasks_completed', 'hourly_rate', 'created_at').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

export const createScheduleSchema = Joi.object({
  technician_id: Joi.string().uuid().required(),
  date: Joi.date().required(),
  start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  is_available: Joi.boolean().optional(),
  notes: Joi.string().optional().allow('', null),
});

export const updateScheduleSchema = Joi.object({
  date: Joi.date().optional(),
  start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  is_available: Joi.boolean().optional(),
  notes: Joi.string().optional().allow('', null),
}).min(1);
