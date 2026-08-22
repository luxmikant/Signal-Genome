import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerRoutes } from "./routes.js";

const PORT = Number(process.env.PORT ?? 8787);

const app = Fastify({ logger: { level: "info" } });
await app.register(cors, { origin: true });
registerRoutes(app);

app.listen({ port: PORT, host: "127.0.0.1" });
console.log(`[api] genome engine listening on http://127.0.0.1:${PORT}`);
