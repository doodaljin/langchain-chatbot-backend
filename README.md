# Langchain Chatbot Backend

This is the backend for a chatbot project built with Langchain and GPT.
## Prepare

Add a .env file like .env.example then add your own OpenAI API Key and SERP API Key to it. 

## Run in terminal

### Install required packages
```
yarn install
```
### Start backend server with autoReload enabled
```
yarn develop
```
## Run with Docker

### Build image
```
docker build -t backend:1.0 .
```
### Run a container for backend

```
docker run -d -p 1337:1337 --name backend backend:1.0
```
## ⚙️ Setting your Backend API

Access to the backend main page and create your first admin account then proceed to admin page. <br>
In the Setting, choose Roles and in the Public role, enable Select all in Chat and Chat-api. <br>
In the Setting, choose API Tokens and generate a token for using in [Frontend](https://github.com/doodaljin/langchain-chatbot-frontend.git), remember to enable Select all in Chat and Chat-api too. 

## 📚 Learn more about Strapi

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://docs.strapi.io) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.