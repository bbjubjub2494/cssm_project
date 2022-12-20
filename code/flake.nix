# The flake file is the entry point for nix commands
{
  description = "Nix set up for complex social systems project";

  # Inputs are how Nix can use code from outside the flake during evaluation.
  inputs.fup.url = "github:gytis-ivaskevicius/flake-utils-plus/v1.3.1";
  inputs.flake-compat.url = "github:edolstra/flake-compat";
  inputs.flake-compat.flake = false;

  # Outputs are the public-facing interface to the flake.
  outputs = inputs @ {
    self,
    fup,
    nixpkgs,
    ...
  }:
    fup.lib.mkFlake {
      inherit self inputs;

      channels.nixpkgs.patches = with nixpkgs.legacyPackages.x86_64-linux; [
        (fetchpatch {
          url = "https://github.com/NixOS/nixpkgs/commit/89867128a7b5127567d94436d718a476db189fe5.patch";
          hash = "sha256-SIdekUy77Qy/zxF2VPBKOpJhe4WGaTKpA+mTy3le8GE=";
        })
      ];

      outputsBuilder = channels: {
        devShells.default = channels.nixpkgs.callPackage nix/devshell.nix {};
      };
    };
}
