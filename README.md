# Upload Sourcemaps

[![CI](https://github.com/faststats-dev/upload-sourcemap/actions/workflows/ci.yml/badge.svg)](https://github.com/faststats-dev/upload-sourcemap/actions/workflows/ci.yml)

GitHub Action to upload sourcemaps to FastStats.

## Usage

```yaml
- uses: faststats-dev/upload-sourcemap@v0.1
  with:
    dist-dir: dist
    api-key: ${{ secrets.FASTSTATS_API_KEY }}
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `dist-dir` | Directory containing the sourcemaps | Yes | `dist` |
| `api-key` | FastStats API key | Yes | - |
| `api-url` | FastStats API URL (for self-hosted) | No | `https://sourcemaps.faststats.dev` |
