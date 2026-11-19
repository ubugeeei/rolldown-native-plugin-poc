use rolldown_plugin_native_abi::{
    HookUsage, NativePlugin, PluginContext, TransformArgs, TransformOutput, register_plugin,
};
use rsvelte_core::compiler::{CompileOptions, compile};

struct RsvelteNativePlugin;

impl NativePlugin for RsvelteNativePlugin {
    const NAME: &'static str = "rsvelte-native-compiler";
    const HOOKS: HookUsage = HookUsage::TRANSFORM;

    fn new(_config: &[u8]) -> Result<Self, String> {
        Ok(Self)
    }

    fn transform(
        &self,
        _ctx: PluginContext<'_>,
        args: TransformArgs<'_>,
    ) -> Result<Option<TransformOutput>, String> {
        if !args.id.ends_with(".svelte") {
            return Ok(None);
        }

        let options = CompileOptions {
            filename: Some(args.id.to_string()),
            ..CompileOptions::default()
        };
        let result = compile(args.code, options).map_err(|error| error.to_string())?;

        Ok(Some(TransformOutput::code(result.js.code)))
    }
}

register_plugin!(RsvelteNativePlugin);
