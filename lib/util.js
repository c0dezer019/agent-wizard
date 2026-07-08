"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

// ---------------------------------------------------------------------------
// Small pure helpers shared across modules
// ---------------------------------------------------------------------------

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function expandHome(p) {
  if (!p) return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/") || p.startsWith("~\\"))
    return path.join(os.homedir(), p.slice(2));
  return p;
}

function truncate(s, n) {
  s = s || "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function stripQuotes(s) {
  if (s.length >= 2) {
    const first = s[0];
    const last = s[s.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return s.slice(1, -1);
    }
  }
  return s;
}

function wrapText(raw, width) {
  const w = Math.max(1, width);
  const out = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.length === 0) {
      out.push("");
      continue;
    }
    for (let i = 0; i < line.length; i += w) out.push(line.slice(i, i + w));
  }
  return out;
}

function computeViewport(rowsLength, selIndex, prevScroll, viewHeight) {
  if (viewHeight <= 0) return 0;
  let scroll = prevScroll;
  if (selIndex < scroll) scroll = selIndex;
  if (selIndex >= scroll + viewHeight) scroll = selIndex - viewHeight + 1;
  const maxScroll = Math.max(0, rowsLength - viewHeight);
  return Math.min(Math.max(scroll, 0), maxScroll);
}

module.exports = {
  isDir,
  expandHome,
  truncate,
  stripQuotes,
  wrapText,
  computeViewport,
};
