{
  description = "Reproducible Rolldown native plugin benchmarks";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nixpkgs-x86_64-darwin.url = "github:NixOS/nixpkgs/nixpkgs-26.05-darwin";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { nixpkgs, nixpkgs-x86_64-darwin, rust-overlay, ... }:
    let
      systems = [
        "aarch64-darwin"
        "x86_64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in {
      devShells = forAllSystems (system:
        let
          overlays = [ (import rust-overlay) ];
          nixpkgsForSystem =
            if system == "x86_64-darwin"
            then nixpkgs-x86_64-darwin
            else nixpkgs;
          pkgs = import nixpkgsForSystem { inherit system overlays; };
          rust = pkgs.rust-bin.stable."1.100.0".minimal.override {
            extensions = [ "clippy" "rust-src" "rustfmt" ];
          };
        in {
          default = pkgs.mkShell {
            packages = with pkgs; [
              rust
              nodejs_24
              pnpm_10
              just
              git
              cmake
              ninja
              pkg-config
              llvmPackages.clang
              llvmPackages.libclang
              go
              zig
              jq
              hyperfine
            ];

            LIBCLANG_PATH = "${pkgs.llvmPackages.libclang.lib}/lib";
            RUST_BACKTRACE = "1";

            shellHook = ''
              export npm_config_store_dir="$PWD/.cache/pnpm-store"
              export CARGO_HOME="$PWD/.cache/cargo-home"
              mkdir -p "$npm_config_store_dir" "$CARGO_HOME"
            '';
          };
        });
    };
}
