use rolldown_plugin_native_abi::{
    register_plugin, HookUsage, NativePlugin, PluginContext, TransformArgs, TransformOutput,
};
use solidjs_compiler::{CompileOptions, compile};

struct SolidNativePlugin;

impl NativePlugin for SolidNativePlugin {
    const NAME: &'static str = "solid-native-compiler";
    const HOOKS: HookUsage = HookUsage::TRANSFORM;

    fn new(_config: &[u8]) -> Result<Self, String> {
        Ok(Self)
    }

    fn transform(
        &self,
        _ctx: PluginContext<'_>,
        args: TransformArgs<'_>,
    ) -> Result<Option<TransformOutput>, String> {
        if !args.id.ends_with(".jsx") && !args.id.ends_with(".tsx") {
            return Ok(None);
        }

        let options = CompileOptions {
            filename: Some(args.id.to_string()),
            source_map: false,
            ..CompileOptions::default()
        };
        let result = compile(args.code, &options).map_err(|error| error.to_string())?;

        Ok(Some(TransformOutput::code(result.code)))
    }
}

register_plugin!(SolidNativePlugin);
