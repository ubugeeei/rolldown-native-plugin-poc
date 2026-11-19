use rolldown_plugin_native_abi::{
    HookUsage, NativePlugin, PluginContext, TransformArgs, TransformOutput, register_plugin,
};
use vize_atelier_core::{CodegenOptions, TemplateSyntaxMode, options::CustomElementMatcher};
use vize_atelier_sfc::{
    ScriptCompileOptions, SfcCompileExperimentalOptions, SfcCompileOptions, SfcParseOptions,
    SfcScriptOutputMode, StyleCompileOptions, TemplateCompileOptions,
    compile_sfc_for_adapter_with_project, module_shape::finalize_module_output_with_map, parse_sfc,
};

struct VizeNativePlugin;

impl NativePlugin for VizeNativePlugin {
    const NAME: &'static str = "vize-native-compiler";
    const HOOKS: HookUsage = HookUsage::TRANSFORM;

    fn new(_config: &[u8]) -> Result<Self, String> {
        Ok(Self)
    }

    fn transform(
        &self,
        _ctx: PluginContext<'_>,
        args: TransformArgs<'_>,
    ) -> Result<Option<TransformOutput>, String> {
        if !args.id.ends_with(".vue") {
            return Ok(None);
        }

        let parse_options = SfcParseOptions {
            filename: args.id.into(),
            ..SfcParseOptions::default()
        };
        let filename = parse_options.filename.clone();
        let descriptor = parse_sfc(args.code, parse_options.clone())
            .map_err(|error| error.message.to_string())?;
        let has_scoped = descriptor.styles.iter().any(|style| style.scoped);
        let options = SfcCompileOptions {
            parse: parse_options,
            script: ScriptCompileOptions {
                id: Some(filename.clone()),
                ..ScriptCompileOptions::default()
            },
            template: TemplateCompileOptions {
                id: Some(filename.clone()),
                scoped: has_scoped,
                compiler_options: Some(Default::default()),
                ..TemplateCompileOptions::default()
            },
            style: StyleCompileOptions {
                id: filename,
                scoped: has_scoped,
                ..StyleCompileOptions::default()
            },
            ..SfcCompileOptions::default()
        };
        let result = compile_sfc_for_adapter_with_project(
            &descriptor,
            options,
            TemplateSyntaxMode::Standard,
            CustomElementMatcher::default(),
            CodegenOptions::default(),
            SfcScriptOutputMode::SeparateTemplate,
            SfcCompileExperimentalOptions::default(),
            false,
            None,
        )
        .map_err(|error| error.message.to_string())?;

        if !result.errors.is_empty() {
            let errors = result
                .errors
                .into_iter()
                .map(|error| error.message.to_string())
                .collect::<Vec<_>>()
                .join("\n");
            return Err(errors);
        }

        let (code, _, _) = finalize_module_output_with_map(result.code, false, result.map);

        Ok(Some(TransformOutput::code(code)))
    }
}

register_plugin!(VizeNativePlugin);
