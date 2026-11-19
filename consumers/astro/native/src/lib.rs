use astro_codegen::{
    CompactMode, ScopedStyleStrategy, SourcemapOption, TransformOptions, transform,
};
use oxc_allocator::Allocator;
use oxc_parser::{ParseOptions, Parser};
use oxc_span::SourceType;
use rolldown_plugin_native_abi::{
    HookUsage, NativePlugin, PluginContext, TransformArgs, TransformOutput, register_plugin,
};

struct AstroNativePlugin;

impl NativePlugin for AstroNativePlugin {
    const NAME: &'static str = "astro-native-compiler";
    const HOOKS: HookUsage = HookUsage::TRANSFORM;

    fn new(_config: &[u8]) -> Result<Self, String> {
        Ok(Self)
    }

    fn transform(
        &self,
        _ctx: PluginContext<'_>,
        args: TransformArgs<'_>,
    ) -> Result<Option<TransformOutput>, String> {
        if !args.id.ends_with(".astro") {
            return Ok(None);
        }

        let allocator = Allocator::default();
        let parsed = Parser::new(&allocator, args.code, SourceType::astro())
            .with_options(ParseOptions::default())
            .parse_astro();

        if !parsed.errors.is_empty() {
            return Err(format!("Astro parse failed: {:?}", parsed.errors));
        }

        let options = TransformOptions {
            filename: Some(args.id.to_string()),
            normalized_filename: None,
            internal_url: None,
            sourcemap: SourcemapOption::None,
            astro_global_args: None,
            compact: CompactMode::Disabled,
            result_scoped_slot: false,
            scoped_style_strategy: ScopedStyleStrategy::Where,
            transitions_animation_url: None,
            annotate_source_file: false,
            strip_slot_comments: true,
            inline_component_assets: false,
            resolve_path: None,
            resolve_path_provided: false,
            preprocessed_styles: None,
        };
        let result = transform(&allocator, args.code, options, &parsed.root);

        Ok(Some(TransformOutput::code(result.code)))
    }
}

register_plugin!(AstroNativePlugin);
