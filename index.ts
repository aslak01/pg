#!/usr/bin/env/ bun

import { input, select } from "@inquirer/prompts";
import { rawlist } from "@inquirer/prompts";
import { parseItem } from "./parsing";
import type { SearchResult } from "./types";

async function main() {
  console.log("hi mom");

  let state = "waiting";

  // const search = process.argv.slice(2).join(" ");
  const search = await input({
    message: "which distro are you interested in?",
  });

  if (search === undefined) {
    console.log("Please enter a search term");
    return 1;
  }

  console.log("Search was", search);

  const baseURL = "https://apibay.org/q.php?q=";

  const q = baseURL + search;

  const resp = await fetch(q);
  const data = await resp.json() as SearchResult[];
  state = "resolved";

  const parsed = data.map((i) => parseItem(i));

  const parseToSelect = (item: typeof parsed[0]) => {
    const { name, description, value } = item;
    return {
      name,
      description,
      value,
    };
  };
  const selections = parsed.map(parseToSelect);
  type Choice = typeof selections[0];

  // console.log(selections.slice(0, 10));
  console.log("ready to select?");

  const selection = await select({
    message: "chose a linux distro",
    choices: selections,
  });
  console.log(selection);
}

main();
