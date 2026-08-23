import Database from "better-sqlite3";
import type { Content } from "@signal/core";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

// On Vercel the filesystem is ephemeral and read-only except /tmp — the DB is
// rebuilt there from the seed at cold start. Locally it lives in data/.
export const DB_PATH =
  process.env.VERCEL === "1"
    ? join("/tmp", "genome.sqlite")
    : process.env.DATA_DIR
      ? join(process.env.DATA_DIR, "genome.sqlite")
      : join(root, "data", "genome.sqlite");

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS contents (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    source_type TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    published_at TEXT NOT NULL,
    author TEXT,
    body TEXT NOT NULL,
    code_blocks TEXT NOT NULL DEFAULT '[]',
    tags TEXT NOT NULL DEFAULT '[]',
    fetched_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tags (
    content_id TEXT NOT NULL,
    gene_id TEXT NOT NULL,
    weight REAL NOT NULL,
    PRIMARY KEY (content_id, gene_id)
  );
  CREATE TABLE IF NOT EXISTS reactions (
    gene_id TEXT NOT NULL,
    type TEXT NOT NULL,
    at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

export function setMeta(key: string, value: string): void {
  db.prepare(
    "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run(key, value);
}

export function getMeta(key: string): string | null {
  const row = db.prepare("SELECT value FROM meta WHERE key = ?").get(key) as
    { value: string } | undefined;
  return row?.value ?? null;
}

export function loadContents(): Content[] {
  const rows = db.prepare("SELECT * FROM contents").all() as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    source: String(r.source),
    sourceType: String(r.source_type) as Content["sourceType"],
    title: String(r.title),
    url: String(r.url),
    publishedAt: String(r.published_at),
    author: r.author ? String(r.author) : undefined,
    body: String(r.body),
    codeBlocks: JSON.parse(String(r.code_blocks)),
    tags: JSON.parse(String(r.tags)),
  })) as Content[];
}

export function loadTags(): Map<string, Array<{ geneId: string; weight: number }>> {
  const rows = db.prepare("SELECT content_id, gene_id, weight FROM tags").all() as Array<
    Record<string, unknown>
  >;
  const map = new Map<string, Array<{ geneId: string; weight: number }>>();
  for (const row of rows) {
    const contentId = String(row.content_id);
    const list = map.get(contentId) ?? [];
    list.push({ geneId: String(row.gene_id), weight: Number(row.weight) });
    map.set(contentId, list);
  }
  return map;
}

export function loadReactions(): Array<{ geneId: string; type: string; at: number }> {
  return db
    .prepare("SELECT gene_id, type, at FROM reactions")
    .all()
    .map((r) => {
      const row = r as Record<string, unknown>;
      return { geneId: String(row.gene_id), type: String(row.type), at: Number(row.at) };
    });
}

export function upsertContent(content: {
  id: string;
  source: string;
  sourceType: string;
  title: string;
  url: string;
  publishedAt: string;
  author?: string;
  body: string;
  codeBlocks: string[];
  tags: string[];
}): boolean {
  const inserts = db.prepare(`
    INSERT INTO contents (id, source, source_type, title, url, published_at, author, body, code_blocks, tags, fetched_at)
    VALUES (@id, @source, @sourceType, @title, @url, @publishedAt, @author, @body, @codeBlocks, @tags, @fetchedAt)
    ON CONFLICT(id) DO NOTHING`);
  const result = inserts.run({
    ...content,
    author: content.author ?? null,
    codeBlocks: JSON.stringify(content.codeBlocks),
    tags: JSON.stringify(content.tags),
    fetchedAt: Date.now(),
  });
  return result.changes > 0;
}

export function replaceTagsForContent(
  contentId: string,
  edges: Array<{ geneId: string; weight: number }>,
): void {
  db.prepare("DELETE FROM tags WHERE content_id = ?").run(contentId);
  const insert = db.prepare("INSERT INTO tags (content_id, gene_id, weight) VALUES (?, ?, ?)");
  for (const edge of edges) insert.run(contentId, edge.geneId, edge.weight);
}

export function addReaction(geneId: string, type: string): void {
  db.prepare("INSERT INTO reactions (gene_id, type, at) VALUES (?, ?, ?)").run(
    geneId,
    type,
    Date.now(),
  );
}
