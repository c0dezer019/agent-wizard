"use strict";

const { truncate } = require("./util");

// ---------------------------------------------------------------------------
// Terminal rendering primitives (escape codes, colors, boxes)
// ---------------------------------------------------------------------------

const ESC = "\x1B[";
const reverse = (s) => `${ESC}7m${s}${ESC}0m`;
const bold = (s) => `${ESC}1m${s}${ESC}0m`;
const dim = (s) => `${ESC}2m${s}${ESC}0m`;
const yellow = (s) => `${ESC}33m${s}${ESC}0m`;
const clearScreen = () => `${ESC}2J${ESC}H`;
const frameHome = () => `${ESC}H`;
function finalizeFrame(out) {
  return out.split("\n").join(`${ESC}K\n`) + `${ESC}J`;
}

const BOX = { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─" };

function buildLabeledBorder(leftCorner, rightCorner, label, width, leftPad) {
  if (!label) return dim(leftCorner + BOX.h.repeat(width - 2) + rightCorner);
  const pad = Math.min(Math.max(0, leftPad || 0), Math.max(0, width - 3));
  const maxLabelBar = Math.max(0, width - 3 - pad);
  const labelBar = truncate(` ${label} `, maxLabelBar);
  const dashes = Math.max(0, maxLabelBar - labelBar.length);
  return (
    dim(leftCorner + BOX.h.repeat(1 + pad)) +
    bold(labelBar) +
    dim(BOX.h.repeat(dashes) + rightCorner)
  );
}

module.exports = {
  ESC,
  reverse,
  bold,
  dim,
  yellow,
  clearScreen,
  frameHome,
  finalizeFrame,
  BOX,
  buildLabeledBorder,
};
