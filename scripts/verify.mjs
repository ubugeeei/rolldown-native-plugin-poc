import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

import { buildFixture, stableOutput } from "./build.mjs";
import { comparableFrameworks, selectedFixtureNames } from "./frameworks.mjs";

const fixtures = selectedFixtureNames(process.env.BENCH_FIXTURES);

for (const framework of comparableFrameworks) {
  for (const size of fixtures) {
    const javascript = await buildFixture({
      framework: framework.name,
      path: "js",
      size,
    });
    const native = await buildFixture({
      framework: framework.name,
      path: "native",
      size,
    });
    const javascriptOutput = stableOutput(javascript);
    const nativeOutput = stableOutput(native);
    const outputDirectory = resolve("benchmarks", "outputs", framework.name);

    await mkdir(outputDirectory, { recursive: true });
    await writeFile(resolve(outputDirectory, `${size}.js.json`), javascriptOutput);
    await writeFile(resolve(outputDirectory, `${size}.native.json`), nativeOutput);

    if (javascriptOutput !== nativeOutput) {
      const mismatch = resolve(outputDirectory, `${size}.mismatch.txt`);
      await writeFile(
        mismatch,
        `--- JavaScript ---\n${javascriptOutput}\n--- Native ---\n${nativeOutput}`,
      );
      throw new Error(`${framework.name}/${size} produced different output; inspect ${mismatch}`);
    }

    console.log(`verified ${framework.name}/${size}`);
  }
}
