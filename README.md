# Code re2c

Experimental linting and syntax highlighting for [re2c]!

## How to use

### File associations

`re2c` code blocks will be automatically detected within C, C++, Go and Rust
source files. In addition, this extension also creates the following default
associations:

Extension                         | Language
--                                | --
`*.re`, `*.c.re`                  | C
`*.cc.re`, `*.cpp.re`, `*.cxx.re` | C++
`*.go.re`                         | Go
`*.rs.re`                         | Rust

If you don't like the default `*.re` being tied to C, you can override it by
just modifying your `files.associations` in your `settings.json` file. For
example, to make the default language C++:

```JSON
"files.associations": {
    "*.re": "cpp"
}
```

### Linting

Linting occurs only when you open a document or save it, as it relies on running
and parsing command output.

A [re2c] binary somewhere in your system is required for it. If its not on your
`PATH`, you can manually set the path to it in your settings:

```JSON
"code-re2c.re2c.path": "/path/to/re2c"
```

By default, only the `-W` flag is passed to the re2c binary. You can override
the arguments to pass in your settings:

```JSON
"code-re2c.re2c.arguments": ["-W", "-Werror-empty-character-class"]
```

[re2c]: http://re2c.org/

## Known issues

- Flex syntax mode is unsupported. Syntax highlighting is bound to be skewed
  when using features pertaining to it.

- Code blocks of C/C++/Go/Rust *within* a re2c block won't get properly colored.
  TextMate is simply too much of a headache to implement such a thing.
