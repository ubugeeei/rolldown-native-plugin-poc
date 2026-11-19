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
  large: 256,
  small: 8,
};
