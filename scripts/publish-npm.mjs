#!/usr/bin/env node
/**
 * Publish @nqlib/nqchart to the public npm registry.
 *
 * Publishes from the repo root (the library and the Next.js docs app share one
 * package.json; only the "files" allowlist ships). prepublishOnly runs the
 * verify:publish gate.
 *
 * Usage (from repo root):
 *   pnpm publish:npm
 *   pnpm publish:npm -- --otp=123456   # 2FA code from authenticator
 *   NPM_OTP=123456 pnpm publish:npm
 */
import { readFileSync } from "node:fs";
import { spawnSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const registry = "https://registry.npmjs.org";

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const otpArg = process.argv.find((a) => a.startsWith("--otp="));
const otp = process.env.NPM_OTP ?? otpArg?.slice("--otp=".length);

function whoami() {
  try {
    return execSync(`npm whoami --registry=${registry}`, {
      encoding: "utf8",
      cwd: root,
    }).trim();
  } catch {
    return null;
  }
}

function isPublished(name, version) {
  try {
    const v = execSync(`npm view ${name}@${version} version --registry=${registry}`, {
      encoding: "utf8",
      cwd: root,
    }).trim();
    return v === version;
  } catch {
    return false;
  }
}

console.log(`publish:npm — ${pkg.name}@${pkg.version}\n`);

if (pkg.private) {
  console.error("publish:npm — package is marked private; cannot publish.");
  process.exit(1);
}

const user = whoami();
if (!user) {
  console.error("publish:npm — not logged in to npm.\n");
  console.error("Run web login, complete it in the browser, then retry:\n");
  console.error(`  npm login --auth-type=web --registry=${registry}\n`);
  process.exit(1);
}
console.log(`publish:npm — logged in as ${user}`);

if (isPublished(pkg.name, pkg.version)) {
  console.error(
    `publish:npm — ${pkg.name}@${pkg.version} is already on npm. Bump version in package.json first.`,
  );
  process.exit(1);
}

// pnpm publish runs prepublishOnly (the verify:publish gate). --no-git-checks
// because the gate is the real safety net, not a clean tree.
const args = ["publish", "--access", "public", "--no-git-checks", `--registry=${registry}`];
if (otp) args.push(`--otp=${otp}`);

console.log("publish:npm — running pnpm publish (prepublishOnly runs verify:publish)…\n");
const result = spawnSync("pnpm", args, {
  cwd: root,
  stdio: ["inherit", "inherit", "pipe"],
  shell: process.platform === "win32",
  encoding: "utf8",
  env: process.env,
});
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) {
  if (/cannot publish over|previously published|EPUBLISHCONFLICT/i.test(result.stderr ?? "")) {
    console.log(`\npublish:npm — ${pkg.name}@${pkg.version} is already on npm.`);
    process.exit(0);
  }
  process.exit(result.status ?? 1);
}

console.log(`\npublish:npm — published ${pkg.name}@${pkg.version}`);
