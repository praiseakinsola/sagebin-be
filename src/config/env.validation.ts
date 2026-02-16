import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  TURSO_DATABASE_URL: Joi.string().required(),
  TURSO_AUTH_TOKEN: Joi.string().required(),
});
