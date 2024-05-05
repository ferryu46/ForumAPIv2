/* eslint-disable import/no-extraneous-dependencies */
const Joi = require('joi');

const routes = (handler) => ([
  {
    method: 'POST',
    path: '/authentications',
    handler: handler.postAuthenticationHandler,
    options: {
      description: 'POST authentications',
      notes: 'Create new authentication',
      tags: ['api', 'authentications'],
      validate: {
        payload: Joi.object({
          username: Joi.string(),
          password: Joi.string(),
        }).label('Post-Authentications-Payload'),
      },
      response: {
        schema: Joi.object({
          status: 'success',
          data: {
            accessToken: Joi.string(),
            refreshToken: Joi.string(),
          },
        }).label('Post-Authentications-Response'),
      },
    },
  },
  {
    method: 'PUT',
    path: '/authentications',
    handler: handler.putAuthenticationHandler,
  },
  {
    method: 'DELETE',
    path: '/authentications',
    handler: handler.deleteAuthenticationHandler,
  },
]);

module.exports = routes;
