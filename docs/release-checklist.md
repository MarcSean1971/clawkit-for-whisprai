# Release Checklist

## Before GitHub

- Run `npm test`.
- Run `npm run pack:dry`.
- Confirm `README.md` describes the command execution behavior clearly.
- Confirm `SECURITY.md` explains relay secrets and revocation.
- Confirm issue templates are present.
- Confirm the repository URL in `package.json` and `openclaw.plugin.json` is correct.

## GitHub

```bash
git init
git add .
git commit -m "Prepare WhisprAI OpenClaw plugin for public release"
gh repo create MarcSean1971/whisprai-openclaw-plugin --public --source=. --remote=origin --push
```

## ClawHub Dry Run

```bash
clawhub package publish . \
  --family code-plugin \
  --name @whisprai/openclaw-plugin \
  --display-name "WhisprAI" \
  --version 0.1.0 \
  --source-repo MarcSean1971/whisprai-openclaw-plugin \
  --source-commit "$(git rev-parse HEAD)" \
  --source-ref main \
  --changelog "Initial public release" \
  --dry-run
```

## ClawHub Publish

Remove `--dry-run` after validation passes.

## After Publish

- Install from ClawHub on a clean OpenClaw setup.
- Run `openclaw whisprai status`.
- Start and revoke pairing.
- Check ClawHub scan status.
- Open a GitHub issue for any scanner notes or user-facing warnings that need clearer wording.
