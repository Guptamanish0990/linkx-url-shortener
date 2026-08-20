const Joi = require('joi')

const authSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
})

const registerSchema = Joi.object({
  fullName: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  company: Joi.string().max(100).allow('', null),
  website: Joi.string().uri({ allowRelative: false }).allow('', null),
})

const urlSchema = Joi.object({
  url: Joi.string().uri({ allowRelative: true }).required(),
  customAlias: Joi.string().alphanum().min(3).max(32).optional(),
})

module.exports = { authSchema, registerSchema, urlSchema }
