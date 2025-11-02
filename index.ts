#!/usr/bin/env -S deno run --allow-read --allow-net --allow-env

import input from "npm:@inquirer/input";
import select from "npm:@inquirer/select";
import { writeText } from "https://deno.land/x/copy_paste/mod.ts";
import chalk from "npm:chalk";
import { oraPromise } from "npm:ora";

import { parseItem } from "./parsing.ts";
import type { SearchResult } from "./types.ts";

const API_BASE_URL = "https://apibay.org/q.php?q=";

function isSearchResultArray(data: unknown): data is SearchResult[] {
  return Array.isArray(data) && data.every((item) =>
    typeof item === "object" &&
    item !== null &&
    "info_hash" in item &&
    "name" in item &&
    "seeders" in item &&
    "leechers" in item &&
    "size" in item &&
    "added" in item
  );
}

async function searchLoop(): Promise<number> {
  console.clear();

  const query = await input({
    message: "Which distro are you interested in?",
  });

  const trimmedQuery = query?.trim() ?? "";
  if (trimmedQuery === "") {
    console.log("Please enter a search term");
    await input({ message: "Press enter to exit" });
    return 1;
  }

  if (trimmedQuery.length > 200) {
    console.log("Search term too long (max 200 characters)");
    await input({ message: "Press enter to exit" });
    return 1;
  }

  const q = API_BASE_URL + trimmedQuery;

  try {
    const resp = await oraPromise(fetch(q));

    if (!resp.ok) {
      console.error(`API error: ${resp.status} ${resp.statusText}`);
      await input({ message: "Press enter to exit" });
      return 1;
    }

    const jsonData = await oraPromise(resp.json());

    if (!isSearchResultArray(jsonData)) {
      console.error("Invalid API response format");
      await input({ message: "Press enter to exit" });
      return 1;
    }

    const data = jsonData;

    // Check if we got results - API returns empty array or placeholder with all-zero hash
    if (data.length === 0) {
      console.log("No results for", trimmedQuery);
      await input({ message: "Press enter to exit" });
      return 0;
    }

    // Check if result is the "no results" placeholder (all zeros in info_hash)
    const hasValidResults = data[0].info_hash !== "0000000000000000000000000000000000000000";

    if (hasValidResults) {
      const parsed = data.map((i) => parseItem(i));

      console.clear();

      const selected = await select({
        message: "Choose a distro",
        choices: parsed,
        pageSize: 20,
      });

      if (selected) {
        try {
          await writeText(selected);
          console.log("Copied", chalk.green(selected));
        } catch (error) {
          console.error("Failed to copy to clipboard:", (error as Error).message);
          console.log("Magnet link:", selected);
        }
      } else {
        console.log("No selection made");
        await input({ message: "Press enter to exit" });
        return 1;
      }

      await input({ message: "Press enter to exit" });
      return 0;
    } else {
      console.log("No results for", trimmedQuery);
      await input({ message: "Press enter to exit" });
      return 0;
    }
  } catch (error) {
    console.error("Network error:", (error as Error).message);
    await input({ message: "Press enter to exit" });
    return 1;
  }
}

async function main(): Promise<void> {
  const exitCode = await searchLoop();
  Deno.exit(exitCode);
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  Deno.exit(1);
});
