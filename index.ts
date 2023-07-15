#!/usr/bin/env/ bun

import { input, select } from "@inquirer/prompts";
import { writeText } from "https://deno.land/x/copy_paste/mod.ts";

import { parseItem } from "./parsing.ts";
import type { SearchResult } from "./types.ts";

async function main() {
  console.clear();

  let state = "waiting";

  const search = await input({
    message: "which distro are you interested in?",
  });

  if (search === undefined) {
    console.log("Please enter a search term");
    return 1;
  }

  const baseURL = "https://apibay.org/q.php?q=";

  const q = baseURL + search;

  const resp = await fetch(q);
  const data = await resp.json() as SearchResult[];
  state = "resolved";

  const parsed = data.map((i) => parseItem(i));

  console.clear();

  const selection = await select({
    message: "chose a linux distro",
    choices: parsed,
    pageSize: 20,
  });
  await writeText(selection);
  console.log("selected", selection);
}

main();
