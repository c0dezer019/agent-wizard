"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync, spawn } = require("child_process");

const { yellow, ESC } = require("./theme");
const { triggerRepaint } = require("./keys");

// ---------------------------------------------------------------------------
// Update notification (bottom-right corner)
// ---------------------------------------------------------------------------

let updateAvailable = false;
const UPDATE_NOTICE_TEXT = "update available, run --update to update";

function checkForUpdate() {
  const repoDir = path.join(__dirname, "..");
  if (!fs.existsSync(path.join(repoDir, ".git"))) return;
  try {
    const proc = spawn("git", ["-C", repoDir, "fetch", "--quiet"], {
      stdio: "ignore",
    });
    proc.on("error", () => {});
    proc.on("close", (code) => {
      if (code !== 0) return;
      try {
        const local = spawnSync("git", ["-C", repoDir, "rev-parse", "HEAD"], {
          encoding: "utf8",
        });
        const remote = spawnSync("git", ["-C", repoDir, "rev-parse", "@{u}"], {
          encoding: "utf8",
        });
        if (
          local.status === 0 &&
          remote.status === 0 &&
          local.stdout.trim() !== remote.stdout.trim()
        ) {
          updateAvailable = true;
          triggerRepaint();
        }
        // eslint-disable-next-line no-empty
      } catch {}
    });
    // eslint-disable-next-line no-empty
  } catch {}
}

function updateNoticeEscape() {
  if (!updateAvailable) return "";
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows || 24;
  const col = Math.max(1, cols - UPDATE_NOTICE_TEXT.length + 1);
  return `${ESC}${rows};${col}H${yellow(UPDATE_NOTICE_TEXT)}`;
}

module.exports = { checkForUpdate, updateNoticeEscape };
