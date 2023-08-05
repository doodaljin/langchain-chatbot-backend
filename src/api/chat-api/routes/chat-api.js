module.exports = {
  routes: [
    {
    method: 'POST',
    path: '/chat-api/chat',
    handler: 'chat-api.chat',
    config: {
      policies: [],
      middlewares: [],
    },
    },
    {
      method: "GET",
      path: "/chat-api/get-session-by-id/:sessionId",
      handler: "chat-api.getSessionById",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "DELETE",
      path: "/chat-api/delete-session-by-id/:sessionId",
      handler: "chat-api.deleteSessionById",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/chat-api/clear-all-sessions",
      handler: "chat-api.clearAllSessions",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/chat-api/get-all-sessions",
      handler: "chat-api.getAllSessions",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
