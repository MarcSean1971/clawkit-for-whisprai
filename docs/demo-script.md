# Demo Script

## Goal

Show that WhisprAI can pair with a user's own OpenClaw computer without exposing the computer to the public internet.

Also show the three Archie choices: **In the cloud**, **Cloud + my computer**, and **On my computer**.

## Script

1. Install the plugin.

```bash
openclaw plugins install @clawkit/clawkit-for-whisprai
openclaw plugins enable clawkit-whisprai
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
- Mobile can control an already paired computer, but setup happens on the computer.
- Archie becomes more useful because OpenClaw can use the user's local tools.
- OpenClaw approval flows still matter for sensitive actions.

## Cloud + My Computer Demo

Use this for non-technical users who want Archie Cloud to reach their computer only when needed:

1. In WhisprAI Settings, choose **Cloud + my computer**.
2. On desktop, click the connector download for Windows, macOS, or Linux.
3. Choose whether the link is temporary for 24 hours or remembered on this computer.
4. Open the downloaded connector and let it finish pairing.
5. From the same account on mobile, ask Archie to use the linked computer.
6. Turn off the computer or stop the connector and show the friendly offline message.
