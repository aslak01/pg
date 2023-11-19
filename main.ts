#!/usr/bin/env/ deno

// import input from "@inquirer/input";
// import select from "@inquirer/select";
// import chalk from "chalk";
// import { oraPromise } from "ora";
import { Command } from "cliffy-command";
import { Select } from "cliffy-select";

import { writeText as copy } from "copy-paste";
import { parseItem } from "./parsing.ts";
import { getData } from "./req.ts";
import { isTruthy } from "./utils.ts";

const { args } = await new Command()
  .arguments("<input:string> [output:string]")
  .parse(Deno.args);
const arg = args[0];

async function main(query: unknown) {
  if (!isTruthy(arg) && typeof arg !== "string") {
    return 1;
  }
  const data = await getData(arg);
  if (data && data.length) {
    const options = data.map(parseItem);

    const selection = await Select.prompt({
      message: "pick",
      options,
    });
    await copy(selection);
    console.log(selection);
    return 0;
  }
}

main(arg);

//   if (data[0].info_hash.split("").some((s: string) => s !== "0")) {
//     const parsed = data.map((i) => parseItem(i));
//
//     console.clear();
//
//     const selection = select({
//       message: "Chose a distro",
//       choices: parsed,
//       pageSize: 20,
//     });
//
//     const selected = await selection;
//     if (selected) {
//       console.log(selected);
//       return;
//     }
//
//     console.log("Copied", chalk.green(selected));
//     console.log("Press enter to exit");
//   } else {
//     console.log("No results for", query);
//     console.log("Press enter to exit");
//   }
// }

// async function main() {
//   await searchLoop();
// }
//
// main();
