'use strict';

/**
 * chat-api service
 */
const sessionManager = require("../sessionManager");
const { BufferMemory } = require("langchain/memory");
const { ConversationChain } = require("langchain/chains");
const { PromptTemplate } = require("langchain/prompts");
const { v4: uuidv4 } = require("uuid");
const { SerpAPI } = require("langchain/tools");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { initializeAgentExecutorWithOptions } = require("langchain/agents");

function configureLangChainChat(apiKey) {
  const memory = new BufferMemory();
  const model = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
  });

  const chain = new ConversationChain({
    llm: model,
    memory: memory,
  });

  const tools = [
    new SerpAPI(process.env.SERPAPI_API_KEY, {
      location: "Ho Chi Minh City,Ho Chi Minh City,Vietnam",
      hl: "vi",
      gl: "vn",
    })];

  return {
    chain: chain,
    memory: memory,
    model: model,
    tools: tools,
  };
}

async function generateSession(apiKey) {
  const sessionId = uuidv4();

  const template = `
      system: Your name is {input}, you are playing a human character who is witty, snarky and very smart.
      Directions: 
        Always respond in character.
        If something is not clear, ask for clarification.
        If you are stuck, ask for help.
        Ask questions to learn more about the topic and conversation.`;

  const initializedPrompt = new PromptTemplate({
    template,
    inputVariables: ["input"],
  });

  const initialPrompt = await initializedPrompt.format({ input: "Ava" });
  const langChain = configureLangChainChat(apiKey);
  const executor = await initializeAgentExecutorWithOptions(langChain.tools, langChain.model, {
    agentType: "chat-conversational-react-description",
    verbose: true,
  });
  await sessionManager.saveSession(sessionId, executor, initialPrompt);
  return sessionId;
}

function getResponse(session, input) {
  return session.chain.call({ input: input });
}

async function logInitialChat(sessionId, strapi) {
  await strapi
    .service("api::chat.chat")
    .create({ data: { sessionId: sessionId } });
}

async function updateExistingChat(sessionId, history, strapi) {
  const existingChat = await strapi
    .service("api::chat.chat")
    .find({ filters: { sessionId: sessionId } });

  const id = existingChat.results[0]?.id;

  if (id)
    await strapi
      .service("api::chat.chat")
      .update(id, { data: { history: JSON.stringify(history.messages) } });
}

module.exports = ({ chatapi }) => ({
  chat: async (ctx) => {
    let sessionId = ctx.request.body.data?.sessionId;
    const existingSession = await sessionManager.sessions[sessionId];

    console.log("Session ID: ", sessionId);
    console.log("Existing Session: ", existingSession ? true : false);

    if (!existingSession) {
      const apiToken = process.env.OPENAI_API_KEY;
      if (!apiToken) throw new Error("OpenAI API Key not found");
      console.log(apiToken)
      sessionId = await generateSession(apiToken);
      const newSession = await sessionManager.getSession(sessionId);
      // will add code here to log our chat history to the database
      await logInitialChat(sessionId, strapi);
      const response = await getResponse(newSession, newSession.initialPrompt);
      response.sessionId = sessionId;
      return response;
    } else {
      const session = await sessionManager.getSession(sessionId);
      const history = await sessionManager.getHistory(sessionId);
      const response = await getResponse(session, ctx.request.body.data.input);

      // will add code here to update our chat history to the database
      await updateExistingChat(sessionId, history, strapi);
      response.sessionId = sessionId;
      response.history = history.messages;
      await sessionManager.showAllSessions();
      return response;
    }
  },
  getSessionById: async (ctx) => {
    const sessionId = ctx.params.sessionId;
    const sessionExists = await sessionManager.getSession(sessionId);
    if (!sessionExists) return { error: "Session not found" };
    const history = await sessionManager.getHistory(sessionId);

    const response = {
      sessionId: sessionId,
      history: history.messages,
    };

    return response;
  },

  deleteSessionById: async (ctx) => {
    const sessionId = ctx.params.sessionId;
    const sessionExists = await sessionManager.getSession(sessionId);
    if (!sessionExists) return { error: "Session not found" };
    await sessionManager.clearSessionById(sessionId);
    return { message: "Session deleted" };
  },

  clearAllSessions: async (ctx) => {
    await sessionManager.clearAllSessions();
    return { message: "Sessions cleared" };
  },

  getAllSessions: async (ctx) => {
    const sessions = await sessionManager.showAllSessions();
    return sessions;
  },
});