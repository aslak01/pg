import type { SearchResult } from "./types";
import { formatDate, parseBytes, parseMagnet } from "./utils";
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
