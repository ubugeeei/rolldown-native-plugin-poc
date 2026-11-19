import { resolve } from "node:path";

import { rolldown } from "rolldown";
import { nativePlugin } from "rolldown/experimental";

import { comparableFrameworks } from "./frameworks.mjs";

function frameworkByName(name) {
  const framework = comparableFrameworks.find((candidate) => candidate.name === name);
  if (!framework) throw new Error(`Unknown framework: ${name}`);
  return framework;
}

function isBareSpecifier(id) {
  return !id.startsWith(".") && !id.startsWith("/") && !id.startsWith("\0");
}

async function javascriptPlugin(framework, metrics) {
  const moduleUrl = new URL(framework.jsPlugin, import.meta.url);
  const module = await import(moduleUrl);
  return module[framework.jsPluginExport](metrics);
}

function serializableOutput(output) {
  return output.output
    .map((item) => {
      if (item.type === "asset") {
        return {
          fileName: item.fileName,
          source: String(item.source),
          type: item.type,
        };
      }

      return {
        code: item.code,
        dynamicImports: item.dynamicImports,
        exports: item.exports,
        fileName: item.fileName,
        imports: item.imports,
        type: item.type,
      };
    })
    .sort((left, right) => left.fileName.localeCompare(right.fileName));
}

export async function buildFixture({ framework: name, metrics, path, size }) {
  const framework = frameworkByName(name);
  const plugin =
    path === "js"
      ? await javascriptPlugin(framework, metrics)
      : nativePlugin(framework.nativePackage);
  const input = resolve("consumers", name, "fixtures", size, "src", "entry.js");
  const build = await rolldown({
    external: isBareSpecifier,
    input,
    plugins: [plugin],
  });

  try {
    const output = await build.generate({ format: "esm" });
    return serializableOutput(output);
  } finally {
    await build.close();
  }
}

export function stableOutput(output) {
  return `${JSON.stringify(output, null, 2)}\n`;
}
