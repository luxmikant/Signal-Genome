import { normalizeSourceItems } from "@signal/engine";
import type { SourceConfig } from "../registry.js";

export type ValidationReport = {
  status: "healthy" | "degraded" | "broken";
  itemCount: number;
  coverage: Partial<Record<string, number>>;
  issues: string[];
  healHint: string;
};

export function validateSource(source: SourceConfig, raw: unknown): ValidationReport {
  const items = normalizeSourceItems(source.id, raw);
  const fields = ["title", "url", "body"] as const;

  const coverage: Partial<Record<string, number>> = {};
  for (const field of fields) {
    const present = items.filter((i) => {
      const value = (i as unknown as Record<string, unknown>)[field];
      return value !== undefined && String(value).length > 0;
    }).length;
    coverage[field] = items.length ? present / items.length : 0;
  }

  const issues: string[] = [];
  if (items.length === 0) issues.push("zero items extracted");
  if (items.length > 0 && items.length < source.minItems) issues.push(`only ${items.length} of ${source.minItems} expected items`);
  if ((coverage.title ?? 1) < 0.8) issues.push("title coverage dropped below 80%");
  if ((coverage.body ?? 1) < 0.8) issues.push("body coverage dropped below 80%");
  if ((coverage.url ?? 1) < 0.8) issues.push("url coverage dropped below 80%");

  const status: ValidationReport["status"] = issues.length === 0 ? "healthy" : issues.length === 1 ? "degraded" : "broken";
  const healHint = healDescription(source, issues, coverage);
  return { status, itemCount: items.length, coverage, issues, healHint };
}

function healDescription(source: SourceConfig, issues: string[], coverage: Partial<Record<string, number>>): string {
  const failed = Object.entries(coverage)
    .filter(([, v]) => (v ?? 1) < 0.8)
    .map(([k]) => k)
    .join(", ");
  const base = `The site changed its layout and the ${source.name} collector no longer extracts: ${failed || "expected items"}.`;
  const action = `Please heal the extractor against the current page structure so that the collector again returns for each item: "${source.expectedFields.join(", ")}".`;
  const contract = `Keep the JSON schema unchanged: ${source.expectedFields.join(", ")}.`;
  return `${base} ${action} ${contract}`;
}
