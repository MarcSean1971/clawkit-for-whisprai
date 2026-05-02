# ClawHub / Marketplace Listing Draft

## Name

ClawKit for WhisprAI

## Short Description

Pair your OpenClaw computer with WhisprAI so Archie can act as a private local assistant.

## Long Description

ClawKit for WhisprAI connects WhisprAI's Archie assistant to the user's own OpenClaw computer through an explicit, revocable pairing flow. The plugin polls WhisprAI for queued work, runs the local OpenClaw agent, and sends Archie the visible assistant reply.

Hosted WhisprAI does not need direct access to `127.0.0.1`, a home router, a public tunnel, or the user's OpenClaw gateway. This keeps the user's computer private while still letting Archie use the user's local OpenClaw setup, configured tools, coding environment, browser workflows, and approval model.

Version 0.1.9 keeps the marketplace-safe config model and corrects the public ClawHub listing back to the proper ClawKit for WhisprAI name and source repository. It also improves relay behavior: silent lifecycle jobs are acknowledged without noisy replies, OpenClaw JSON/JSONL output is parsed more reliably, and custom OpenClaw launch commands can be configured through plugin settings.

This is an early public release. It is useful now, and it will be updated continuously. Constructive feedback, especially pairing issues, relay failures, privacy questions, and non-technical usability suggestions, is welcome at:

https://github.com/MarcSean1971/clawkit-for-whisprai/issues

## Install From ClawHub

```bash
openclaw plugins install @clawkit/clawkit-for-whisprai
openclaw plugins enable clawkit-whisprai
openclaw gateway restart
openclaw whisprai status
```

## Publish Command

After logging in with `clawhub login`, publish with:

```bash
clawhub package publish . \
  --family code-plugin \
  --name @clawkit/clawkit-for-whisprai \
  --display-name "ClawKit for WhisprAI" \
  --version 0.1.9 \
  --source-repo MarcSean1971/clawkit-for-whisprai \
  --source-commit "$(git rev-parse HEAD)" \
  --source-ref main \
  --changelog "Improve silent relay handling and configurable OpenClaw launch"
```

## Keywords

- ClawKit
- ClawKit for WhisprAI
- WhisprAI
- Archie
- OpenClaw
- private assistant
- local assistant
- computer use
- AI assistant
- local agent
- remote pairing

## Safety Notes

This plugin intentionally executes the local `openclaw agent` command. That is the product: WhisprAI queues work, and the user's own OpenClaw computer performs it locally. Marketplace scanners may flag command execution. The listing should make this clear so users understand exactly what they are installing.

The plugin does not read or write a local pairing state file in v0.1.9. Relay credentials and optional OpenClaw launch settings should be configured through OpenClaw plugin settings.
