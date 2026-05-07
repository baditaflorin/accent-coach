# Contributing

Use small Conventional Commits such as `feat: add vowel target` or `fix: stabilize formant scoring`.

Before pushing:

```bash
make lint
make test
make build
make smoke
```

Run `make install-hooks` once per clone. Do not commit secrets, raw voice recordings, or large model files.
