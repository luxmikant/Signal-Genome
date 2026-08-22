const API = "/api";

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export function getGenome<T>() { return json<T>("/genome"); }
export function getGene<T>(geneId: string) { return json<T>(`/gene/${geneId}`); }
export function postReaction(geneId: string, type: string) {
  return json<{ ok: boolean }>("/reactions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ geneId, type }),
  });
}
export function postVisit() {
  return json<{ ok: boolean }>("/visit", { method: "POST" });
}
export function getHealth<T>() { return json<T>("/health"); }
