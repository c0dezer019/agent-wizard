"use strict";

const fs = require("fs");
const path = require("path");

const { ESC } = require("./theme");
const { MIN_DESC_WIDTH } = require("./constants");

// ---------------------------------------------------------------------------
// Inline image logo (header box + agent-creation flow flourish)
// ---------------------------------------------------------------------------

function supportsUnicode() {
  if (process.platform === "win32") {
    return Boolean(
      process.env.WT_SESSION ||
      process.env.CI ||
      process.env.TERM_PROGRAM === "vscode" ||
      process.env.ConEmuTask === "{cmd::Cmder}" ||
      process.env.TERM === "xterm-256color" ||
      process.env.TERM === "alacritty",
    );
  }
  return process.env.TERM !== "linux";
}
const LOGO = supportsUnicode() ? "✦" : "*";

function detectImageProtocol() {
  if (!process.stdout.isTTY) return null;
  if (process.env.AGENT_WIZARD_NO_LOGO) return null;
  if (process.env.TMUX || /screen/.test(process.env.TERM || "")) return null;
  if (process.env.TERM === "xterm-kitty" || process.env.KITTY_WINDOW_ID)
    return "kitty";
  if (
    process.env.TERM_PROGRAM === "iTerm.app" ||
    process.env.TERM_PROGRAM === "WezTerm" ||
    process.env.TERM_PROGRAM === "mintty" ||
    process.env.KONSOLE_VERSION
  ) {
    return "iterm";
  }
  return null;
}

const LOGO_PIXEL_WIDTH = 176;
const LOGO_PIXEL_HEIGHT = 164;

function loadLogoBase64(repoDir) {
  try {
    return fs
      .readFileSync(path.join(repoDir, "assets", "logo.png"))
      .toString("base64");
  } catch {
    return null;
  }
}

function itermImageEscape(base64, cols, rows) {
  return `\x1B]1337;File=inline=1;width=${cols};height=${rows};preserveAspectRatio=1:${base64}\x07`;
}

function kittyImageEscape(base64, cols, rows) {
  const CHUNK = 4096;
  let out = "";
  for (let i = 0; i < base64.length; i += CHUNK) {
    const chunk = base64.slice(i, i + CHUNK);
    const more = i + CHUNK < base64.length ? 1 : 0;
    const controls =
      i === 0 ? `a=T,f=100,c=${cols},r=${rows},m=${more}` : `m=${more}`;
    out += `\x1B_G${controls};${chunk}\x1B\\`;
  }
  return out;
}

function computeLogoGutter(imgRows, termWidth) {
  const cols = Math.round(imgRows * 2 * (LOGO_PIXEL_WIDTH / LOGO_PIXEL_HEIGHT));
  const clamped = Math.max(4, Math.min(cols, 24));
  const minTextWidth = MIN_DESC_WIDTH + 10;
  if (termWidth - clamped - 6 < minTextWidth) return 0;
  return clamped;
}

function placedImageEscape(protocol, base64, cols, rows, row, col) {
  const body =
    protocol === "kitty"
      ? kittyImageEscape(base64, cols, rows)
      : itermImageEscape(base64, cols, rows);
  return `${ESC}s${ESC}${row};${col}H${body}${ESC}u`;
}

function renderInlineLogoEscape(protocol, base64, cols, rows) {
  return placedImageEscape(protocol, base64, cols, rows, 2, 3);
}

const SPELL_PIXEL_WIDTH = 200;
const SPELL_PIXEL_HEIGHT = 171;

function loadSpellBase64(repoDir) {
  try {
    return fs
      .readFileSync(path.join(repoDir, "assets", "spell.png"))
      .toString("base64");
  } catch {
    return null;
  }
}

// Text (title, prompt, buffer, hint) lives in the top ~8 rows of the frame.
// Keep the spell image clear of that band entirely — bottom-most portion
// of the terminal only.
const SPELL_TEXT_ROWS = 10;

// Alternates left/right each call so consecutive question steps swap the
// spell's side instead of jumping to a random spot that could feel jarring
// (or, pre-fix, land on top of the text).
let spellSide = 0;

function pickSpellSlot(imageLogo, spellBase64) {
  if (!imageLogo || !spellBase64) return null;
  const termCols = process.stdout.columns || 80;
  const termRows = process.stdout.rows || 24;
  const rows = Math.max(4, Math.min(10, Math.floor(termRows * 0.35)));
  const cols = Math.max(
    6,
    Math.min(
      termCols - 4,
      Math.round(rows * 2 * (SPELL_PIXEL_WIDTH / SPELL_PIXEL_HEIGHT)),
    ),
  );
  if (termRows - rows < SPELL_TEXT_ROWS || termCols - cols < 4) return null;

  const row = termRows - rows; // pinned to the bottom-most portion
  const leftCol = 2;
  const rightCol = Math.max(2, termCols - cols - 1);
  const col = spellSide === 0 ? leftCol : rightCol;
  spellSide = 1 - spellSide;

  return {
    protocol: imageLogo.protocol,
    base64: spellBase64,
    cols,
    rows,
    row,
    col,
  };
}

function renderSpellEscape(slot) {
  return slot
    ? placedImageEscape(
        slot.protocol,
        slot.base64,
        slot.cols,
        slot.rows,
        slot.row,
        slot.col,
      )
    : "";
}

module.exports = {
  supportsUnicode,
  LOGO,
  detectImageProtocol,
  loadLogoBase64,
  computeLogoGutter,
  renderInlineLogoEscape,
  loadSpellBase64,
  pickSpellSlot,
  renderSpellEscape,
};
