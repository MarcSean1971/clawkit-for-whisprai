# ClawHub / Marketplace Listing Draft

## Name

ClawKit for WhisprAI

## Short Description

Pair Archie with OpenClaw Cloud, your own computer, or both through WhisprAI's safe connector flow.

## Long Description

ClawKit for WhisprAI connects WhisprAI's Archie assistant to the user's own OpenClaw computer through an explicit, revocable pairing flow. The plugin polls WhisprAI for queued work, runs the local OpenClaw agent, and sends Archie the visible assistant reply.

Hosted WhisprAI does not need direct access to `127.0.0.1`, a home router, a public tunnel, or the user's OpenClaw gateway. This keeps the user's computer private while still letting Archie use the user's local OpenClaw setup, configured tools, coding environment, browser workflows, and approval model.

WhisprAI exposes three Archie choices:

- **In the cloud**: Archie uses the shared admin-managed OpenClaw Cloud/VPS tool. No personal computer is linked.
- **Cloud + my computer**: Archie can use the shared cloud for VPS/Kali work and can also use a linked personal computer when the task needs that computer.
- **On my computer**: Archie routes local-computer tasks to the user's paired OpenClaw computer.

This plugin is the connector side for the local-computer choices. Desktop users download and open the connector from WhisprAI Settings. Mobile users can use an already paired computer from the same WhisprAI account, but setup should happen on the computer itself.

Version 0.1.10 updates the GitHub and ClawHub documentation for Archie Cloud, Archie Local, and Cloud + my computer setup. It keeps the marketplace-safe config model from 0.1.9: silent lifecycle jobs are acknowledged without noisy replies, OpenClaw JSON/JSONL output is parsed reliably, and custom OpenClaw launch commands can be configured through plugin settings.

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
  --version 0.1.10 \
  --source-repo MarcSean1971/clawkit-for-whisprai \
  --source-commit "$(git rev-parse HEAD)" \
  --source-ref main \
  --changelog "Document Archie Cloud, Local, and Cloud + My Computer setup"
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

The plugin does not read or write a local pairing state file. Relay credentials and optional OpenClaw launch settings should be configured through OpenClaw plugin settings.

Each paired computer should receive scoped credentials. Cloud/VPS jobs and local connector jobs must remain separated by WhisprAI user, session, and job ids so one user's task cannot be confused with another user's task.
