import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { REPO_ROOT, validatePlugin } from "../scripts/validate.mjs";
import { buildPackages } from "../scripts/package-antigravity.mjs";

test("repository passes full Antigravity plugin specification validation", () => {
  const result = validatePlugin(REPO_ROOT);
  assert.equal(result.ok, true, `Validation errors:\n${result.errors.join("\n")}`);
  assert.equal(result.skillCount, 17);
});

test("plugin.json uses strictly supported Antigravity manifest fields", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "plugin.json"), "utf8"));
  assert.equal(manifest.name, "aixcut");
  assert.equal(manifest.displayName, "Aixcut");
  assert.equal(manifest.version, "1.0.0");
  assert.equal(manifest.logo, "assets/logo.svg");
  assert.equal(manifest.suggestedPrompts.length, 3);
  assert.equal("$schema" in manifest, false);
  assert.equal("extensions" in manifest, false);
});

test("mcp_config.json uses Streamable HTTP url for aixcut", () => {
  const mcp = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "mcp_config.json"), "utf8"));
  assert.deepEqual(mcp, {
    mcpServers: {
      aixcut: {
        url: "https://web.aixcut.com/mcp",
      },
    },
  });
});

test("packager produces clean, self-audited Global (.com) and China (.cn) ZIP bundles", () => {
  const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), "aixcut-antigravity-test-"));
  try {
    const built = buildPackages({ outDir: tmpOut, copyDesktop: false });
    assert.equal(built.length, 2);

    const comPkg = built.find((b) => b.variant === "com");
    const cnPkg = built.find((b) => b.variant === "cn");
    assert.ok(comPkg);
    assert.ok(cnPkg);

    const comMcp = JSON.parse(execFileSync("unzip", ["-p", comPkg.zipPath, "mcp_config.json"], { encoding: "utf8" }));
    assert.equal(comMcp.mcpServers.aixcut.url, "https://web.aixcut.com/mcp");

    const cnMcp = JSON.parse(execFileSync("unzip", ["-p", cnPkg.zipPath, "mcp_config.json"], { encoding: "utf8" }));
    assert.equal(cnMcp.mcpServers.aixcut.url, "https://web.aixcut.cn/mcp");
  } finally {
    fs.rmSync(tmpOut, { recursive: true, force: true });
  }
});
