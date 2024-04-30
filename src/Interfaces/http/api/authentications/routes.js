const Joi = require('joi');

const routes = (handler) => ([
  {
    method: 'POST',
    path: '/authentications',
    handler: handler.postAuthenticationHandler,
    options: {
      description: 'POST authentications',
      notes: 'Test',
      tags: ['api', 'authentications'],
      validate: {
        payload: Joi.object({
          username: Joi.string(),
          password: Joi.string(),
        }).label('Post-authentication-payload'),
      },
      response: {
        schema: Joi.object({
          status: 'success',
          data: {
            accessToken: Joi.string(),
            refreshToken: Joi.string(),
          },
        }).label('Post-authentication-response'),
      },
    },
  },
  {
    method: 'PUT',
    path: '/authentications',
    handler: handler.putAuthenticationHandler,
    options: {
      description: 'PUT authentications',
      notes: 'Test',
      tags: ['api', 'authentications'],
      validate: {
        payload: Joi.object({
          refreshToken: Joi.string().required(),
        }).label('Put-authentication-payload'),
      },
      response: {
        schema: Joi.object({
          status: 'success',
          data: {
            accessToken: Joi.string(),
          },
        }).label('Put-authentication-response'),
      },
    },
  },
  {
    method: 'DELETE',
    path: '/authentications',
    handler: handler.deleteAuthenticationHandler,
    options: {
      description: 'DELETE authentications',
      notes: 'Test',
      tags: ['api', 'authentications'],
      validate: {
        headers: Joi.object({
          Authorization: Joi.string().required(),
        }).label('Delete-authentication-payload'),
      },
      response: {
        schema: Joi.object({
          status: 'success',
          message: 'Authentication deleted',
        }).label('Delete-authentication-response'),
      },
    },
  },
]);

module.exports = routes;
