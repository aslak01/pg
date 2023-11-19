#!/usr/bin/env/ deno

import { Command } from "cliffy-command";
import { Select } from "cliffy-select";

import { writeText as copy } from "copy-paste";
import { parseItem } from "./parsing.ts";
import { getData } from "./req.ts";
import { isTruthy } from "./utils.ts";

const { args } = await new Command()
  .arguments("<input:string> [output:string]")
  .parse(Deno.args);
const arg = args.join(" ");

async function main(query: string) {
  if (!isTruthy(query) && typeof query !== "string") {
    return 1;
  }
  const data = await getData(query);
  if (data && data.length) {
    const options = data.map(parseItem);

    const selection = await Select.prompt({
      message: "Pick",
      options,
    });
    await copy(String(selection));
    console.log(selection);
    return 0;
  }
}

main(arg);
