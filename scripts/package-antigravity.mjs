import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { REPO_ROOT, validatePlugin } from "./validate.mjs";

const RUNTIME_FILES = ["plugin.json", "mcp_config.json", "LICENSE"];
const RUNTIME_DIRS = ["assets", "rules", "skills", "references"];

const VARIANTS = [
  { id: "com", endpoint: "https://web.aixcut.com/mcp" },
  { id: "cn", endpoint: "https://web.aixcut.cn/mcp" },
];

function copyRecursive(src, dst) {
  fs.cpSync(src, dst, { recursive: true });
}

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

export function buildPackages({ outDir = path.join(REPO_ROOT, "dist"), copyDesktop = false } = {}) {
  const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "plugin.json"), "utf8"));
  const version = manifest.version;

  fs.mkdirSync(outDir, { recursive: true });
  const results = [];

  for (const variant of VARIANTS) {
    const tmpStage = fs.mkdtempSync(path.join(os.tmpdir(), `aixcut-antigravity-${variant.id}-`));
    try {
      const stageRoot = path.join(tmpStage, "aixcut");
      fs.mkdirSync(stageRoot, { recursive: true });

      for (const file of RUNTIME_FILES) {
        fs.copyFileSync(path.join(REPO_ROOT, file), path.join(stageRoot, file));
      }
      for (const dir of RUNTIME_DIRS) {
        copyRecursive(path.join(REPO_ROOT, dir), path.join(stageRoot, dir));
      }

      // Write variant-specific mcp_config.json
      const mcpConfig = {
        mcpServers: {
          aixcut: {
            url: variant.endpoint,
          },
        },
      };
      fs.writeFileSync(path.join(stageRoot, "mcp_config.json"), `${JSON.stringify(mcpConfig, null, 2)}\n`, "utf8");

      // Self-audit staged directory before zipping
      const validation = validatePlugin(stageRoot, {
        expectedEndpoint: variant.endpoint,
        checkRepoDocs: false,
      });
      if (!validation.ok) {
        throw new Error(`Staged ${variant.id} package failed validation:\n${validation.errors.join("\n")}`);
      }

      const zipName = `aixcut-antigravity-${variant.id}-${version}.zip`;
      const zipPath = path.join(outDir, zipName);
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

      // Zip contents with plugin.json at ZIP root (standard portable plugin bundle)
      execFileSync("zip", ["-rq", zipPath, "."], { cwd: stageRoot });

      // Audit ZIP entries
      const listing = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" })
        .split(/\r?\n/)
        .filter(Boolean);

      if (!listing.includes("plugin.json") || !listing.includes("mcp_config.json") || !listing.includes("rules/AGENTS.md")) {
        throw new Error(`ZIP ${zipName} missing required root entries`);
      }
      for (const forbidden of [".git/", "tests/", "scripts/", "package.json", "dist/"]) {
        if (listing.some((entry) => entry === forbidden || entry.startsWith(forbidden))) {
          throw new Error(`ZIP ${zipName} contains forbidden dev file: ${forbidden}`);
        }
      }

      const checksum = sha256File(zipPath);
      fs.writeFileSync(`${zipPath}.sha256`, `${checksum}  ${zipName}\n`, "utf8");

      if (copyDesktop) {
        const desktopReleaseDir = path.join(os.homedir(), "Desktop", "aixcut-plugins-release");
        fs.mkdirSync(desktopReleaseDir, { recursive: true });
        fs.copyFileSync(zipPath, path.join(desktopReleaseDir, zipName));
        fs.copyFileSync(`${zipPath}.sha256`, path.join(desktopReleaseDir, `${zipName}.sha256`));
      }

      results.push({
        variant: variant.id,
        endpoint: variant.endpoint,
        zipPath,
        zipName,
        checksum,
        entryCount: listing.length,
      });
    } finally {
      fs.rmSync(tmpStage, { recursive: true, force: true });
    }
  }

  return results;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const copyDesktop = process.argv.includes("--copy-desktop");
  const built = buildPackages({ copyDesktop });
  for (const item of built) {
    console.log(`Built ${item.zipName} (${item.entryCount} entries, endpoint=${item.endpoint}, sha256=${item.checksum.slice(0, 12)}...)`);
  }
}
