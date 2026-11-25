import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "..");

export const ALLOWED_PLUGIN_KEYS = new Set([
  "name",
  "displayName",
  "description",
  "version",
  "author",
  "homepage",
  "repository",
  "logo",
  "suggestedPrompts",
  "disabled",
]);

export const EXPECTED_SKILLS = [
  "aixcut-basics",
  "aixcut-captions",
  "aixcut-documents",
  "aixcut-export",
  "aixcut-generation",
  "aixcut-host",
  "aixcut-known-errors",
  "aixcut-login",
  "aixcut-mcp-logout",
  "aixcut-projects",
  "aixcut-scenarios",
  "aixcut-talking-head",
  "aixcut-timeline-editing",
  "aixcut-verification",
  "aixcut-video-assembly",
  "aixcut-visual-effects",
  "aixcut-voice",
];

export const FORBIDDEN_PATTERNS = [
  /\bcodex\b/i,
  /\bworkbuddy\b/i,
  /\bkimi\b/i,
  /\bdoubao\b/i,
  /\bopenai\b/i,
  /workflow-host/i,
  /local-media-bridge/i,
  /download-capture-artifacts/i,
  /NODE_OPTIONS/,
  /<plugin-root>/,
  /plugin:\/\//,
  /\baixcut_render\b/,
  /\baixcut_operation\b/,
  /\bconfirm_upload\b/,
];

function walkFiles(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, result);
    else result.push(full);
  }
  return result;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  const fields = {};
  const lines = match[1].split(/\r?\n/);
  let currentKey = null;
  for (const line of lines) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      fields[currentKey] = kv[2].trim();
    } else if (currentKey && /^\s+/.test(line)) {
      fields[currentKey] = `${fields[currentKey]} ${line.trim()}`.trim();
    }
  }
  return fields;
}

