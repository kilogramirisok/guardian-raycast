# Guardian

Lock keyboard and mouse input, prevent sleep, keep AI agents running safely unattended on macOS.

This extension controls the [guardian](https://github.com/kilogramirisok/guardian) macOS CLI — a free, open-source tool that blocks all HID input via CGEventTap while keeping the screen visible. Perfect for safely running AI coding agents (Claude Code, Codex, OpenCode) unattended.

## Requirements

- **macOS 14+** (Sonoma / Sequoia)
- **guardian CLI** — installed automatically on first use, or manually:
  ```bash
  brew install kilogramirisok/guardian/guardian
  ```
- **Accessibility permission** — granted on first run via System Settings → Privacy & Security → Accessibility

## Commands

### Guardian Status (Menu Bar)

Persistent menu bar icon showing current lock state. Polls every 5 seconds.

- 🟢 Green = ready
- 🔴 Red = locked (shows PID)
- 🟡 Yellow = CLI not installed (offers one-click install)

### Lock Input

Locks all keyboard and mouse input immediately. Shows HUD with PID.

- Unlock with **⌘⇧L** + Touch ID / password
- Auto-unlocks after configured timeout (default: 8h)

### Wrap Command

Lock input and run a command. Input auto-unlocks when the command exits.

Example: `claude --dangerously-skip-permissions`

### Install Guardian CLI

One-click install via Homebrew. Automatically triggered if the CLI is missing.

## Preferences

| Preference | Type | Default | Description |
|---|---|---|---|
| Guardian Binary Path | Text | Auto-detect | Override path to guardian binary |
| Default Lock Timeout | Dropdown | 8 hours | Auto-unlock timer for lock command |
| Default Blur Level | Dropdown | No blur | Screen overlay blur intensity |

## How It Works

1. Raycast spawns `guardian` as a detached background process
2. Guardian blocks all HID input via CGEventTap (only ⌘⇧L passes through)
3. Menu bar polls `/tmp/guardian.pid` for live status
4. Unlock via ⌘⇧L → Touch ID / password dialog, or auto-unlock on timeout / process exit

## Related

- [guardian CLI](https://github.com/kilogramirisok/guardian) — the macOS input locking tool
- [guardian-raycast](https://github.com/kilogramirisok/guardian-raycast) — this extension
