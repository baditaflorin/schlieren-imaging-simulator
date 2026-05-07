# Deploy

Deployment mode: Mode A, GitHub Pages only.

Live URL: https://baditaflorin.github.io/schlieren-imaging-simulator/

Repository URL: https://github.com/baditaflorin/schlieren-imaging-simulator

## Publish

```sh
make lint
make test
make build
make smoke
git add .
git commit -m "chore: publish pages build"
git push
```

GitHub Pages is configured to serve the `main` branch from `/docs`.

## Preview

```sh
make build
make pages-preview
```

Open this complete local URL:

http://127.0.0.1:4173/schlieren-imaging-simulator/

## Rollback

Revert the publishing commit and push:

```sh
git revert <commit_sha>
git push
```

## Custom Domain

No custom domain is configured for v1. If one is added later, place a `CNAME` file in `docs/` and configure DNS with GitHub Pages according to the domain provider.

## Pages Notes

- Vite `base` is `/schlieren-imaging-simulator/`.
- `404.html` is copied from `index.html` for SPA fallback behavior.
- GitHub Pages does not support `_headers` or `_redirects`.
- The service worker scope is `/schlieren-imaging-simulator/`.
