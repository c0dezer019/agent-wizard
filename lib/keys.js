"use strict";

// ---------------------------------------------------------------------------
// Raw-mode input: alt screen, keypress queue, resize repaint signal
// ---------------------------------------------------------------------------

let inAltScreen = false;
function enterAltScreen() {
  process.stdout.write("\x1B[?1049h\x1B[?25l");
  inAltScreen = true;
}
function exitAltScreen() {
  process.stdout.write("\x1B[?25h\x1B[?1049l");
  inAltScreen = false;
}
function isInAltScreen() {
  return inAltScreen;
}
function setRaw(enabled) {
  if (!process.stdin.isTTY) return;
  process.stdin.setRawMode(enabled);
  if (enabled) process.stdin.resume();
}

const keyQueue = [];
let keyResolver = null;

function onKeypressEvent(str, key) {
  const k = key ? { ...key, str } : { name: str, str };
  if (keyResolver) {
    const resolve = keyResolver;
    keyResolver = null;
    resolve(k);
  } else {
    keyQueue.push(k);
  }
}

function waitForKey() {
  if (keyQueue.length) return Promise.resolve(keyQueue.shift());
  return new Promise((resolve) => {
    keyResolver = resolve;
  });
}

const RESIZE_KEY = { name: "__resize__", str: "" };
function triggerRepaint() {
  if (keyResolver) {
    const resolve = keyResolver;
    keyResolver = null;
    resolve(RESIZE_KEY);
  } else if (keyQueue[keyQueue.length - 1] !== RESIZE_KEY) {
    keyQueue.push(RESIZE_KEY);
  }
}

function pauseKeyCapture() {
  process.stdin.removeListener("keypress", onKeypressEvent);
}
function resumeKeyCapture() {
  keyQueue.length = 0;
  process.stdin.on("keypress", onKeypressEvent);
}

const NON_TEXT_KEY_NAMES = new Set([
  "return",
  "enter",
  "escape",
  "backspace",
  "delete",
  "tab",
  "up",
  "down",
  "left",
  "right",
  "home",
  "end",
  "pageup",
  "pagedown",
]);

module.exports = {
  enterAltScreen,
  exitAltScreen,
  isInAltScreen,
  setRaw,
  onKeypressEvent,
  waitForKey,
  RESIZE_KEY,
  triggerRepaint,
  pauseKeyCapture,
  resumeKeyCapture,
  NON_TEXT_KEY_NAMES,
};
