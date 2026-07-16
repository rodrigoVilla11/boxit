import * as Joi from 'joi';

/**
 * Validación de variables de entorno. Si falta un secret crítico, el proceso
 * no arranca (mejor fallar temprano que servir sin auth segura).
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_TTL: Joi.number().default(900),
  JWT_REFRESH_TTL: Joi.number().default(604800),
  CORS_ORIGIN: Joi.string().required(),
  API_PORT: Joi.number().default(3001),
  ADMIN_EMAILS: Joi.string().allow('').default(''),
}).unknown(true);
