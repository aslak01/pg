.PHONY: all current_system

all: linux macos macos-intel windows

current_system:
	deno compile --allow-read --allow-net --allow-env --allow-run index.ts

linux:
	deno compile --allow-read --allow-net --allow-env --allow-run --target x86_64-unknown-linux-gnu index.ts -o pg-linux

macos-intel:
	deno compile --allow-read --allow-net --allow-env --allow-run --target x86_64-apple-darwin index.ts -o pg-macos-intel
	
macos:
	deno compile --allow-read --allow-net --allow-env --allow-run --target aarch64-apple-darwin index.ts -o pg-macos

windows:
	deno compile --allow-read --allow-net --allow-env --allow-run --target x86_64-pc-windows-msvc index.ts -o pg-win

clean:
	rm pg*

