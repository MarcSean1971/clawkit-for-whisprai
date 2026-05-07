# Release Checklist

## Before GitHub

- Run `npm test`.
- Run `npm run pack:dry`.
- Confirm `README.md` describes the command execution behavior clearly.
- Confirm `README.md` and `SECURITY.md` explain that persistent relay settings and optional OpenClaw launch settings use OpenClaw plugin config instead of a local pairing state file.
- Confirm issue templates are present.
- Confirm the repository URL in `package.json` and `openclaw.plugin.json` is correct.
- Confirm README and ClawHub listing explain Archie modes: In the cloud, Cloud + my computer, and On my computer.
- Confirm mobile wording says setup happens on desktop, but mobile can use an already paired computer.

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
  --version 0.1.10 \
  --source-repo MarcSean1971/clawkit-for-whisprai \
  --source-commit "$(git rev-parse HEAD)" \
  --source-ref main \
  --changelog "Document Archie Cloud, Local, and Cloud + My Computer setup" \
  --dry-run
```

## ClawHub Publish

Remove `--dry-run` after validation passes.

## After Publish

- Install from ClawHub on a clean OpenClaw setup.
- Run `openclaw whisprai status`.
- Start and revoke pairing.
- Check Cloud + my computer temporary and remembered connector pairing.
- Check mobile can use an already paired computer from the same WhisprAI account.
- Confirm configured relay settings survive a gateway restart through plugin config.
- Confirm silent jobs do not post noisy fallback replies.
- Check ClawHub scan status.
- Open a GitHub issue for any scanner notes or user-facing warnings that need clearer wording.
