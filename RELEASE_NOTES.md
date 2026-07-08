# Release Notes

Newest first, one line per change: `- YYYY-MM-DD: what changed`. The TUI's
header box reads the first 4 lines here on startup (see
`getRecentReleaseNotes` in `agent-wizard.js`) — add an entry here as part of
any user-visible change, same turn as the code/README update, so the header
stays accurate.

- 2026-07-08: Renamed project from `agents-wizard` (plural) to `agent-wizard` — script file, `~/.claude/agent-wizard/config.json` config path (auto-migrates from the old location on first run), and on-screen titles. `agents-wizard.js`/old repo/folder names are unaffected by this change; see README.
- 2026-07-08: Fixed the header box's right-edge alignment (the top border was rendering 1 character longer than every other line) and added a ✦ logo glyph next to the title.
- 2026-07-08: Header box now shows the last 4 entries from this file instead of the tool's own single `git log` line.
- 2026-07-08: Added a bordered header box (project/user dirs, recent changes) plus a `screenshot.svg` TUI mockup for the README.
- 2026-07-07: Copy an agent's file into another project via the `c` hotkey (Project/User/Plugin tabs) or the `/` search menu's "Copy to project…" action.
- 2026-07-07: `lsagents --update` pulls the latest agents-wizard checkout in place.
- 2026-07-07: Live search (`/`) across every scope at once, plus tracking a plugin agent into the User tab for in-place editing (`u`).
- 2026-07-07: Responsive layout — column widths and wrapping now follow the live terminal size.
- 2026-07-07: Initial agents-wizard TUI — Project/User/Plugin tabs, create/edit/delete/view, bookmarks.
