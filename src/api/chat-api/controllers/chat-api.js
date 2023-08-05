"use strict";

/**
 * A set of functions called "actions" for `strapi-chat`
 */

module.exports = {
  chat: async (ctx) => {
    try {
      const response = await strapi
        .service("api::chat-api.chat-api")
        .chat(ctx);

      ctx.body = { data: response };
    } catch (err) {
      console.log(err.message);
      throw new Error(err.message);
    }
  },

  getSessionById: async (ctx) => {
    try {
      const response = await strapi
        .service("api::chat-api.chat-api")
        .getSessionById(ctx);

      ctx.body = { data: response };
    } catch (err) {
      console.log(err.message);
      throw new Error(err.message);
    }
  },

  deleteSessionById: async (ctx) => {
    try {
      const response = await strapi
        .service("api::chat-api.chat-api")
        .deleteSessionById(ctx);
      ctx.body = { data: response };
    } catch (err) {
      console.log(err.message);
      throw new Error(err.message);
    }
  },

  clearAllSessions: async (ctx) => {
    try {
      const response = await strapi
        .service("api::chat-api.chat-api")
        .clearAllSessions(ctx);

      ctx.body = { data: response };
    } catch (err) {
      console.log(err.message);
      throw new Error(err.message);
    }
  },

  getAllSessions: async (ctx) => {
    try {
      const response = await strapi
        .service("api::chat-api.chat-api")
        .getAllSessions(ctx);

      ctx.body = { data: response };
    } catch (err) {
      console.log(err.message);
      throw new Error(err.message);
    }
  },
};