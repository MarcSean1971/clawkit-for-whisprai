# Product Strategy

## Positioning

ClawKit for WhisprAI should be positioned as the safe bridge between a friendly assistant and the user's own computer.

Core message:

> Archie can help on your computer, but your computer does not need to be opened to the internet.

## Best Users

- WhisprAI users who want Archie to do real work, not only chat.
- Developers who want Archie to use OpenClaw, GitHub, local repos, and browser workflows.
- Power users who want a private local assistant controlled through a simple hosted interface.
- Teams that need explicit pairing, revocation, and local approval.

## Winning Features

- Very simple Connect My Computer flow.
- Clear status: paired, polling, last job, last error, revoked.
- Friendly troubleshooting when pairing fails.
- Strong security language that non-technical users can understand.
- Examples of useful Archie requests after pairing.
- Audit-friendly logs without leaking secrets.

## Product Risks

- Users may not understand that a local plugin is running on their computer.
- Marketplace scanners may flag command execution.
- OpenClaw output formats may change.
- Relay jobs can fail because of network, auth, or local OpenClaw issues.
- Users may expect Archie to bypass OpenClaw approval gates, which it should not do.

## Roadmap

- First-run checklist inside WhisprAI.
- Local health doctor command.
- Better Windows/macOS/Linux setup docs.
- Signed package and checksum instructions.
- Optional job types for repo inspection, browser testing, GitHub summaries, and file-safe workflows.
- User-facing activity log in WhisprAI.
- Better recovery from expired pairing codes and invalid relay tokens.
