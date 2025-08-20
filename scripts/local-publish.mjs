#!/usr/bin/env node
import { sync as globSync } from "glob";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import inquirer from "inquirer";
import { execaCommandSync } from "execa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CACHE_FILE = path.resolve(__dirname, "..", ".prevSelections.gitignored.json");
const DRY_RUN = process.argv.includes("--dry-run");
const GIT = process.argv.includes("--git");
const YES = process.argv.includes("--yes");
const UPDATE_DEPS_TARGET_CONFIG_FILE = "updateDeps.gitignored.json";
const DOMAIN = "🏠➡️📦"; // local publish
let prev = [];
if (fs.existsSync(CACHE_FILE)) {
  try {
    prev = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch {}
}

const pkgs = globSync("./packages/*").filter((dir) =>
  fs.existsSync(path.join(dir, "package.json"))
);
if (!pkgs.length) {
  console.error(`${DOMAIN} Error: no packages found under ./packages/*`);
  process.exit(1);
}

const choices = pkgs.map((dir) => ({
  name: dir,
  checked: prev.includes(dir),
}));

(async () => {
  let selected = [];

  if (prev.length && YES) {
    selected = prev;
  } else {
    const ans = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selected",
        message: "Select packages",
        choices,
      },
    ]);
    selected = ans.selected;
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(selected, null, 2));

  const scopes = selected
    .map((dir) => {
      const pkgPath = path.join(dir, "package.json");
      const { name } = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      return `--scope=${name}`;
    })
    .join(" ");

  for (const dir of selected) {
    console.log(`${DOMAIN} dir: ${dir}`);
    execaCommandSync(
      [
        path.resolve(__dirname, "local-version-bump.sh"),
        ...(DRY_RUN ? ["--dry-run"] : []),
        ...(GIT ? ["--git"] : []),
      ].join(" "),
      { cwd: dir, stdio: "inherit", shell: true }
    );
  }

  execaCommandSync(`lerna run build ${scopes}`, {
    stdio: "inherit",
    shell: true,
  });
  // execaCommandSync(`git add --all`, { stdio: "inherit", shell: true });

  const versions = selected
    .map((dir) => {
      const pkgPath = path.join(dir, "package.json");
      const { name, version } = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      return `- ${name}@${version}`;
    })
    .join("\n");

  // execaCommandSync(`git commit -m "chore(prerelease):\n${versions}"`, {
  //   stdio: "inherit",
  //   shell: true,
  // });

  execaCommandSync(`lerna exec ${scopes} --concurrency 1 -- yarn local-publish`, {
    stdio: "inherit",
    shell: true,
  });

  // Update app deps without installing (slow) each time.
  console.log(`${DOMAIN} Running update dependency commands...`);
  for (const dir of selected) {
    const packageJSON = `${dir}/package.json`;
    console.log("Running update dependency commands...");
    execaCommandSync(
      `yarn tefe update-deps \
        -s ${packageJSON} \
        -t ${UPDATE_DEPS_TARGET_CONFIG_FILE} \
        --skip-postUpdateDependency`,
      {
        // cwd: dir,
        stdio: "inherit",
        shell: true,
      }
    );
  }
  // Allow installing once (slow)
  console.log(`${DOMAIN} Running slow post update commands on all...`);
  const NOOP_AS_SKIP_UPDATE_DEPS =
    "-s ./packages/CatalogService/package.json --skip-updateDependency ";
  execaCommandSync(
    [
      "yarn tefe update-deps",
      NOOP_AS_SKIP_UPDATE_DEPS,
      "-t updateDeps.gitignored.json",
    ].join(" "),
    {
      //cwd: dir,
      stdio: "inherit",
      shell: true,
    }
  );
})();
