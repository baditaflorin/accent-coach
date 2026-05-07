.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview release clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@printf "Targets:\n"
	@printf "  install-hooks      Wire local git hooks\n"
	@printf "  dev                Run Vite dev server\n"
	@printf "  build              Build GitHub Pages output into docs/\n"
	@printf "  data               Mode A no-op\n"
	@printf "  test               Run unit tests\n"
	@printf "  smoke              Run Playwright smoke tests\n"
	@printf "  lint               Run linters and typecheck\n"
	@printf "  fmt                Format files\n"
	@printf "  pages-preview      Serve the built app like Pages\n"

install-hooks:
	git config core.hooksPath .githooks
	chmod +x .githooks/*

dev:
	npm run dev

build:
	npm run build
	test -f docs/index.html
	test -f docs/404.html

data:
	@printf "Mode A: static reference data is bundled in source.\n"

test:
	npm run test

test-integration:
	@printf "No integration tests for Mode A v1.\n"

smoke:
	npm run smoke

lint:
	npm run fmt:check
	npm run lint
	npm run typecheck

fmt:
	npm run fmt

pages-preview:
	npm run pages-preview

release:
	git tag v$$(node -p "require('./package.json').version")

clean:
	rm -rf docs coverage playwright-report test-results node_modules/.tmp

hooks-pre-commit:
	.githooks/pre-commit

hooks-commit-msg:
	.githooks/commit-msg .git/COMMIT_EDITMSG

hooks-pre-push:
	.githooks/pre-push
