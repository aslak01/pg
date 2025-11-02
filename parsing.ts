import chalk from "npm:chalk";
import type { SearchResult } from "./types.ts";

const UNIX_TIMESTAMP_TO_MS = 1000;
const BYTES_PER_KB = 1024;
const DECIMAL_PLACES = 2;

export function parseMagnet(item: { info_hash: string; name: string }): string {
  return `magnet:?xt=urn:btih:${item.info_hash}&dn=${encodeURIComponent(item.name)}`;
}

export function formatDate(str: string): string {
  const dt = Number(str) * UNIX_TIMESTAMP_TO_MS;
  if (isNaN(dt) || dt <= 0) return "Unknown";
  const date = new Date(dt);
  return new Intl.DateTimeFormat().format(date);
}

export function parseBytes(str: string): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let bytes = Number(str);
  let i = 0;

  while (bytes >= BYTES_PER_KB && i < units.length - 1) {
    bytes /= BYTES_PER_KB;
    i++;
  }

  return `${bytes.toFixed(DECIMAL_PLACES)} ${units[i]}`;
}

export function parseItem(item: SearchResult) {
  const { name, seeders, leechers, size, added } = item;

  const nom = `${chalk.green(seeders)}/${chalk.red(leechers)} ${name} ${
    chalk.blue(parseBytes(size))
  }`;

  const description = `Seeds: ${chalk.green(seeders)}, leechers: ${
    chalk.red(leechers)
  } ${name} 
  ${chalk.blue(parseBytes(size))}, added ${chalk.blue(formatDate(added))}`;

  return {
    name: nom,
    description,
    value: parseMagnet(item),
  };
}
