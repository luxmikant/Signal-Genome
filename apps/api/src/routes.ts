import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import type { Content, Reaction } from "@signal/core";
import { GENE_BY_ID, GENES } from "@signal/genes";
import { buildGenomeView, timelineForGene } from "@signal/engine";
import { IngestBatchSchema } from "@signal/core";
import { bus } from "./bus.js";
import { getGenomeState, ingestRaw, recordVisit } from "./genome.js";
import { addReaction, loadContents, loadTags } from "./db.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function buildView(loaded?: ReturnType<typeof getGenomeState>): Record<string, unknown> {
  const state = loaded ?? getGenomeState();
  const contents = state.contents as unknown as Content[];
  const tags = state.tags as ReturnType<typeof loadTags>;
  const reactions = state.reactions as unknown as Reaction[];
  return buildGenomeView({
    genes: GENES,
    contents,
    tags,
    reactions,
    lastVisitAt: state.lastVisitAt as number | null,
  });
}

export function registerRoutes(app: FastifyInstance): void {
  app.get("/api/genome", (_req, reply) => {
    reply.send(buildView());
  });

  app.get("/api/gene/:id", (req, reply) => {
    const { id } = req.params as { id: string };
    const gene = GENE_BY_ID[id];
    if (!gene) {
      reply.code(404).send({ error: "unknown gene" });
      return;
    }
    const contents = loadContents();
    const tags = loadTags();
    const timeline = timelineForGene(id, contents, tags);
    reply.send({
      gene,
      total: timeline.length,
      timeline: timeline.map((c) => ({
        id: c.id,
        title: c.title,
        url: c.url,
        source: c.source,
        publishedAt: c.publishedAt,
        excerpt: c.body.slice(0, 220),
        tags: c.tags,
      })),
    });
  });

  app.post("/api/reactions", (req, reply) => {
    const { geneId, type } = (req.body ?? {}) as { geneId?: string; type?: string };
    const valid = ["follow", "already-know", "teach-basics", "not-for-me"];
    if (!geneId || !type || !valid.includes(type)) {
      reply.code(400).send({ error: "geneId + valid reaction type required" });
      return;
    }
    addReaction(geneId, type as string);
    bus.emitGenome({ type: "reaction", payload: { geneId, type } });
    reply.send({ ok: true });
  });

  app.get("/api/health", (_req, reply) => {
    const sourcesPath = join(repoRoot, "config", "sources.json");
    const statePath = join(repoRoot, "config", "state.json");
    const sources = existsSync(sourcesPath)
      ? (JSON.parse(readFileSync(sourcesPath, "utf8")) as Array<{
          id: string;
          name: string;
          strategy: string;
        }>)
      : [];
    const state = existsSync(statePath)
      ? (JSON.parse(readFileSync(statePath, "utf8")) as Record<
          string,
          {
            status: string;
            collectorId: string | null;
            lastCount: number | null;
            lastRunAt: number | null;
          }
        >)
      : {};
    reply.send(
      sources.map((s) => ({
        source: s.id,
        name: s.name,
        strategy: s.strategy,
        status: state[s.id]?.status ?? "unbuilt",
        collectorId: state[s.id]?.collectorId ?? null,
        lastCount: state[s.id]?.lastCount ?? null,
        lastRunAt: state[s.id]?.lastRunAt ?? null,
      })),
    );
  });

  app.post("/api/visit", (_req, reply) => {
    recordVisit();
    reply.send({ ok: true });
  });

  app.post("/api/internal/ingest", (req, reply) => {
    const parsed = IngestBatchSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400).send({ error: "invalid batch" });
      return;
    }
    const result = ingestRaw(parsed.data.sourceId, parsed.data.items, null);
    for (const mutation of result.mutations) {
      bus.emitGenome({ type: "mutation", payload: mutation });
    }
    bus.emitGenome({
      type: "genome",
      payload: { sourceId: parsed.data.sourceId, count: result.count },
    });
    reply.send({ count: result.count, mutations: result.mutations.length });
  });

  app.get("/api/events", (req, reply) => {
    const headers = {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    };
    void reply.raw.writeHead(200, headers);
    reply.raw.write(`event: hello\ndata: {"at":${Date.now()}}\n\n`);

    const unsubscribe = bus.onGenome((event) => {
      reply.raw.write(`event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`);
    });

    const heartbeat = setInterval(() => reply.raw.write(": ping\n\n"), 20_000);
    const onClose = (): void => {
      clearInterval(heartbeat);
      unsubscribe();
    };
    reply.raw.on("close", onClose);
  });
}
