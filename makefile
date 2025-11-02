.PHONY: compile clean

compile:
	deno compile --allow-read --allow-net --allow-env --allow-run --target aarch64-apple-darwin index.ts

clean:
	rm -f pg
	rm -f pg.tar.gz

