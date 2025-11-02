#!/usr/bin/env -S deno run --allow-read --allow-net --allow-env --allow-run

import input from "npm:@inquirer/input";
import { writeText } from "https://deno.land/x/copy_paste/mod.ts";
import chalk from "npm:chalk";
import { oraPromise } from "npm:ora";

import { parseItem } from "./parsing.ts";
import type { SearchResult } from "./types.ts";
import customSelect from "./custom-select.ts";

const API_BASE_URL =
  Deno.env.get("PG_API_URL") || "https://apibay.org/q.php?q=";
const MAX_QUERY_LENGTH = 200;

function isSearchResultArray(data: unknown): data is SearchResult[] {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof item.info_hash === "string" &&
        typeof item.name === "string" &&
        typeof item.seeders === "string" &&
        typeof item.leechers === "string" &&
        typeof item.size === "string" &&
        typeof item.added === "string",
    )
  );
}

async function performSearch(query: string): Promise<number> {
  const trimmedQuery = query?.trim() ?? "";
  if (trimmedQuery === "") {
    console.log("Please enter a search term");
    return 1;
  }

  if (trimmedQuery.length > MAX_QUERY_LENGTH) {
    console.log(`Search term too long (max ${MAX_QUERY_LENGTH} characters)`);
    return 1;
  }

  const q = `${API_BASE_URL}${encodeURIComponent(trimmedQuery)}`;

  try {
    const resp = await oraPromise(fetch(q));

    if (!resp.ok) {
      console.error(
        chalk.red("✗ API error:"),
        `${resp.status} ${resp.statusText}`,
      );
      return 1;
    }

    const jsonData = await oraPromise(resp.json());

    if (!isSearchResultArray(jsonData)) {
      console.error(chalk.red("✗ Invalid API response format"));
      return 1;
    }

    // Check if we got results - API returns empty array or placeholder with all-zero hash
    if (jsonData.length === 0) {
      console.log("No results for", trimmedQuery);
      return 0;
    }

    // Check if result is the "no results" placeholder (all zeros in info_hash)
    const hasValidResults =
      jsonData[0].info_hash !== "0000000000000000000000000000000000000000";

    if (!hasValidResults) {
      console.log("No results for", trimmedQuery);
      return 0;
    }

    const parsed = jsonData.map((i) => parseItem(i));
    console.clear();

    // Keep showing results until user exits or requests new search
    while (true) {
      const result = await customSelect({
        message: "Choose a distro",
        choices: parsed,
        pageSize: 15,
        loop: true,
      });

      switch (result.type) {
        case "cancelled":
          Deno.exit(0);

        case "new_search":
          return -1; // Signal to start a new search

        case "selected": {
          const selected = result.value;
          // Find the torrent name from the parsed data
          const selectedItem = parsed.find((item) => item.value === selected);
          const torrentName = selectedItem?.name || "Unknown";

          try {
            await writeText(selected);
            console.log("\n" + chalk.green("✓ Copied to clipboard!"));
            console.log(chalk.bold("Torrent:"), torrentName);
            console.log(
              chalk.dim("Magnet link:"),
              chalk.cyan(selected.substring(0, 60) + "..."),
            );
            console.log(
              chalk.dim("\nPress enter to continue browsing results..."),
            );
            await input({ message: "" });
            console.clear();
          } catch (error) {
            console.error(
              chalk.red("✗ Failed to copy to clipboard:"),
              (error as Error).message,
            );
            console.log(chalk.bold("Torrent:"), torrentName);
            console.log(
              chalk.yellow("\nPlease copy the magnet link manually:"),
            );
            console.log(selected);
            console.log(
              chalk.dim("\nPress enter to continue browsing results..."),
            );
            await input({ message: "" });
            console.clear();
          }

          // Return success to signal completion
          return 0;
        }
      }
    }
  } catch (error) {
    console.error(chalk.red("✗ Network error:"), (error as Error).message);
    return 1;
  }
}

async function interactiveMode(): Promise<number> {
  // Loop for interactive mode - allow multiple searches
  while (true) {
    console.clear();

    const query = await input({
      message: "Enter search term:",
    });

    const result = await performSearch(query);

    // If result is -1, user requested new search, continue loop
    if (result === -1) {
      continue;
    }

    // For any other result (0 or 1), prompt to search again or exit
    if (result === 0) {
      await input({ message: "Press enter to search again or Ctrl+C to exit" });
      continue;
    } else {
      await input({ message: "Press enter to exit" });
      return result;
    }
  }
}

function showHelp(): void {
  console.log(`
pg - Search for torrent magnet links

Usage:
  pg [search term]    Search for torrents matching the search term
  pg                  Launch interactive search mode
  pg --help, -h       Show this help message

Examples:
  pg ubuntu           Search for "ubuntu"
  pg "debian 12"      Search for "debian 12" (use quotes for multi-word searches)
  pg                  Launch interactive mode

Interactive Mode Keybindings:
  ↑/↓ or k/j          Navigate through results (vim-style)
  g                   Jump to top of list
  G                   Jump to bottom of list
  /                   Start search/filter mode
  Esc                 Exit search mode
  Enter               Select result and copy magnet link to clipboard
  n                   Start a new search
  q                   Quit the program
  ?                   Toggle help display
  Ctrl+C              Exit the program

The selected magnet link will be copied to your clipboard.
`);
}

async function main(): Promise<void> {
  const args = Deno.args;

  // Check for help flag
  if (args.length > 0 && (args[0] === "--help" || args[0] === "-h")) {
    showHelp();
    Deno.exit(0);
  }

  // If arguments provided, join them as the search query (CLI mode)
  if (args.length > 0) {
    const query = args.join(" ");
    const exitCode = await performSearch(query);
    // In CLI mode, treat -1 (new search request) as success since we just exit
    Deno.exit(exitCode === -1 ? 0 : exitCode);
  } else {
    // Interactive mode
    const exitCode = await interactiveMode();
    Deno.exit(exitCode);
  }
}

main().catch((error) => {
  console.error(chalk.red("✗ Fatal error:"), error.message);
  Deno.exit(1);
});
