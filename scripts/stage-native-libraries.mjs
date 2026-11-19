import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

import { comparableFrameworks } from "./frameworks.mjs";

const libraryConvention = {
  darwin: { prefix: "lib", suffix: ".dylib" },
  linux: { prefix: "lib", suffix: ".so" },
  win32: { prefix: "", suffix: ".dll" },
}[process.platform];

if (!libraryConvention) {
  throw new Error(`Unsupported native plugin platform: ${process.platform}`);
}

for (const framework of comparableFrameworks) {
  const libraryName = `${libraryConvention.prefix}${framework.nativeTarget}${libraryConvention.suffix}`;
  const source = resolve("target", "release", libraryName);
  const destination = resolve("consumers", framework.name, "native", "dist", libraryName);

  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}
