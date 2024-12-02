# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1](https://github.com/deimonn/code-re2c/compare/v0.2.0...v0.2.1) - 2024-12-02

### Fixed

- Fixed the extension README not rendering properly within VSCode

## [0.2.0](https://github.com/deimonn/code-re2c/compare/v0.1.3...v0.2.0) - 2024-12-02

### Added

- Support for D, Haskell, Java, JavaScript, OCaml, Python, V and Zig
- Language detection for `.re` files; now instead of relying on the `files.associations` setting, the language of a file named like `lexer.re` will be inferred based on the contents of its first line (see the [README.md](README.md))
- Highlighting for the new `/*!svars:re2c ... */` and `/*!mvars:re2c ... */` blocks
- New `ignore` setting to determine files that the extension should ignore
- New `detect` setting to determine files for which the extension should infer their language

### Changed

- Extension now starts up with VSCode rather than when a supported language is detected; this is necessary since re2c 4.0 can work with potentially any language
- Touched up the extension description and logo a bit

### Removed

- The default associations created by this extension have been removed

## [0.1.3](https://github.com/deimonn/code-re2c/compare/v0.1.2...v0.1.3) - 2024-04-29

### Fixed

- Fixed `-` being highlighted as an operator at the beginning of a character class

## [0.1.2](https://github.com/deimonn/code-re2c/compare/v0.1.1...v0.1.2) - 2024-04-27

### Fixed

- Fixed `\]` escape not being properly detected in character classes

## [0.1.1](https://github.com/deimonn/code-re2c/compare/v0.1.0...v0.1.1) - 2024-04-26

### Fixed

- Fixed linting straight up not working <!-- Just how do I miss these things? -->

## [0.1.0](https://github.com/deimonn/code-re2c/releases/tag/v0.1.0) - 2024-04-26

- Initial release