export function validatePlugin(rootDir = REPO_ROOT, options = {}) {
  const { expectedEndpoint = "https://web.aixcut.com/mcp", checkRepoDocs = true } = options;
  const errors = [];

  // 1. Validate plugin.json
  const manifestPath = path.join(rootDir, "plugin.json");
  if (!fs.existsSync(manifestPath)) {
    errors.push("Missing plugin.json");
  } else {
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch (err) {
      errors.push(`Invalid plugin.json JSON: ${err.message}`);
    }
    if (manifest) {
      for (const key of Object.keys(manifest)) {
        if (!ALLOWED_PLUGIN_KEYS.has(key)) {
          errors.push(`Unsupported top-level key in plugin.json: "${key}"`);
        }
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.name || "")) {
        errors.push(`plugin.json name must be lowercase kebab-case, got "${manifest.name}"`);
      }
      if (!manifest.displayName || typeof manifest.displayName !== "string") {
        errors.push("plugin.json missing displayName");
      }
      if (!manifest.description || typeof manifest.description !== "string") {
        errors.push("plugin.json missing description");
      }
      if (!/^\d+\.\d+\.\d+$/.test(manifest.version || "")) {
        errors.push(`plugin.json version must be semver, got "${manifest.version}"`);
      }
      if (!manifest.logo || manifest.logo.startsWith("/") || /^https?:\/\//i.test(manifest.logo)) {
        errors.push(`plugin.json logo must be a relative path, got "${manifest.logo}"`);
      } else if (!fs.existsSync(path.join(rootDir, manifest.logo))) {
        errors.push(`plugin.json logo file does not exist: ${manifest.logo}`);
      }
      if (!Array.isArray(manifest.suggestedPrompts) || manifest.suggestedPrompts.length !== 3) {
        errors.push("plugin.json suggestedPrompts must contain exactly 3 prompts");
      }
    }
  }

  // 2. Validate mcp_config.json
  const mcpPath = path.join(rootDir, "mcp_config.json");
  if (!fs.existsSync(mcpPath)) {
    errors.push("Missing mcp_config.json");
  } else {
    let mcp;
    try {
      mcp = JSON.parse(fs.readFileSync(mcpPath, "utf8"));
    } catch (err) {
      errors.push(`Invalid mcp_config.json JSON: ${err.message}`);
    }
    if (mcp) {
      const server = mcp?.mcpServers?.aixcut;
      if (!server || typeof server !== "object") {
        errors.push("mcp_config.json must define mcpServers.aixcut");
      } else {
        if (server.url !== expectedEndpoint) {
          errors.push(`mcp_config.json url expected "${expectedEndpoint}", got "${server.url}"`);
        }
        if ("command" in server || "args" in server) {
          errors.push("mcp_config.json must use Streamable HTTP url, not stdio command/args");
        }
      }
    }
  }

  // 3. Validate rules/AGENTS.md (plain markdown, NO frontmatter)
  const rulesPath = path.join(rootDir, "rules", "AGENTS.md");
  if (!fs.existsSync(rulesPath)) {
    errors.push("Missing rules/AGENTS.md");
  } else {
    const rulesText = fs.readFileSync(rulesPath, "utf8");
    if (rulesText.trim().length < 50) {
      errors.push("rules/AGENTS.md is unexpectedly short");
    }
    if (/^---\r?\n/.test(rulesText)) {
      errors.push("rules/AGENTS.md must be plain markdown without YAML frontmatter");
    }
  }

  // 4. Validate skills
  const skillsDir = path.join(rootDir, "skills");
  if (!fs.existsSync(skillsDir)) {
    errors.push("Missing skills/ directory");
  } else {
    const actualSkills = fs
      .readdirSync(skillsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    for (const expected of EXPECTED_SKILLS) {
      if (!actualSkills.includes(expected)) {
        errors.push(`Missing required skill directory: skills/${expected}`);
      }
    }

    for (const skillName of actualSkills) {
      const skillFile = path.join(skillsDir, skillName, "SKILL.md");
      if (!fs.existsSync(skillFile)) {
        errors.push(`Missing SKILL.md in skills/${skillName}`);
        continue;
      }
      const text = fs.readFileSync(skillFile, "utf8");
      const fm = parseFrontmatter(text);
      if (!fm) {
        errors.push(`skills/${skillName}/SKILL.md missing YAML frontmatter`);
      } else {
        if (fm.name !== skillName) {
          errors.push(`skills/${skillName}/SKILL.md frontmatter name "${fm.name}" does not match folder "${skillName}"`);
        }
        if (!fm.description || fm.description.length < 10) {
          errors.push(`skills/${skillName}/SKILL.md missing valid description`);
        }
      }

      // Check relative markdown links resolve inside rootDir
      const linkRegex = /\[[^\]]+\]\(([^)#]+)(?:#[^)]*)?\)/g;
      for (const m of text.matchAll(linkRegex)) {
        const target = m[1].trim();
        if (/^(https?:|mailto:|customization:|file:)/i.test(target)) continue;
        const resolved = path.resolve(path.dirname(skillFile), target);
        if (!fs.existsSync(resolved)) {
          errors.push(`Broken relative link in skills/${skillName}/SKILL.md: ${target}`);
        }
      }
    }
  }

  // 5. Anti-leakage check across all runtime files
  const runtimeFiles = [
    path.join(rootDir, "plugin.json"),
    path.join(rootDir, "mcp_config.json"),
    ...walkFiles(path.join(rootDir, "rules")),
    ...walkFiles(path.join(rootDir, "skills")),
    ...walkFiles(path.join(rootDir, "references")),
  ].filter((f) => fs.existsSync(f));

  for (const file of runtimeFiles) {
    const content = fs.readFileSync(file, "utf8");
    const rel = path.relative(rootDir, file);
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(content)) {
        errors.push(`Forbidden host/legacy token ${pattern} found in ${rel}`);
      }
    }
    if (expectedEndpoint.includes(".com") && /aixcut\.cn/i.test(content)) {
      errors.push(`Unexpected aixcut.cn reference in Global runtime file: ${rel}`);
    }
  }

  // 6. Check repo docs (INSTALL.md & README.md)
  if (checkRepoDocs) {
    const installPath = path.join(rootDir, "INSTALL.md");
    if (!fs.existsSync(installPath)) {
      errors.push("Missing INSTALL.md");
    } else {
      const installText = fs.readFileSync(installPath, "utf8");
      if (!installText.includes("https://github.com/aixcut/Antigravity-plugin.git")) {
        errors.push("INSTALL.md must reference https://github.com/aixcut/Antigravity-plugin.git");
      }
      if (!installText.includes("~/.gemini/config/plugins/aixcut")) {
        errors.push("INSTALL.md must reference ~/.gemini/config/plugins/aixcut");
      }
      if (!installText.includes("[Aixcut](customization://aixcut)")) {
        errors.push("INSTALL.md must include [Aixcut](customization://aixcut)");
      }
      if (installText.includes("plugin://")) {
        errors.push("INSTALL.md must not emit plugin:// links");
      }
    }
    if (!fs.existsSync(path.join(rootDir, "README.md"))) {
      errors.push("Missing README.md");
    }
    if (!fs.existsSync(path.join(rootDir, "LICENSE"))) {
      errors.push("Missing LICENSE");
    }
  }

  return { ok: errors.length === 0, errors, skillCount: EXPECTED_SKILLS.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validatePlugin(REPO_ROOT);
  if (!result.ok) {
    console.error("Validation failed:");
    for (const err of result.errors) console.error(`  - ${err}`);
    process.exit(1);
  }
  console.log(`Validation passed: plugin.json, mcp_config.json, rules/AGENTS.md, ${result.skillCount} skills, INSTALL.md, zero leakage.`);
}
