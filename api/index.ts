import { app } from "../server";

if (process.env.VERCEL && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured in Vercel.");
}

export default app;
