"use strict";

const { spawnSync } = require("child_process");

const {
  clearScreen,
  frameHome,
  bold,
  reverse,
  dim,
  finalizeFrame,
} = require("./theme");
const {
  waitForKey,
  setRaw,
  exitAltScreen,
  enterAltScreen,
  pauseKeyCapture,
  resumeKeyCapture,
  NON_TEXT_KEY_NAMES,
} = require("./keys");
const { renderSpellEscape } = require("./image");
const { renderMenu } = require("./render");

// ---------------------------------------------------------------------------
// Text-input prompts and menus
// ---------------------------------------------------------------------------

// Sentinel returned by askLine/pickOption when the user asks to go back to
// the previous step (Shift+Tab), distinct from `null` (cancel, Esc) and a
// normal string/option value.
const BACK = Symbol("back");

async function askLine(promptText, spellSlot, initialValue) {
  let buffer = initialValue || "";
  let cursor = buffer.length;

  process.stdout.write(clearScreen());
  try {
    for (;;) {
      const before = buffer.slice(0, cursor);
      const atCursor = cursor < buffer.length ? buffer[cursor] : " ";
      const after = buffer.slice(cursor + 1);
      let out = frameHome() + renderSpellEscape(spellSlot);
      out += bold("Agent Wizard") + "\n\n";
      out += promptText + before + reverse(atCursor) + after + "\n\n";
      out += dim("Enter confirm   ←/→ move   Shift+Tab back   Esc cancel") + "\n";
      process.stdout.write(finalizeFrame(out));
      setRaw(true);
      const key = await waitForKey();
      if (key.ctrl && key.name === "c") process.exit(0);
      else if (key.name === "return" || key.name === "enter")
        return buffer.trim();
      else if (key.name === "escape") return null;
      else if (key.name === "tab" && key.shift) return BACK;
      else if (key.name === "left") cursor = Math.max(0, cursor - 1);
      else if (key.name === "right")
        cursor = Math.min(buffer.length, cursor + 1);
      else if (key.name === "home") cursor = 0;
      else if (key.name === "end") cursor = buffer.length;
      else if (key.name === "backspace") {
        if (cursor > 0) {
          buffer = buffer.slice(0, cursor - 1) + buffer.slice(cursor);
          cursor--;
        }
      } else if (key.name === "delete") {
        buffer = buffer.slice(0, cursor) + buffer.slice(cursor + 1);
      } else if (
        key.str &&
        !key.ctrl &&
        !key.meta &&
        !NON_TEXT_KEY_NAMES.has(key.name) &&
        !key.str.startsWith("\x1B")
      ) {
        buffer = buffer.slice(0, cursor) + key.str + buffer.slice(cursor);
        cursor += key.str.length;
      }
    }
  } finally {
    process.stdout.write(clearScreen());
  }
}

function openEditor(filePath) {
  const editor =
    process.env.VISUAL ||
    process.env.EDITOR ||
    (process.platform === "win32" ? "notepad" : "nano");
  exitAltScreen();
  setRaw(false);
  pauseKeyCapture();

  const res = spawnSync(editor, [filePath], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  resumeKeyCapture();
  enterAltScreen();
  return { editor, res };
}

async function pickOption(
  title,
  subtitleLines,
  options,
  spellSlot,
  enableBack = false,
) {
  let idx = 0;

  process.stdout.write(clearScreen());
  try {
    for (;;) {
      renderMenu(title, subtitleLines, options, idx, spellSlot, enableBack);
      setRaw(true);
      const key = await waitForKey();
      if (key.ctrl && key.name === "c") process.exit(0);
      else if (key.name === "up")
        idx = (idx + options.length - 1) % options.length;
      else if (key.name === "down") idx = (idx + 1) % options.length;
      else if (enableBack && key.name === "tab" && key.shift) return BACK;
      else if (key.name === "escape" || key.name === "q") return null;
      else if (key.name === "return") return options[idx];
    }
  } finally {
    process.stdout.write(clearScreen());
  }
}

module.exports = { askLine, openEditor, pickOption, BACK };
