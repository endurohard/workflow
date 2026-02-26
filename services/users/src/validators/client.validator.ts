import Joi from 'joi';

export const createClientSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  company_name: Joi.string().max(255).optional().allow('', null),
  company_registration: Joi.string().max(100).optional().allow('', null),
  tax_id: Joi.string().max(100).optional().allow('', null),
  billing_address: Joi.string().optional().allow('', null),
  shipping_address: Joi.string().optional().allow('', null),
  payment_terms: Joi.string().max(50).optional().allow('', null),
  credit_limit: Joi.number().positive().optional().allow(null),
  notes: Joi.string().optional().allow('', null),
});

export const updateClientSchema = Joi.object({
  company_name: Joi.string().max(255).optional().allow('', null),
  company_registration: Joi.string().max(100).optional().allow('', null),
  tax_id: Joi.string().max(100).optional().allow('', null),
  billing_address: Joi.string().optional().allow('', null),
  shipping_address: Joi.string().optional().allow('', null),
  payment_terms: Joi.string().max(50).optional().allow('', null),
  credit_limit: Joi.number().positive().optional().allow(null),
  notes: Joi.string().optional().allow('', null),
}).min(1);

export const clientListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().optional(),
  sortBy: Joi.string().valid('company_name', 'created_at').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});
