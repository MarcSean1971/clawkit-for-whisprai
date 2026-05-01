# ClawHub / Marketplace Listing Draft

## Name

WhisprAI

## Short Description

Pair your OpenClaw computer with WhisprAI so Archie can act as a private local assistant.

## Long Description

WhisprAI OpenClaw Plugin connects WhisprAI's Archie assistant to the user's own OpenClaw computer through an explicit, revocable pairing flow. The plugin polls WhisprAI for queued work, runs the local OpenClaw agent, and sends Archie the visible assistant reply.

Hosted WhisprAI does not need direct access to `127.0.0.1`, a home router, a public tunnel, or the user's OpenClaw gateway. This keeps the user's computer private while still letting Archie use the user's local OpenClaw setup, configured tools, coding environment, browser workflows, and approval model.

This is an early public release. It is useful now, and it will be updated continuously. Constructive feedback, especially pairing issues, relay failures, privacy questions, and non-technical usability suggestions, is welcome at:

https://github.com/MarcSean1971/whisprai-openclaw-plugin/issues

## Install From ClawHub

```bash
openclaw plugins install @whisprai/openclaw-plugin
openclaw plugins enable whisprai
openclaw gateway restart
openclaw whisprai status
```

## Publish Command

After logging in with `clawhub login`, publish with:

```bash
clawhub package publish . \
  --family code-plugin \
  --name @whisprai/openclaw-plugin \
  --display-name "WhisprAI" \
  --version 0.1.0 \
  --source-repo MarcSean1971/whisprai-openclaw-plugin \
  --source-commit "$(git rev-parse HEAD)" \
  --source-ref main \
  --changelog "Initial public release"
```

## Keywords

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
