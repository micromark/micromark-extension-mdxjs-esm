# micromark-extension-mdxjs-esm

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[micromark][]** extension to support ESM imports and exports of [MDX][] JS.

This package provides the low-level modules for integrating with the micromark
tokenizer but has no handling of compiling to HTML: go to a syntax tree instead.

You should use this with `mdast-util-mdxjs-esm` (**[mdast][]**).
Alternatively, use `micromark-extension-mdxjs` with `mdast-util-mdxjs` to
support all of MDX JS, which includes this package.
Or, use it through `remark-mdxjs` (**[remark][]**).

## Install

[npm][]:

```sh
npm install micromark-extension-mdxjs-esm
```

## Use

See `mdast-util-mdxjs-esm` for an example.

## API

### `syntax(options)`

Support ESM imports and exports of [MDX][].

The export of `syntax` is a function that can be called with options and returns
an extension for the micromark parser (to tokenize imports and exports; can be
passed in `extensions`).

##### `options`

###### `options.acorn`

Acorn parser to use ([`Acorn`][acorn]).

###### `options.acornOptions`

Options to pass to acorn (`Object`, default: `{ecmaVersion: 2020, locations:
true, sourceType: 'module'}`).
All fields except for `locations` can be set.

###### `options.addResult`

Whether to add an `estree` field to the `mdxjsEsm` token with the result
from acorn (`boolean`, default: `false`).

## Syntax

All valid imports and exports are supported, depending on what the given acorn
instance and configuration supports.

When the lowercase strings `export` or `import` are found, followed by unicode
whitespace (`\s`), we expect JavaScript.
Otherwise, like normal in markdown, we exit and it’ll end up as a paragraph.
We continue parsing until we find a line ending followed by a blank line.
At that point, we parse with acorn: it if parses, we found our block.
Otherwise, if parsing failed at the last character, it’s a blank line in the
code: we continue on until the next blank line and try again.
Otherwise, the acorn error is thrown.

```js
import a from "b"
import * as a from "b"
import {a} from "b"
import {a as b} from "c"
import a, {b as c} from "d"
import a, * as b from "c"
import "a"

export var a = ""
export const a = ""
export let a = ""
export var a, b
export var a = "a", b = "b"
export function a() {}
export class a {}
export var {a} = {}
export var {a: b} = {}
export var [a] = []
export default a = 1
export default function a() {}
export default class a {}
export * from "a"
export * as a from "b"
export {a} from "b"
export {a as b} from "c"
export {default} from "b"
export {default as a, b} from "c"

{/* Blank lines are supported in expressions: */}

export function a() {

  return "b"

}

{/* A blank line must be used after import/exports: this is incorrect! */}

import a from "b"
## Hello, world!
```

## Errors

### Could not parse import/exports with acorn: $error

This error occurs if acorn crashes (source: `micromark-extension-mdxjs-esm`,
rule id: `acorn`).
For example:

```js
import 1/1
```

### Unexpected `$type` in code: only import/exports are supported

This error occurs when a non-ESM construct is found (source:
`micromark-extension-mdxjs-esm`, rule id: `non-esm`).
For example:

```js
export var a = 1
var b
```

## Tokens

An `mdxjsEsm` token is used to reflect the block of import/exports in markdown.

It includes:

*   `lineEnding` for the `\r`, `\n`, and `\r\n`
*   `lineEndingBlank` for the same characters but when after potential
    whitespace and another line ending
*   `whitespace` for markdown spaces and tabs in blank lines
*   `mdxjsEsmData` for any character in a line of `mdxjsEsm`

## Related

*   [`remarkjs/remark`][remark]
    — markdown processor powered by plugins
*   [`micromark/micromark`][micromark]
    — the smallest commonmark-compliant markdown parser that exists
*   `micromark/micromark-extension-mdx`
    — micromark extension to support all of MDX
*   `micromark/micromark-extension-mdxjs`
    — micromark extension to support all of MDX JS
*   `micromark/micromark-extension-mdx-jsx`
    — micromark extension to support the JSX of MDX
*   `micromark/micromark-extension-mdx-expression`
    — micromark extension to support the expressions of MDX or MDX JS
*   `micromark/micromark-extension-mdx-md`
    — micromark extension to support the changes to markdown of MDX
*   `syntax-tree/mdast-util-mdx`
    — mdast utility to support all of MDX
*   `syntax-tree/mdast-util-mdxjs`
    — mdast utility to support all of MDX JS
*   [`syntax-tree/mdast-util-from-markdown`][from-markdown]
    — mdast parser using `micromark` to create mdast from markdown
*   [`syntax-tree/mdast-util-to-markdown`][to-markdown]
    — mdast serializer to create markdown from mdast

## Contribute

See [`contributing.md` in `micromark/.github`][contributing] for ways to get
started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/micromark/micromark-extension-mdxjs-esm/workflows/main/badge.svg

[build]: https://github.com/micromark/micromark-extension-mdxjs-esm/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/micromark/micromark-extension-mdxjs-esm.svg

[coverage]: https://codecov.io/github/micromark/micromark-extension-mdxjs-esm

[downloads-badge]: https://img.shields.io/npm/dm/micromark-extension-mdxjs-esm.svg

[downloads]: https://www.npmjs.com/package/micromark-extension-mdxjs-esm

[size-badge]: https://img.shields.io/bundlephobia/minzip/micromark-extension-mdxjs-esm.svg

[size]: https://bundlephobia.com/result?p=micromark-extension-mdxjs-esm

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/micromark/unist/discussions

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: https://wooorm.com

[contributing]: https://github.com/micromark/.github/blob/HEAD/contributing.md

[support]: https://github.com/micromark/.github/blob/HEAD/support.md

[coc]: https://github.com/micromark/.github/blob/HEAD/code-of-conduct.md

[micromark]: https://github.com/micromark/micromark

[from-markdown]: https://github.com/syntax-tree/mdast-util-from-markdown

[to-markdown]: https://github.com/syntax-tree/mdast-util-to-markdown

[remark]: https://github.com/remarkjs/remark

[mdast]: https://github.com/syntax-tree/mdast

[mdx]: https://github.com/mdx-js/mdx

[acorn]: https://github.com/acornjs/acorn
