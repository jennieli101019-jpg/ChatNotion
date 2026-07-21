"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadModel() {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "src", "auto-backup.js"), "utf8"), context);
  return context.ChatNotionAutoBackup;
}

test("normalizes optional automatic backup settings", () => {
  const model = loadModel();
  assert.deepEqual({ ...model.normalizeSettings({ intervalMinutes: 10080, retention: 10 }) }, { intervalMinutes: 10080, retention: 10 });
  assert.deepEqual({ ...model.normalizeSettings({ intervalMinutes: 7, retention: 500 }) }, { intervalMinutes: 0, retention: 20 });
});

test("keeps only the newest configured automatic backups", () => {
  const model = loadModel();
  const names = [
    "notes.txt",
    "ChatNotion-auto-backup-2026-07-16T10-00-00Z.json",
    "ChatNotion-auto-backup-2026-07-16T11-00-00Z.json",
    "ChatNotion-auto-backup-2026-07-16T12-00-00Z.json"
  ];
  assert.deepEqual([...model.filesToDelete(names, 2)], ["ChatNotion-auto-backup-2026-07-16T10-00-00Z.json"]);
});

test("reads the current folder name from its saved directory handle", async () => {
  const model = loadModel();
  const status = await model.inspectDirectoryHandle({
    name: "Renamed backups",
    async queryPermission() { return "granted"; },
    entries() { return { async next() { return { done: true }; } }; }
  });

  assert.deepEqual({ ...status }, { permission: "granted", folderName: "Renamed backups" });
});

test("marks a renamed or moved folder as unavailable when its handle breaks", async () => {
  const model = loadModel();
  const status = await model.inspectDirectoryHandle({
    name: "Old name",
    async queryPermission() { return "granted"; },
    entries() { return { async next() { throw new Error("Entry no longer exists"); } }; }
  });

  assert.deepEqual({ ...status }, { permission: "unavailable", folderName: "" });
});
