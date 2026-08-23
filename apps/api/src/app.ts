import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerRoutes } from "./routes.js";
import { seedGenome } from "./genome.js";
import { loadContents } from "./db.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.VERCEL === "1" ? false : { level: "info" },
    bodyLimit: 64 * 1024 * 1024,
  });
  await app.register(cors, { origin: true });
  registerRoutes(app);

  if (loadContents().length === 0) {
    const seeded = seedGenome();
    app.log.info?.(`[seed] cold start: ${seeded.items} items`);
  }
  return app;
}

export async function startServer(): Promise<void> {
  const PORT = Number(process.env.PORT ?? 8787);
  const app = await buildApp();
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`[api] genome engine listening on http://127.0.0.1:${PORT}`);
}

export const isServerless = process.env.VERCEL === "1";
