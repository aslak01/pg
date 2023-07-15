import type { SearchResult } from "./types.ts";
import { formatDate, parseBytes, parseMagnet } from "./utils.ts";
export function parseItem(item: SearchResult) {
  const { name, seeders, leechers, size, added } = item;
  return {
    name,
    description: name,
    seeders,
    leechers,
    value: parseMagnet(item),
    size: parseBytes(size),
    added: formatDate(added),
  };
}
