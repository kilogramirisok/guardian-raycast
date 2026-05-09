# Contributing to Guardian Raycast Extension

Thanks for your interest! This guide covers development, building, and publishing the Guardian Raycast extension.

## Development Setup

### Prerequisites
- macOS 12+ (Raycast runs on macOS only)
- Node.js 18+ 
- [Raycast](https://raycast.com) installed
- guardian CLI installed (`brew install kilogramirisok/guardian/guardian`)

### Install dependencies
```bash
cd guardian-raycast
npm install
```

### Development mode
```bash
npm run dev
```
This opens the extension in Raycast in dev mode. Changes to `src/` hot-reload.

### Build
```bash
npm run build
```
Validates types, creates optimized build. **Always run before pushing.**

### Lint
```bash
npm run lint
npm run fix-lint
```

## Project Structure

```
guardian-raycast/
├── assets/               # Extension icon (512×512 PNG)
│   └── extension-icon.png
├── src/
│   ├── status.tsx        # Menu bar command (5s poll, lock status)
│   ├── lock.tsx          # No-view: spawn guardian lock
│   ├── wrap.tsx          # Form UI: command input + blur level
│   ├── install.tsx       # No-view: brew install guardian CLI
│   ├── open-logs.tsx     # No-view: open terminal with logs
│   └── utils/
│       └── guardian.ts   # Binary detection, status, spawn, install
├── package.json          # Commands, preferences, manifest
├── tsconfig.json
└── CONTRIBUTING.md
```

## Commands

| Command | Mode | Purpose |
|---------|------|---------|
| `status` | menu-bar (5s interval) | Persistent icon showing lock state |
| `lock` | no-view | Spawns `guardian lock` detached |
| `wrap` | view (Form) | Input command, runs `guardian wrap -- <cmd>` |
| `install` | no-view | Installs guardian CLI via Homebrew |
| `open-logs` | no-view | Opens Terminal with guardian output |

## Adding a New Command

1. Create `src/your-command.tsx`
2. Add entry to `commands[]` in `package.json`:
   ```json
   {
     "name": "your-command",
     "title": "Your Command Title",
     "description": "What it does",
     "mode": "no-view"
   }
   ```
3. Import from `@raycast/api` and `./utils/guardian`
4. Always check `resolveBinary()` before calling guardian — show install prompt if missing

## Preferences

Defined in `package.json` → `preferences[]`:

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `guardianPath` | textfield | `""` | Override binary path |
| `defaultTimeout` | dropdown | `8h` | Lock auto-unlock timer |
| `defaultBlur` | dropdown | `0` | Screen overlay blur level |

## Binary Detection (`resolveBinary()`)

3-tier lookup in order:
1. User preference `guardianPath` (explicit override)
2. Brew defaults: `/opt/homebrew/bin/guardian` → `/usr/local/bin/guardian`
3. `$PATH` via `which guardian`

Every command must handle the "not installed" state gracefully — either show the install prompt or disable the action.

---

## Distribution

### Option A: Private Extension (Team/Organization)

No review, no approval. Published directly to your Raycast org.

1. **Create a Raycast organization** in Raycast → Settings → Teams
2. **Set `owner` in `package.json`:**
   ```json
   {
     "owner": "your-org-handle",
     "access": "private"
   }
   ```
3. **Authenticate:**
   ```bash
   npx ray login
   ```
4. **Publish:**
   ```bash
   npm run publish
   ```
   The extension is immediately available to all org members. A share link is copied to clipboard.

5. **Update:** Same flow — make changes, `npm run publish` again.

**Use this if:** you don't want the extension public, or it's internal tooling.

### Option B: Raycast Store (Public, Free for All Users)

Published via PR to `raycast/extensions`. Reviewed by Raycast team. Available to every Raycast user.

#### Step 1: Prepare assets

- **Extension icon:** 512×512px PNG in `assets/extension-icon.png`
  - Must be unique — do NOT use the default Raycast icon
  - Dark mode variant: `assets/extension-icon@dark.png` (optional)
- **Screenshots:** 2000×1250px PNG (16:10 landscape), 3–6 recommended
  - Use Raycast's built-in capture: `⌘⇧⌥+M` → "Save to Metadata"
  - Place in `metadata/` folder
- **README.md** with usage instructions

#### Step 2: Validate locally

```bash
npm run build   # Must pass with 0 errors
npm run lint    # Must pass
```

#### Step 3: Submit via `npm run publish`

```bash
npm run publish
```

This:
1. Authenticates with GitHub
2. Forks `raycast/extensions` (or uses existing fork)
3. Copies your extension into `extensions/guardian/`
4. Squashes commits
5. Opens a PR against `raycast/extensions` main branch

#### Step 4: PR checklist (from template)

You'll need to confirm:
- [ ] Read the [extension guidelines](https://developers.raycast.com/basics/prepare-your-extension-for-store)
- [ ] Read the [publishing docs](https://developers.raycast.com/basics/publishing-to-the-raycast-store)
- [ ] Ran `npm run build` and tested the distribution build
- [ ] Checked that `assets/` files are used by the extension
- [ ] Included a screencast/video demo

#### Step 5: CI checks (automatic)

The Raycast CI runs on your PR:
- **Build check** — `ray build` must pass
- **Lint check** — code style validation
- **Manifest validation** — package.json schema, required fields
- **npm-check** — dependency audit
- **CHANGELOG** — enforces changelog entry for new extensions
- **Ownership** — verifies only the extension author can modify it

#### Step 6: Code review

Raycast team reviews. Common rejection reasons to avoid:
- Generic icon or default Raycast icon
- Missing MIT license
- No `package-lock.json`
- Requesting Keychain access
- External analytics tracking
- Flickering empty states (show loading first)
- Missing placeholders in text fields
- Non-Title-Case command names
- Opaque binaries or downloading executables from untrusted URLs
- Non-US-English spelling

#### Step 7: Merge & publish

Once approved:
- PR is merged by maintainers
- Extension is auto-published to the Raycast Store
- Store URL is posted to the PR
- Available to all Raycast users in the Store search

**Timeline:** Typically a few days to 2 weeks depending on review queue (250+ open PRs typical).

### package.json requirements for Store

```json
{
  "name": "guardian",
  "title": "Guardian",
  "description": "Lock input, prevent sleep, keep agents running",
  "icon": "extension-icon.png",
  "author": "your-raycast-username",
  "categories": ["System", "Developer Tools"],
  "license": "MIT",
  "platforms": ["macOS"]
}
```

- `author` must be your **Raycast account username** (not GitHub)
- `license` must be `"MIT"`
- All command titles must follow **Title Case** (Apple Style Guide)
- `platforms` is required (our extension is macOS only)

### Pre-publish checklist

```bash
# 1. Build passes
npm run build

# 2. Lint passes  
npm run lint

# 3. Icon exists and is 512×512 PNG
file assets/extension-icon.png

# 4. No unused imports or assets
# 5. All commands have meaningful descriptions
# 6. Preferences have defaults and placeholders
# 7. Tested with guardian not installed (install flow)
# 8. Tested with guardian running (already-locked state)
# 9. Tested with guardian installed and idle (normal state)
```

## Releasing Updates

### Private
```bash
npm run publish
```

### Store
```bash
npm run publish  # Opens new commit on existing PR / creates update PR
```
If someone contributes on GitHub, sync their changes:
```bash
npx @raycast/api@latest pull-contributions
```

## Useful Links

- [Raycast Developer Docs](https://developers.raycast.com)
- [Prepare for Store](https://developers.raycast.com/basics/prepare-your-extension-for-store)
- [Publishing Guide](https://developers.raycast.com/basics/publishing-to-the-raycast-store)
- [Teams/Private Extensions](https://developers.raycast.com/basics/create-your-first-extension-for-teams)
- [Extension Guidelines](https://developers.raycast.com/basics/prepare-your-extension-for-store)
- [raycast/extensions repo](https://github.com/raycast/extensions)
- [Raycast API Reference](https://developers.raycast.com/api-reference)
