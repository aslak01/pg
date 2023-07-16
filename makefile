.PHONY: compile

compile:
	deno compile --allow-read --allow-net --allow-env --allow-run --target aarch64-apple-darwin index.ts

clean:
	rm pg*

