#!/usr/bin/env/ deno

import { input, select } from "npm:@inquirer/prompts";
import { writeText } from "https://deno.land/x/copy_paste/mod.ts";
import chalk from "npm:chalk";
import { oraPromise } from "npm:ora";

import { parseItem } from "./parsing.ts";
import type { SearchResult } from "./types.ts";

async function searchLoop() {
  console.clear();

  const query = await input({
    message: "Which distro are you interested in?",
  });

  if (query === undefined || query === "") {
    console.log("Please enter a search term");
    console.log("Press enter to exit");
    return 1;
  }

  const baseURL = "https://apibay.org/q.php?q=";

  const q = baseURL + query;

  const resp = await oraPromise(fetch(q));
  const data = await oraPromise(resp.json()) as SearchResult[];

  if (data[0].info_hash.split("").some((s: string) => s !== "0")) {
    const parsed = data.map((i) => parseItem(i));

    console.clear();

    const selection = select({
      message: "Chose a distro",
      choices: parsed,
      pageSize: 20,
    });

    const selected = await selection;
    if (selected) {
      writeText(selected);
    }

    console.log("Copied", chalk.green(selected));
    console.log("Press enter to exit");
  } else {
    console.log("No results for", query);
    console.log("Press enter to exit");
  }
}

async function main() {
  await searchLoop();
}

main();
