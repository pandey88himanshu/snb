require("dotenv").config();
import express from "express";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import {basePrompt as nodeBasePrompt} from "./defaults/node";
import {basePrompt as reactBasePrompt} from "./defaults/react";
import cors from "cors";
const openAi = require("openai");

let openAIClient:any;

  const app = express();
  app.use(cors());
  app.use(express.json());
  
  app.post("/template", async (req, res) => {
    try {
        if(!openAIClient) openAIClient = new openAi({ apiKey: process.env.OPENAI_KEY });
      const prompt = req.body.prompt;
      const messages = [
        {
          role: "system",
          content:
            "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra",
        },
        { role: "user", content: prompt },
      ];
      const response = await openAIClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 200,
        store: true,
      });
      console.log("response= ", response.choices[0].message)
      const answer = response?.choices[0]?.message?.content
        .trim()
        .toLowerCase();

        console.log("ans = ", answer)
  
      if (answer === "react") {
        res.json({
          prompts: [
            BASE_PROMPT,
            "Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n" +
              reactBasePrompt +
              "\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n",
          ],
          uiPrompts: [reactBasePrompt],
        });
        return;
      }
  
      if (answer === "node") {
        res.json({
          prompts: [
            "Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n" +
              reactBasePrompt +
              "\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n",
          ],
          uiPrompts: [nodeBasePrompt],
        });
        return;
      }
  
      res.status(403).json({ message: "You cant access this" });
    } catch (error:any) {
        console.log(error.message)
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/chat", async (req, res) => {
    try {
        if(!openAIClient) openAIClient = new openAi({ apiKey: process.env.OPEN_AI_KEY, });
      const userMessages = req.body.messages;
      const messages = [
        { role: "system", content: getSystemPrompt() },
        ...userMessages,
      ];
      const response = await openAIClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 8000,
        store : true,
      });
      res.json({
        response: response?.choices[0]?.message?.content,
      });
    } catch (error:any) {
        console.log(error.message)
      res.status(500).json({ error: error.message });
    }
  });
  
  app.listen(3000, () => {
    console.log("Listening on port 3000");
  });
  