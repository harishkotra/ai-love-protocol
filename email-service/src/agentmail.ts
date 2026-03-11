import { AgentMailClient } from "agentmail";
import dotenv from "dotenv";

dotenv.config();

export const client = new AgentMailClient({
  apiKey: process.env.AGENTMAIL_API_KEY
});
