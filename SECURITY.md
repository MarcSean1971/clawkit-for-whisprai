# Security

ClawKit for WhisprAI pairs a user's local OpenClaw computer with WhisprAI. Treat installation like running local code.

## Security Model

- Pairing is explicit and revocable.
- The plugin polls WhisprAI from the user's computer; it does not require a public inbound tunnel to the computer.
- Relay and inbound secrets should be stored in OpenClaw plugin config.
- The plugin keeps temporary pairing data in memory and does not read or write a local pairing state file.
- Public status output masks secrets.
- Hosted WhisprAI should never expose OpenClaw gateway URLs or relay secrets to normal users.
- Sensitive local actions should remain protected by OpenClaw's normal approval flows.
- One WhisprAI user must never be able to access another user's paired computer. Jobs should be scoped by user, session, and device.

## Installer Trust

WhisprAI's **Settings → OpenClaw Helper** flow offers downloadable installers for Windows, macOS, and Linux. These installers install or update OpenClaw, install **ClawKit for WhisprAI** from ClawHub, enable the plugin, restart the OpenClaw gateway, and optionally exchange a WhisprAI pairing code.

For **Cloud + my computer**, WhisprAI may present the download as a lightweight computer connector. That connector still installs the OpenClaw CLI pieces required to run the outbound relay, but users should not need to configure OpenClaw, a VPN, router rules, or a public tunnel.

## Command Execution Notice

This plugin intentionally uses Node's `child_process` API to launch the local OpenClaw executable:

```bash
openclaw agent --session-id whisprai:<conversation_id> --message <request> --json --timeout 600
```

This is the core bridge behavior. Marketplace scanners may flag the plugin because it executes a local command. That is expected. The plugin should only be installed by users who want WhisprAI to ask their own local OpenClaw agent to perform work.

By default the plugin launches `openclaw` from `PATH`. Users may optionally configure `openclawCommand` and `openclawArgsPrefix` in OpenClaw plugin config for custom launch environments. Do not point these settings at untrusted executables.

## What The Plugin Does Not Do

- It does not create a public tunnel to the user's OpenClaw gateway.
- It does not let one WhisprAI user access another user's paired computer.
- It does not intentionally collect analytics.
- It does not intentionally send local files by itself.
- It does not read local files for pairing state.
- It does not bypass OpenClaw approval flows.
- It does not print relay tokens or inbound secrets in status output.
- It does not post internal `NO_REPLY` or JSON metadata as a visible Archie response.

## Reporting Issues

Please open a private security advisory on GitHub before publicly disclosing security-sensitive issues.

For non-security bugs, pairing failures, workflow feedback, or feature requests, use GitHub Issues:

https://github.com/MarcSean1971/clawkit-for-whisprai/issues
