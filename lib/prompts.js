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

async function askLine(promptText, spellSlot) {
  let buffer = "";

  process.stdout.write(clearScreen());
  try {
    for (;;) {
      let out = frameHome() + renderSpellEscape(spellSlot);
      out += bold("Agent Wizard") + "\n\n";
      out += promptText + buffer + reverse(" ") + "\n\n";
      out += dim("Enter confirm   Esc cancel/clear") + "\n";
      process.stdout.write(finalizeFrame(out));
      setRaw(true);
      const key = await waitForKey();
      if (key.ctrl && key.name === "c") process.exit(0);
      else if (key.name === "return" || key.name === "enter")
        return buffer.trim();
      else if (key.name === "escape") return "";
      else if (key.name === "backspace") buffer = buffer.slice(0, -1);
      else if (
        key.str &&
        !key.ctrl &&
        !key.meta &&
        !NON_TEXT_KEY_NAMES.has(key.name) &&
        !key.str.startsWith("\x1B")
      ) {
        buffer += key.str;
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

async function pickOption(title, subtitleLines, options, spellSlot) {
  let idx = 0;

  process.stdout.write(clearScreen());
  try {
    for (;;) {
      renderMenu(title, subtitleLines, options, idx, spellSlot);
      setRaw(true);
      const key = await waitForKey();
      if (key.ctrl && key.name === "c") process.exit(0);
      else if (key.name === "up")
        idx = (idx + options.length - 1) % options.length;
      else if (key.name === "down") idx = (idx + 1) % options.length;
      else if (key.name === "escape" || key.name === "q") return null;
      else if (key.name === "return") return options[idx];
    }
  } finally {
    process.stdout.write(clearScreen());
  }
}

module.exports = { askLine, openEditor, pickOption };
