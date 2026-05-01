# Security

WhisprAI OpenClaw Plugin pairs a user's local OpenClaw computer with WhisprAI. Treat installation like running local code.

## Security Model

- Pairing is explicit and revocable.
- The plugin polls WhisprAI from the user's computer; it does not require a public inbound tunnel to the computer.
- Relay and inbound secrets are stored in the local OpenClaw state file.
- Public status output masks secrets.
- Hosted WhisprAI should never expose OpenClaw gateway URLs or relay secrets to normal users.
- Sensitive local actions should remain protected by OpenClaw's normal approval flows.

## Command Execution Notice

This plugin intentionally uses Node's `child_process` API to launch the local OpenClaw executable:

```bash
openclaw agent --session-id whisprai:<conversation_id> --message <request> --json --timeout 600
```

This is the core bridge behavior. Marketplace scanners may flag the plugin because it executes a local command. That is expected. The plugin should only be installed by users who want WhisprAI to ask their own local OpenClaw agent to perform work.

## What The Plugin Does Not Do

- It does not create a public tunnel to the user's OpenClaw gateway.
- It does not intentionally collect analytics.
- It does not intentionally send local files by itself.
- It does not bypass OpenClaw approval flows.
- It does not print relay tokens or inbound secrets in status output.

## Reporting Issues

Please open a private security advisory on GitHub before publicly disclosing security-sensitive issues.

For non-security bugs, pairing failures, workflow feedback, or feature requests, use GitHub Issues:

https://github.com/MarcSean1971/whisprai-openclaw-plugin/issues
