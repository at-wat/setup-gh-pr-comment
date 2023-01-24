# setup-gh-pr-comment
GitHub Action to setup gh-pr-comment

See https://github.com/at-wat/gh-pr-comment for the usage of the installed commands.

```yaml
jobs:
  example:
    steps:
      - uses: at-wat/setup-gh-pr-comment@v0
      - run: gh-pr-comment "title" "message"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
