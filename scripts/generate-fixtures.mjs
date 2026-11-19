import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { comparableFrameworks, fixtureSizes } from "./frameworks.mjs";

function componentSource(framework, index) {
  const label = `Component ${index}`;
  const values = `[${index}, ${index + 1}, ${index + 2}, ${index + 3}]`;

  switch (framework) {
    case "astro":
      return `---\nconst label = '${label}';\nconst values = ${values};\n---\n<section data-index="${index}">\n  <h2>{label}</h2>\n  <ul>{values.map((value) => <li>{value * 2}</li>)}</ul>\n</section>\n`;
    case "react":
    case "solid":
      return `const values = ${values};\n\nexport default function Component${index}() {\n  return (\n    <section data-index="${index}">\n      <h2>${label}</h2>\n      <ul>{values.map((value) => <li>{value * 2}</li>)}</ul>\n    </section>\n  );\n}\n`;
    case "rsvelte":
      return `<script>\n  const label = '${label}';\n  const values = ${values};\n</script>\n\n<section data-index="${index}">\n  <h2>{label}</h2>\n  <ul>\n    {#each values as value}\n      <li>{value * 2}</li>\n    {/each}\n  </ul>\n</section>\n`;
    case "vize":
      return `<script setup>\nconst label = '${label}'\nconst values = ${values}\n</script>\n\n<template>\n  <section data-index="${index}">\n    <h2>{{ label }}</h2>\n    <ul>\n      <li v-for="value in values" :key="value">{{ value * 2 }}</li>\n    </ul>\n  </section>\n</template>\n`;
    default:
      throw new Error(`Unknown fixture framework: ${framework}`);
  }
}

async function generateProject(framework, size, count) {
  const root = resolve("consumers", framework.name, "fixtures", size);
  const sourceDirectory = resolve(root, "src");
  await rm(root, { force: true, recursive: true });
  await mkdir(sourceDirectory, { recursive: true });

  const imports = [];
  const references = [];
  for (let index = 0; index < count; index += 1) {
    const identifier = `Component${index}`;
    const filename = `${identifier}${framework.extension}`;
    imports.push(`import ${identifier} from './${filename}';`);
    references.push(identifier);
    await writeFile(resolve(sourceDirectory, filename), componentSource(framework.name, index));
  }

  const entry = `${imports.join("\n")}\n\nexport const components = [\n  ${references.join(",\n  ")},\n];\n`;
  await writeFile(resolve(sourceDirectory, "entry.js"), entry);
  await writeFile(
    resolve(root, "fixture.json"),
    `${JSON.stringify({ count, framework: framework.name, size }, null, 2)}\n`,
  );
}

const fixtureFrameworks = [...comparableFrameworks, { extension: ".jsx", name: "react" }];

for (const framework of fixtureFrameworks) {
  for (const [size, count] of Object.entries(fixtureSizes)) {
    await generateProject(framework, size, count);
  }
}
