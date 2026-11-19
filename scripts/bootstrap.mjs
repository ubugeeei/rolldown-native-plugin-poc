import { spawnSync } from "node:child_process";
import process from "node:process";

function run(command, args, cwd = process.cwd(), env = process.env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const pnpmEnvironment = {
  ...process.env,
  CI: "true",
  npm_config_manage_package_manager_versions: "false",
};

run("git", ["submodule", "update", "--init", "rolldown"]);
run("pnpm", ["install", "--frozen-lockfile"], process.cwd(), pnpmEnvironment);
run("pnpm", ["install", "--frozen-lockfile"], "rolldown", pnpmEnvironment);
run("just", ["build-rolldown"], "rolldown");
run("cargo", ["build", "--workspace", "--release"]);
run("node", ["scripts/stage-native-libraries.mjs"]);
run("node", ["scripts/generate-fixtures.mjs"]);
