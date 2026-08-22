function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function contentId(source: string, url: string): string {
  return `${source}::${fnv1a(url)}`;
}

export function cleanUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.search = "";
    u.hash = "";
    return u.href;
  } catch {
    return raw;
  }
}
