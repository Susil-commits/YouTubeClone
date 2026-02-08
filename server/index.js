import { handler } from "./src/index.js";

// Re-export the serverless handler as the default export so Vercel can route to /server/index.js
export default handler;
