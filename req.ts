import { oraPromise } from "ora";
import type { SearchResult } from "./types.ts";

export async function getData(query: string) {
  const baseURL = "https://apibay.org/q.php?q=";
  const q = baseURL + query;

  const resp = await oraPromise(fetch(q));
  const data = await oraPromise(resp.json()) as SearchResult[];

  if (hasData(data)) return data;
  return [];
}

function hasData(data: SearchResult[]) {
  if (data[0].info_hash.split("").some((s: string) => s !== "0")) return true;
  return false;
}
