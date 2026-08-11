import { spawnSync } from "node:child_process";

if (process.platform !== "linux" || process.arch !== "x64") {
  console.log("Native Linux build bindings are not required on this platform.");
  process.exit(0);
}

const packages = [
  "@rolldown/binding-linux-x64-gnu@1.0.1",
  "lightningcss-linux-x64-gnu@1.31.1"
];
const result = spawnSync("npm", ["install", "--no-save", "--ignore-scripts", ...packages], {
  stdio: "inherit",
  shell: false
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
