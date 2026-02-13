<p align="center">
  <img src="https://raw.githubusercontent.com/deimonn/code-re2c/refs/heads/master/images/logo.png">
</p>

Experimental linting and syntax highlighting for [re2c](http://re2c.org)! Up-to-date with re2c 4.4.

## Usage

### Syntax highlighting

`re2c` code blocks are automatically detected and highlighted within C, C++, D, Go, Haskell, Java, JavaScript, OCaml, Python, Rust, V and Zig source files.

### Language detection

When working with a document with the `.re` extension, the underlying language gets inferred based on the contents of the first line:

Keyword          | Flag             | Language
--               | --               | --
`re2c`           | `--lang c`       | C/C++
`re2d`           | `--lang d`       | D
`re2go`          | `--lang go`      | Go
`re2hs`          | `--lang haskell` | Haskell
`re2java`        | `--lang java`    | Java
`re2js`          | `--lang js`      | JavaScript
`re2ocaml`       | `--lang ocaml`   | OCaml
`re2py`          | `--lang python`  | Python
`re2rust`        | `--lang rust`    | Rust
`re2swift`       | `--lang swift`   | Swift
`re2v`           | `--lang v`       | V
`re2zig`         | `--lang zig`     | Zig
Any of the above | `--lang none`    | *User-defined*

If it contains a **keyword**, it will be assumed to be of the corresponding language - unless it also contains a **flag**, in which case the flag's association takes precedence.

If no **keyword** is present, no language is assumed for the file.

You can extend this detection to other documents, or outright disable it, by overriding `code-re2c.re2c.detect`:

```JSON
"code-re2c.re2c.detect": [
  "**/*.re",
  "**/*.re2c"
]
```

### Diagnostics

Linting occurs only when you open a document or save it, as it relies on running and parsing command output. Only supported languages get diagnostics.

A `re2c` binary somewhere in your system is required for it. If its not on your `PATH`, you can manually set the path to it in your settings:

```JSON
"code-re2c.re2c.path": "/path/to/re2c"
```

By default, only the `-W` flag is passed to the `re2c` binary. You can override the arguments to pass in your settings:

```JSON
"code-re2c.re2c.arguments": ["-W", "-Werror-empty-character-class"]
```

### Disabling language detection & diagnostics

It is occassionally useful to prevent extensions such as this one from reporting errors for specific files. You can achieve this with the `code-re2c.re2c.ignore` setting:

```JSON
"code-re2c.re2c.ignore": ["**/*.py"]
```

### User-defined language support

Support for user-defined languages is currently minimal.

For one, VSCode engine limitations means no highlighting can be guaranteed for languages this extension doesn't already know about.

However, it is still possible to get the [Language Detection](#language-detection) to choose your language. When the `--lang none` flag is present, the presumed language is *user-defined*, which essentially means the value of the `code-re2c.re2c.customLanguageId` setting (not set by default):

```JSON
"code-re2c.re2c.customLanguageId": "my-language-id"
```

## Known issues

- The new `%{ ... %}` style blocks in 4.0 are not highlighted - the fear is that the syntax is so basic, it may incorrectly get picked up as a re2c block when it is actually not.

- Flex syntax mode is unsupported. Syntax highlighting is bound to be skewed when using features pertaining to it.

- Code blocks of language-specific code *within* a re2c block won't get properly colored. TextMate is simply too much of a headache to implement such a thing.

## Future directions

- Extension could definitely provide highlighting for the new re2c syntax files.

- Perhaps implement semantic highlighting to replace the TextMate grammar - allowing the extension to support any language, allowing the highlighting to be enabled/disabled programmatically (e.g. to only enable it for specific globs), and fixing at least two of the above mentioned issues.
