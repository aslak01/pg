import chalk from "npm:chalk";
import type { SearchResult } from "./types.ts";

const UNIX_TIMESTAMP_TO_MS = 1000;
const BYTES_PER_KB = 1024;
const DECIMAL_PLACES = 2;

export function parseMagnet(item: { info_hash: string; name: string }): string {
  // Validate info_hash is a 40-character hexadecimal string
  if (!/^[a-fA-F0-9]{40}$/.test(item.info_hash)) {
    throw new Error(`Invalid info_hash format: ${item.info_hash}`);
  }
  return `magnet:?xt=urn:btih:${item.info_hash}&dn=${encodeURIComponent(item.name)}`;
}

export function formatDate(str: string): string {
  const timestamp = Number(str);

  if (isNaN(timestamp) || timestamp <= 0) {
    return "Unknown";
  }

  const dt = timestamp * UNIX_TIMESTAMP_TO_MS;
  const date = new Date(dt);

  // Validate the date is reasonable (between 1970 and 2100)
  if (date.getFullYear() < 1970 || date.getFullYear() > 2100) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat().format(date);
}

export function parseBytes(str: string): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let bytes = Number(str);

  if (isNaN(bytes) || bytes < 0) {
    return "Unknown";
  }

  let i = 0;
  while (bytes >= BYTES_PER_KB && i < units.length - 1) {
    bytes /= BYTES_PER_KB;
    i++;
  }

  return `${bytes.toFixed(DECIMAL_PLACES)} ${units[i]}`;
}

export function parseItem(item: SearchResult) {
  const { name, seeders, leechers, size, added } = item;

  const nom = `${chalk.green(seeders)}/${chalk.red(leechers)} ${name} ${chalk.blue(
    parseBytes(size),
  )}`;

  const description = `Seeds: ${chalk.green(seeders)}, leechers: ${chalk.red(
    leechers,
  )} ${name} 
  ${chalk.blue(parseBytes(size))}, added ${chalk.blue(formatDate(added))}`;

  return {
    name: nom,
    description,
    value: parseMagnet(item),
  };
}
