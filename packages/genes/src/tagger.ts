import type { Content, Gene, TagEdge } from "@signal/core";
import { GENES } from "./registry.js";

const BODY_WEIGHT = 1;
const TITLE_WEIGHT = 3;
const TAGS_WEIGHT = 2;
const CODE_WEIGHT = 1.5;
const HIT_CAP = 3;

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function variantList(phrase: string): string[] {
  const words = phrase
    .trim()
    .toLowerCase()
    .split(/[\s\-_/]+/)
    .filter(Boolean);
  if (words.length < 2) return [phrase.trim().toLowerCase()];
  return [words.join(" "), words.join("-"), words.join("")];
}

function makeMatcher(variants: string[]): (haystack: string) => boolean {
  const sources = variants.map((v) => escapeRegex(v));
  const re = new RegExp(`(^|[^a-z0-9])(?:${sources.join("|")})([^a-z0-9]|$)`, "i");
  return (haystack: string) => re.test(haystack);
}

function scoreFor(gene: Gene, content: Content): number | null {
  const title = content.title.toLowerCase();
  const body = content.body.toLowerCase();
  const tags = content.tags.map((t) => t.toLowerCase());
  const code = content.codeBlocks.map((c) => c.toLowerCase()).join(" ");

  const phrases = [...gene.aliases, ...gene.keywords];
  let best = 0;
  for (const phrase of phrases) {
    const match = makeMatcher(variantList(phrase));
    if (match(title)) best = Math.max(best, TITLE_WEIGHT);
    if (tags.some(match)) best = Math.max(best, TAGS_WEIGHT);
    if (match(body)) best = Math.max(best, BODY_WEIGHT);
    if (code && match(code)) best = Math.max(best, CODE_WEIGHT);
  }
  if (best < BODY_WEIGHT) return null;
  return Math.min(best, HIT_CAP);
}

export function tagContent(content: Content): TagEdge[] {
  const edges: TagEdge[] = [];
  for (const gene of GENES) {
    const weight = scoreFor(gene, content);
    if (weight !== null) edges.push({ geneId: gene.id, weight });
  }
  return edges;
}

export function tagBatch(contents: Content[]): Map<string, TagEdge[]> {
  const out = new Map<string, TagEdge[]>();
  for (const content of contents) out.set(content.id, tagContent(content));
  return out;
}
