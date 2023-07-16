.PHONY: all current_system

all: linux macos windows

current_system:
	deno compile --allow-read --allow-net --allow-env --allow-run index.ts

linux:
	deno compile --allow-read --allow-net --allow-env --allow-run x86_64-unknown-linux-gnu index.ts

macos:
	deno compile --allow-read --allow-net --allow-env --allow-run x86_64-apple-darwin index.ts

windows:
	deno compile --allow-read --allow-net --allow-env --allow-run x86_64-pc-windows-msvc index.ts

clean:
	rm pg

