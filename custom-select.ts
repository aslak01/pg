import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  isUpKey,
  isDownKey,
  isEnterKey,
  Separator,
} from "npm:@inquirer/core";

import chalk from "npm:chalk";
import figures from "npm:figures";
import ansiEscapes from "npm:ansi-escapes";

type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  disabled?: boolean | string;
  type?: never;
};

type SelectResult<Value> =
  | { type: "selected"; value: Value }
  | { type: "cancelled" }
  | { type: "new_search" };

type Config<Value> = {
  message: string;
  choices: ReadonlyArray<Choice<Value> | Separator>;
  pageSize?: number;
  loop?: boolean;
  default?: unknown;
};

function isSelectable<Value>(
  item: Choice<Value> | Separator,
): item is Choice<Value> {
  return !Separator.isSeparator(item) && !item.disabled;
}

export default createPrompt(
  <Value extends unknown>(
    config: Config<Value>,
    done: (value: SelectResult<Value>) => void,
  ) => {
    const { choices } = config;
    const pageSize = config.pageSize ?? 15;
    const loop = config.loop ?? true;

    const [status, setStatus] = useState<string>("pending");
    const [cursorPosition, setCursorPosition] = useState<number>(() => {
      const startIndex = choices.findIndex(isSelectable);
      return startIndex < 0 ? 0 : startIndex;
    });

    // Search state
    const [searchMode, setSearchMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredChoices, setFilteredChoices] = useState<
      Array<Choice<Value> | Separator>
    >([...choices]);

    // Help display state
    const [showHelp, setShowHelp] = useState(false);

    // Filter choices based on search term
    const filterChoices = (term: string): Array<Choice<Value> | Separator> => {
      if (!term) return [...choices];

      const lowerTerm = term.toLowerCase();
      return choices.filter((choice) => {
        if (Separator.isSeparator(choice)) return false;
        const name = choice.name || String(choice.value);
        const desc = choice.description || "";
        return (
          name.toLowerCase().includes(lowerTerm) ||
          desc.toLowerCase().includes(lowerTerm)
        );
      });
    };

    // Update filtered choices when search term changes
    const updateFilter = (newTerm: string) => {
      setSearchTerm(newTerm);
      const filtered = filterChoices(newTerm);
      setFilteredChoices(filtered);
      // Reset cursor to first selectable item
      const firstSelectable = filtered.findIndex(isSelectable);
      if (firstSelectable >= 0) {
        setCursorPosition(firstSelectable);
      }
    };

    // Navigation helpers
    const moveCursor = (direction: "up" | "down") => {
      if (filteredChoices.length === 0) return;

      const delta = direction === "up" ? -1 : 1;
      let newPos = cursorPosition + delta;

      if (loop) {
        if (newPos < 0) newPos = filteredChoices.length - 1;
        if (newPos >= filteredChoices.length) newPos = 0;
      }

      while (
        newPos >= 0 &&
        newPos < filteredChoices.length &&
        !isSelectable(filteredChoices[newPos])
      ) {
        newPos += delta;
      }

      setCursorPosition(
        Math.max(0, Math.min(filteredChoices.length - 1, newPos)),
      );
    };

    const exitSearchMode = () => {
      setSearchMode(false);
      setSearchTerm("");
      setFilteredChoices([...choices]);
      const firstSelectable = choices.findIndex(isSelectable);
      setCursorPosition(firstSelectable >= 0 ? firstSelectable : 0);
    };

    const handleSelection = () => {
      if (status !== "pending" || filteredChoices.length === 0) return;
      const selectedChoice = filteredChoices[cursorPosition];
      if (
        selectedChoice &&
        isSelectable(selectedChoice) &&
        selectedChoice.value
      ) {
        setStatus("done");
        done({ type: "selected", value: selectedChoice.value });
      }
    };

    useKeypress((key: any) => {
      // Normalize key detection for consistent handling
      const isSlashKey =
        key.name === "slash" || key.sequence === "/" || key.name === "/";
      const isQuestionKey =
        key.name === "question" || key.sequence === "?" || key.name === "?";
      const isShiftG =
        key.sequence === "G" ||
        key.name === "G" ||
        (key.shift && key.name === "g");
      const isPrintable =
        key.sequence &&
        key.sequence.length === 1 &&
        /[\x20-\x7E]/.test(key.sequence);

      // Pattern match key actions
      type KeyAction =
        | { type: "quit" }
        | { type: "new_search" }
        | { type: "toggle_help" }
        | { type: "enter_search" }
        | { type: "exit_search" }
        | { type: "select" }
        | { type: "navigate"; direction: "up" | "down" }
        | { type: "jump"; position: "top" | "bottom" }
        | { type: "search_input"; char: string }
        | { type: "search_backspace" }
        | { type: "noop" };

      const getKeyAction = (): KeyAction => {
        // Quit (q)
        if (key.name === "q" && !searchMode && status === "pending") {
          return { type: "quit" };
        }

        // New search (n)
        if (key.name === "n" && !searchMode && status === "pending") {
          return { type: "new_search" };
        }

        // Toggle help (?)
        if (isQuestionKey) {
          return { type: "toggle_help" };
        }

        // Enter search mode (/)
        if (isSlashKey && !searchMode) {
          return { type: "enter_search" };
        }

        // Exit search mode (Escape)
        if (key.name === "escape" && searchMode) {
          return { type: "exit_search" };
        }

        // Select (Enter)
        if (isEnterKey(key)) {
          return { type: "select" };
        }

        // Search mode input
        if (searchMode) {
          if (key.name === "backspace") {
            return { type: "search_backspace" };
          }
          if (isPrintable) {
            return { type: "search_input", char: key.sequence };
          }
        }

        // Navigation
        if (isUpKey(key) || key.name === "k") {
          return { type: "navigate", direction: "up" };
        }
        if (isDownKey(key) || key.name === "j") {
          return { type: "navigate", direction: "down" };
        }

        // Jump commands (vim-style)
        if (key.name === "g" && !key.shift && !searchMode) {
          return { type: "jump", position: "top" };
        }
        if (isShiftG && !searchMode) {
          return { type: "jump", position: "bottom" };
        }

        return { type: "noop" };
      };

      const action = getKeyAction();

      switch (action.type) {
        case "quit":
          setStatus("cancelled");
          done({ type: "cancelled" });
          break;

        case "new_search":
          setStatus("new_search");
          done({ type: "new_search" });
          break;

        case "toggle_help":
          setShowHelp(!showHelp);
          break;

        case "enter_search":
          setSearchMode(true);
          setSearchTerm("");
          break;

        case "exit_search":
          exitSearchMode();
          break;

        case "select":
          handleSelection();
          break;

        case "navigate":
          moveCursor(action.direction);
          break;

        case "jump":
          if (filteredChoices.length > 0) {
            setCursorPosition(
              action.position === "top" ? 0 : filteredChoices.length - 1,
            );
          }
          break;

        case "search_input":
          updateFilter(searchTerm + action.char);
          break;

        case "search_backspace":
          updateFilter(searchTerm.slice(0, -1));
          break;

        case "noop":
          break;
      }
    });

    const prefix = usePrefix(status === "loading");

    // Calculate visible window
    const startIndex = Math.max(
      0,
      Math.min(
        cursorPosition - Math.floor(pageSize / 2),
        filteredChoices.length - pageSize,
      ),
    );
    const endIndex = Math.min(startIndex + pageSize, filteredChoices.length);
    const visibleChoices = filteredChoices.slice(startIndex, endIndex);

    // Render help text only if toggled on
    const helpText = showHelp
      ? chalk.dim("━".repeat(60)) +
        "\n" +
        chalk.cyan("  Keybindings:\n") +
        chalk.dim("  j/k (↓/↑)   Navigate results\n") +
        chalk.dim("  g/G         Jump to top/bottom\n") +
        chalk.dim("  /           Start search/filter\n") +
        chalk.dim("  Esc         Exit search mode\n") +
        chalk.dim("  Enter       Select result\n") +
        chalk.dim("  n           New search\n") +
        chalk.dim("  q           Quit\n") +
        chalk.dim("  ?           Toggle this help\n") +
        chalk.dim("━".repeat(60)) +
        "\n\n"
      : "";

    // Show help hint when not showing full help
    const helpHint = !showHelp ? chalk.dim("Press ? for help\n\n") : "";

    // Render search bar if in search mode
    const searchBar = searchMode
      ? chalk.yellow(`\nSearch: ${searchTerm}${figures.pointerSmall}`) + "\n"
      : "";

    // Render message
    const message = chalk.bold(config.message);

    // Render choices
    const choicesStr =
      filteredChoices.length === 0
        ? chalk.yellow("  No results found") +
          (searchMode
            ? chalk.dim("\n  Press Backspace to modify search or Esc to clear")
            : "")
        : visibleChoices
            .map(
              (
                choice,
                index: number,
              ) => {
                const actualIndex = startIndex + index;
                if (Separator.isSeparator(choice)) {
                  return ` ${choice.separator}`;
                }

                const isActive = actualIndex === cursorPosition;
                const name = choice.name || String(choice.value);

                if (choice.disabled) {
                  const disabledLabel =
                    typeof choice.disabled === "string"
                      ? choice.disabled
                      : "(disabled)";
                  return chalk.dim(`  ${name} ${disabledLabel}`);
                }

                const cursor = isActive ? figures.pointer : " ";
                const color = isActive ? chalk.cyan : (x: string) => x;

                return color(`${cursor} ${name}`);
              },
            )
            .join("\n");

    // Show count info
    const countInfo = searchMode
      ? chalk.dim(
          `\nShowing ${filteredChoices.length} of ${choices.length} results`,
        )
      : "";

    return `${helpText}${helpHint}${prefix} ${message}${searchBar}\n${choicesStr}${countInfo}${
      status === "done" || status === "cancelled" || status === "new_search"
        ? "\n"
        : ansiEscapes.cursorHide
    }`;
  },
);
