# Contributing

Thanks for helping make the invisible visible.

## Local Setup

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Run `make install-hooks`.
4. Run `make dev`.

## Commits

Use Conventional Commits:

- `feat:` for user-facing features
- `fix:` for bug fixes
- `docs:` for documentation
- `test:` for tests
- `chore:` for maintenance

## Checks

Run these before pushing:

```sh
make fmt
make lint
make test
make build
make smoke
```

Do not commit secrets, private keys, real `.env` files, or generated scratch data.
