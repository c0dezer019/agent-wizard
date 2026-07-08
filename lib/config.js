"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

// ---------------------------------------------------------------------------
// Persistent config (bookmarks, tracked plugin agents)
// ---------------------------------------------------------------------------

function configFile() {
  return path.join(os.homedir(), ".claude", "agent-wizard", "config.json");
}

function loadConfig() {
  try {
    const raw = fs.readFileSync(configFile(), "utf8");
    const data = JSON.parse(raw);
    const bookmarks = Array.isArray(data.bookmarks)
      ? data.bookmarks
          .filter(
            (b) =>
              typeof b === "string" ||
              (b && typeof b === "object" && typeof b.glob === "string"),
          )
          .map((b) =>
            typeof b === "string"
              ? b
              : { glob: b.glob, exclude: Array.isArray(b.exclude) ? b.exclude : [] },
          )
      : [];
    const trackedPluginAgents = Array.isArray(data.trackedPluginAgents)
      ? data.trackedPluginAgents.filter((p) => typeof p === "string")
      : [];
    return { bookmarks, trackedPluginAgents };
  } catch {
    return { bookmarks: [], trackedPluginAgents: [] };
  }
}

function saveConfig(cfg) {
  const file = configFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        bookmarks: cfg.bookmarks,
        trackedPluginAgents: cfg.trackedPluginAgents,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
}

module.exports = { configFile, loadConfig, saveConfig };
