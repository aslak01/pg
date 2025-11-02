# pg

tool to search for linux distribution magnet links

## Installation

install with homebrew (arm macs only):

```bash
brew install aslak01/stuff/pg
```

## Usage

### Command-line mode

Search directly from the command line:

```bash
pg ubuntu
pg "debian 12"
pg arch linux
```

### Interactive mode

Launch the interactive TUI by running `pg` without arguments:

```bash
pg
```

### Help

```bash
pg --help
```

## Build from source

download latest release source zip or clone repo

test:

```bash
deno run --allow-read --allow-net --allow-env --allow-run index.ts
```

compile a binary:

```bash
deno compile --allow-read --allow-net --allow-env --allow-run index.ts
```
