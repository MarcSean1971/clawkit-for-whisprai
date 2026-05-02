# Release Checklist

## Before GitHub

- Run `npm test`.
- Run `npm run pack:dry`.
- Confirm `README.md` describes the command execution behavior clearly.
- Confirm `README.md` and `SECURITY.md` explain that persistent relay settings and optional OpenClaw launch settings use OpenClaw plugin config instead of a local pairing state file.
- Confirm issue templates are present.
- Confirm the repository URL in `package.json` and `openclaw.plugin.json` is correct.

## GitHub

```bash
git init
git add .
git commit -m "Prepare ClawKit for WhisprAI for public release"
gh repo create MarcSean1971/clawkit-for-whisprai --public --source=. --remote=origin --push
```

## ClawHub Dry Run

```bash
clawhub package publish . \
  --family code-plugin \
  --name @clawkit/clawkit-for-whisprai \
  --display-name "ClawKit for WhisprAI" \
  --version 0.1.9 \
  --source-repo MarcSean1971/clawkit-for-whisprai \
  --source-commit "$(git rev-parse HEAD)" \
  --source-ref main \
  --changelog "Improve silent relay handling and configurable OpenClaw launch" \
  --dry-run
```

## ClawHub Publish

Remove `--dry-run` after validation passes.

## After Publish

- Install from ClawHub on a clean OpenClaw setup.
- Run `openclaw whisprai status`.
- Start and revoke pairing.
- Confirm configured relay settings survive a gateway restart through plugin config.
- Confirm silent jobs do not post noisy fallback replies.
- Check ClawHub scan status.
- Open a GitHub issue for any scanner notes or user-facing warnings that need clearer wording.
