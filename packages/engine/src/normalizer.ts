import { ContentSchema, cleanUrl, type Content, type SourceType } from "@signal/core";

type RawItem = Record<string, unknown>;

function pick(raw: RawItem, keys: string[]): unknown {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(asText).join(" ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
}

function asDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function asTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((t) => asText(t)).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(asText).filter((s) => s.length > 0);
  if (typeof value === "string") return [value];
  return [];
}

export type SourceShape = {
  titleKeys: string[];
  urlKey: string[];
  dateKeys: string[];
  authorKeys: string[];
  bodyKeys: string[];
  tagsKeys: string[];
  codeKeys: string[];
  sourceType: SourceType;
};

export const SOURCE_SHAPES: Record<string, SourceShape> = {
  "vllm-docs": {
    titleKeys: ["title", "heading", "name"],
    urlKey: ["url", "page_url", "link"],
    dateKeys: ["published_at", "date", "publish_date"],
    authorKeys: ["author", "contributors"],
    bodyKeys: ["body", "content", "text", "markdown"],
    tagsKeys: ["tags", "categories", "keywords"],
    codeKeys: ["code_blocks", "code", "snippets"],
    sourceType: "docs",
  },
  "unsloth-blog": {
    titleKeys: ["title", "name", "headline"],
    urlKey: ["url", "link", "page_url"],
    dateKeys: ["published_at", "date", "publish_date", "created_at"],
    authorKeys: ["author", "creator"],
    bodyKeys: ["body", "content", "text", "excerpt"],
    tagsKeys: ["tags", "keywords"],
    codeKeys: ["code_blocks", "code"],
    sourceType: "blog",
  },
  "modal-blog": {
    titleKeys: ["title", "name"],
    urlKey: ["url", "link", "page_url"],
    dateKeys: ["published_at", "date", "publish_date", "created_at"],
    authorKeys: ["author"],
    bodyKeys: ["body", "content", "text", "description"],
    tagsKeys: ["tags", "keywords"],
    codeKeys: ["code_blocks", "code"],
    sourceType: "blog",
  },
  "anyscale-blog": {
    titleKeys: ["title", "name"],
    urlKey: ["url", "link", "page_url"],
    dateKeys: ["published_at", "date", "publish_date"],
    authorKeys: ["author"],
    bodyKeys: ["body", "content", "text", "description"],
    tagsKeys: ["tags", "keywords"],
    codeKeys: ["code_blocks", "code"],
    sourceType: "blog",
  },
};

const GENERIC_SHAPE: SourceShape = {
  titleKeys: ["title", "name", "heading"],
  urlKey: ["url", "link", "page_url"],
  dateKeys: ["published_at", "date", "publish_date", "created_at"],
  authorKeys: ["author", "creator"],
  bodyKeys: ["body", "content", "text", "description", "excerpt", "markdown"],
  tagsKeys: ["tags", "keywords", "categories"],
  codeKeys: ["code_blocks", "code", "snippets"],
  sourceType: "blog",
};

function shapeFor(sourceId: string): SourceShape {
  return SOURCE_SHAPES[sourceId] ?? GENERIC_SHAPE;
}

export function normalizeSourceItems(
  sourceId: string,
  raw: unknown,
  nowMs: number = Date.now(),
): Content[] {
  const shape = shapeFor(sourceId);
  const items: RawItem[] = Array.isArray(raw)
    ? raw.filter((i): i is RawItem => !!i && typeof i === "object")
    : raw && typeof raw === "object"
      ? ([raw] as RawItem[])
      : [];

  const contents: Content[] = [];
  for (const item of items) {
    const urlRaw = asText(pick(item, shape.urlKey));
    if (!urlRaw) continue;
    const title = asText(pick(item, shape.titleKeys));
    if (!title) continue;
    const url = cleanUrl(urlRaw);
    if (!/^https?:\/\//.test(url)) continue;

    const body = asText(pick(item, shape.bodyKeys));
    if (!body) continue;

    contents.push(
      ContentSchema.parse({
        id: `${sourceId}::${hash33(url)}`,
        source: sourceId,
        sourceType: shape.sourceType,
        title,
        url,
        publishedAt: asDate(pick(item, shape.dateKeys)) ?? new Date(nowMs).toISOString().slice(0, 10),
        ...(asText(pick(item, shape.authorKeys)) ? { author: asText(pick(item, shape.authorKeys)) } : {}),
        body,
        codeBlocks: asList(pick(item, shape.codeKeys)),
        tags: asTags(pick(item, shape.tagsKeys)),
      }),
    );
  }
  return contents;
}

function hash33(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}
