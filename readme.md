# micromark-extension-mdxjs-esm

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[micromark][] extension to support MDX ESM (`import x from 'y'`).

## Contents

*   [What is this?](#what-is-this)
*   [When to use this](#when-to-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`mdxjsEsm(options)`](#mdxjsesmoptions)
*   [Authoring](#authoring)
*   [Syntax](#syntax)
*   [Errors](#errors)
    *   [Could not parse import/exports with acorn: $error](#could-not-parse-importexports-with-acorn-error)
    *   [Unexpected `$type` in code: only import/exports are supported](#unexpected-type-in-code-only-importexports-are-supported)
*   [Tokens](#tokens)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package contains extensions that add support for ESM enabled by MDX to
[`micromark`][micromark].
It matches how imports and exports work in JavaScript through acorn.

## When to use this

These tools are all low-level.
In many cases, you want to use [`remark-mdx`][remark-mdx] with remark instead.
When you are using [`mdx-js/mdx`][mdxjs], that is already included.

Even when you want to use `micromark`, you likely want to use
[`micromark-extension-mdxjs`][micromark-extension-mdxjs] to support all MDX
features.
That extension includes this extension.

When working with [`mdast-util-from-markdown`][mdast-util-from-markdown], you
must combine this package with [`mdast-util-mdxjs-esm`][mdast-util-mdxjs-esm].

## Install

This package is [ESM only][esm].
In Node.js (version 12.20+, 14.14+, 16.0+, or 18.0+), install with [npm][]:

```sh
npm install micromark-extension-mdxjs-esm
```

In Deno with [`esm.sh`][esmsh]:

```js
import {mdxjsEsm} from 'https://esm.sh/micromark-extension-mdxjs-esm@1'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {mdxjsEsm} from 'https://esm.sh/micromark-extension-mdxjs-esm@1?bundle'
</script>
```

## Use

```js
import * as acorn from 'acorn'
import {micromark} from 'micromark'
import {mdxjsEsm} from 'micromark-extension-mdxjs-esm'

const output = micromark('import a from "b"\n\n# c', {
  extensions: [mdxjsEsm({acorn})]
})

console.log(output)
```

Yields:

```html
<h1>c</h1>
```

…which is useless: go to a syntax tree with
[`mdast-util-from-markdown`][mdast-util-from-markdown] and
[`mdast-util-mdxjs-esm`][mdast-util-mdxjs-esm] instead.

## API

This package exports the identifier `mdxjsEsm`.
There is no default export.

The export map supports the endorsed [`development` condition][condition].
Run `node --conditions development module.js` to get instrumented dev code.
Without this condition, production code is loaded.

### `mdxjsEsm(options)`

Add support for MDX ESM import/exports.

Function called with options to get a syntax extension for micromark.
That extension can be passed in `extensions`.

##### `options`

Configuration (required).

###### `options.acorn`

Acorn parser to use ([`Acorn`][acorn], required).

###### `options.acornOptions`

Options to pass to acorn (`Object`, default: `{ecmaVersion: 2020, locations:
true, sourceType: 'module'}`).
All fields except for `locations` can be set.

###### `options.addResult`

Whether to add an `estree` field to `mdxjsEsm` tokens with results from acorn
(`boolean`, default: `false`).

## Authoring

When authoring markdown with ESM, make sure to follow import and export
statements with blank lines before more markdown.

## Syntax

All valid imports and exports are supported, depending on what the given acorn
instance and configuration supports.

When the lowercase strings `export` or `import` are found, followed by unicode
whitespace (`\s`), we expect JavaScript.
Otherwise, like normal in markdown, we exit and it’ll end up as a paragraph.
We continue parsing until we find a line ending followed by a blank line.
At that point, we parse with acorn: it if parses, we found our block.
Otherwise, if parsing failed at the last character, we assume it’s a blank line
in code: we continue on until the next blank line and try again.
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

## Types

This package is fully typed with [TypeScript][].
It exports the additional type `Options`.

## Compatibility

This package is at least compatible with all maintained versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, 16.0+, and 18.0+.
It also works in Deno and modern browsers.

## Security

This package deals with compiling JavaScript.
If you do not trust the JavaScript, this package does nothing to change that.

## Related

*   [`micromark/micromark-extension-mdxjs`][micromark-extension-mdxjs]
    — micromark extension to support MDX
*   [`syntax-tree/mdast-util-mdxjs-esm`][mdast-util-mdxjs-esm]
    — mdast utility to support MDX ESM
*   [`remark-mdx`][remark-mdx]
    — remark plugin to support MDX syntax

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

[chat]: https://github.com/micromark/micromark/discussions

[npm]: https://docs.npmjs.com/cli/install

[esmsh]: https://esm.sh

[license]: license

[author]: https://wooorm.com

[contributing]: https://github.com/micromark/.github/blob/HEAD/contributing.md

[support]: https://github.com/micromark/.github/blob/HEAD/support.md

[coc]: https://github.com/micromark/.github/blob/HEAD/code-of-conduct.md

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[typescript]: https://www.typescriptlang.org

[condition]: https://nodejs.org/api/packages.html#packages_resolving_user_conditions

[micromark]: https://github.com/micromark/micromark

[micromark-extension-mdxjs]: https://github.com/micromark/micromark-extension-mdxjs

[mdast-util-mdxjs-esm]: https://github.com/syntax-tree/mdast-util-mdxjs-esm

[mdast-util-from-markdown]: https://github.com/syntax-tree/mdast-util-from-markdown

[remark-mdx]: https://mdxjs.com/packages/remark-mdx/

[mdxjs]: https://mdxjs.com

[acorn]: https://github.com/acornjs/acorn
