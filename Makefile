.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview docker-build docker-push release compose-up compose-down clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ {printf "%-22s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-hooks: ## wire local git hooks
	git config core.hooksPath .githooks

dev: ## run the frontend dev server
	npm run dev

build: ## build GitHub Pages output into docs/
	npm run build
	test -f docs/index.html
	test -f docs/404.html

data: ## no-op for Mode A
	@echo "Mode A has no static data pipeline."

test: ## run unit tests
	npm test

test-integration: ## run integration tests
	@echo "No separate integration suite for Mode A v1."

smoke: ## build, serve docs/, and run Playwright smoke test
	npm run smoke

lint: ## run linters
	npm run lint
	npm run fmt:check

fmt: ## autoformat source files
	npm run fmt

pages-preview: ## serve docs/ locally like GitHub Pages
	npx vite preview --host 127.0.0.1 --port 4173

docker-build: ## skipped in Mode A
	@echo "Mode A has no Docker backend."

docker-push: ## skipped in Mode A
	@echo "Mode A has no Docker backend."

release: ## tag a local release after checks pass
	make lint test build smoke
	git tag v$$(node -p "require('./package.json').version")

compose-up: ## skipped in Mode A
	@echo "Mode A has no compose stack."

compose-down: ## skipped in Mode A
	@echo "Mode A has no compose stack."

clean: ## remove local build/test output
	rm -rf docs coverage playwright-report test-results

hooks-pre-commit:
	.githooks/pre-commit

hooks-commit-msg:
	.githooks/commit-msg .git/COMMIT_EDITMSG

hooks-pre-push:
	.githooks/pre-push
