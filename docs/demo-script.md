# Demo Script

## Goal

Show that WhisprAI can pair with a user's own OpenClaw computer without exposing the computer to the public internet.

## Script

1. Install the plugin.

```bash
openclaw plugins install @whisprai/openclaw-plugin
openclaw plugins enable whisprai
openclaw gateway restart
```

2. Check local status.

```bash
openclaw whisprai status
```

3. Start pairing.

```bash
openclaw whisprai pair start
```

4. Complete pairing from the WhisprAI Connect My Computer screen.

5. Ask Archie a practical local-computer question, for example:

> Ask my OpenClaw computer to inspect this project and suggest the next safest improvement.

6. Show the result returning inside WhisprAI.

7. Revoke pairing.

```bash
openclaw whisprai revoke
```

## What To Emphasize

- The user stays in control.
- Pairing is explicit and revocable.
- No router changes or public tunnel are needed.
- Archie becomes more useful because OpenClaw can use the user's local tools.
- OpenClaw approval flows still matter for sensitive actions.
