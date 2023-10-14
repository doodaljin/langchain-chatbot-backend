'use strict';

/**
 * chat-api service
 */
const sessionManager = require("../sessionManager");
const { PromptTemplate } = require("langchain/prompts");
const { v4: uuidv4 } = require("uuid");
const { SerpAPI } = require("langchain/tools");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { initializeAgentExecutorWithOptions } = require("langchain/agents");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { WebBrowser } = require("langchain/tools/webbrowser");
const { OpenAI } = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const { DynamicTool } = require("langchain/tools");

function configureLangChainChat(apiKey) {
  const model = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
  });
  const DallETool = new DynamicTool({
    name: "Dall-E Api",
    description: "use this tool when user needs to create an image. input should be the description of the image. response should be the whole url of the image and it must not be modified.",
    func: async (input) => {
      const response = await openai.images.generate({
        prompt: input,
        n: 1,
        size: "512x512",
      });
      const image_url = response.data[0].url;
      console.log(image_url);
      return "Here the whole url of the generated image: " + image_url;
    }
  })
  const embeddings = new OpenAIEmbeddings();
  const tools = [
    new SerpAPI(process.env.SERPAPI_API_KEY, {
      location: "Ho Chi Minh City,Ho Chi Minh City,Vietnam",
      hl: "vi",
      gl: "vn",
    }),
    new WebBrowser({ model, embeddings }),
    DallETool, 
  ];

  return {
    model: model,
    tools: tools,
  };
}

async function generateSession(apiKey) {
  const sessionId = uuidv4();

  const template = `
      system: Your name is {input}, say hello and introduce about yourself.`;

  const initializedPrompt = new PromptTemplate({
    template,
    inputVariables: ["input"],
  });

  const initialPrompt = await initializedPrompt.format({ input: "Ava" });
  const langChain = configureLangChainChat(apiKey);
  const executor = await initializeAgentExecutorWithOptions(langChain.tools, langChain.model, {
    agentType: "chat-conversational-react-description",
    verbose: true,
    agentArgs: {
      systemMessage:
        `You are a human assistant who is knowledgable, witty and very smart.
      Directions: 
        Always respond in character.
        If something is not clear or you are stuck, using search tool to look up information before answer or ask for clarification.
        Ask questions to learn more about the topic and conversation.
        If the response contains an url, the url must not be modified in anyway.`,
    }
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