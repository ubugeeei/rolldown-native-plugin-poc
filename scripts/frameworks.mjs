export const comparableFrameworks = [
  {
    extension: ".astro",
    jsPlugin: "../consumers/astro/js/plugin.mjs",
    jsPluginExport: "astroJsPlugin",
    name: "astro",
    nativePackage: "@poc/astro-native",
    nativeTarget: "astro_native_plugin",
  },
  {
    extension: ".svelte",
    jsPlugin: "../consumers/rsvelte/js/plugin.mjs",
    jsPluginExport: "rsvelteJsPlugin",
    name: "rsvelte",
    nativePackage: "@poc/rsvelte-native",
    nativeTarget: "rsvelte_native_plugin",
  },
  {
    extension: ".jsx",
    jsPlugin: "../consumers/solid/js/plugin.mjs",
    jsPluginExport: "solidJsPlugin",
    name: "solid",
    nativePackage: "@poc/solid-native",
    nativeTarget: "solid_native_plugin",
  },
  {
    extension: ".vue",
    jsPlugin: "../consumers/vize/js/plugin.mjs",
    jsPluginExport: "vizeJsPlugin",
    name: "vize",
    nativePackage: "@poc/vize-native",
    nativeTarget: "vize_native_plugin",
  },
];

export const fixtureSizes = {
  large: 2000,
  max: 100_000,
  medium: 500,
  small: 8,
};

export const defaultFixtureNames = ["small", "medium", "large"];

export function selectedFixtureNames(value) {
  if (value === undefined || value.length === 0) return defaultFixtureNames;

  const names = [...new Set(value.split(",").map((name) => name.trim()))];
  for (const name of names) {
    if (!(name in fixtureSizes)) {
      throw new Error(`Unknown fixture: ${name}`);
    }
  }
  return names;
}
