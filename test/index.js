/**
 * @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {Parser} from 'acorn'
import acornJsx from 'acorn-jsx'
import {micromark} from 'micromark'
import {mdxjsEsm} from 'micromark-extension-mdxjs-esm'

const own = {}.hasOwnProperty

const acorn = Parser.extend(acornJsx())

/** @type {HtmlExtension} */
const html = {
  enter: {
    mdxjsEsm() {
      this.buffer()
    }
  },
  exit: {
    mdxjsEsm() {
      this.resume()
      this.setData('slurpOneLineEnding', true)
    }
  }
}

test('mdxjsEsm', async function () {
  assert.deepEqual(
    Object.keys(await import('micromark-extension-mdxjs-esm')).sort(),
    ['mdxjsEsm'],
    'should expose the public api'
  )

  assert.throws(
    function () {
      micromark('import a from "b"\n\nc', {
        // @ts-expect-error: runtime.
        extensions: [mdxjsEsm()],
        htmlExtensions: [html]
      })
    },
    /Expected an `acorn` instance passed in as `options\.acorn`/,
    'should throw if `acorn` is not passed in'
  )

  assert.equal(
    micromark('import a from "b"\n\nc', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support an import'
  )

  assert.equal(
    micromark('export default a\n\nb', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>b</p>',
    'should support an export'
  )

  assert.equal(
    micromark('impossible', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>impossible</p>',
    'should not support other keywords (`impossible`)'
  )

  assert.equal(
    micromark('exporting', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>exporting</p>',
    'should not support other keywords (`exporting`)'
  )

  assert.equal(
    micromark('import.', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>import.</p>',
    'should not support a non-whitespace after the keyword'
  )

  assert.equal(
    micromark('import("a")', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>import(&quot;a&quot;)</p>',
    'should not support a non-whitespace after the keyword (import-as-a-function)'
  )

  assert.equal(
    micromark('  import a from "b"\n  export default c', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>import a from &quot;b&quot;\nexport default c</p>',
    'should not support an indent'
  )

  assert.equal(
    micromark('- import a from "b"\n> export default c', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<ul>\n<li>import a from &quot;b&quot;</li>\n</ul>\n<blockquote>\n<p>export default c</p>\n</blockquote>',
    'should not support keywords in containers'
  )

  assert.equal(
    micromark('import a from "b"\nexport default c', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '',
    'should support imports and exports in the same “block”'
  )

  assert.equal(
    micromark('import a from "b"\n\nexport default c', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '',
    'should support imports and exports in separate “blocks”'
  )

  assert.equal(
    micromark('a\n\nimport a from "b"\n\nb\n\nexport default c', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>a</p>\n<p>b</p>\n',
    'should support imports and exports in between other constructs'
  )

  assert.equal(
    micromark('a\nimport a from "b"\n\nb\nexport default c', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>a\nimport a from &quot;b&quot;</p>\n<p>b\nexport default c</p>',
    'should not support import/exports when interrupting paragraphs'
  )

  assert.throws(
    function () {
      micromark('import a', {extensions: [mdxjsEsm({acorn})]})
    },
    /Could not parse import\/exports with acorn: SyntaxError: Unexpected token/,
    'should crash on invalid import/exports (1)'
  )

  assert.throws(
    function () {
      micromark('import 1/1', {extensions: [mdxjsEsm({acorn})]})
    },
    /Could not parse import\/exports with acorn: SyntaxError: Unexpected token/,
    'should crash on invalid import/exports (2)'
  )

  assert.equal(
    micromark('export {\n  a\n} from "b"\n\nc', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support line endings in import/exports'
  )

  assert.equal(
    micromark('export {\n\n  a\n\n} from "b"\n\nc', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support blank lines in import/exports'
  )

  assert.throws(
    function () {
      micromark('import a from "b"\n*md*?', {
        extensions: [mdxjsEsm({acorn})]
      })
    },
    /Could not parse import\/exports with acorn: SyntaxError: Unexpected token/,
    'should crash on markdown after import/export w/o blank line'
  )

  assert.equal(
    micromark('export var a = 1\n// b\n/* c */\n\nd', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>d</p>',
    'should support comments in “blocks”'
  )

  assert.throws(
    function () {
      micromark('export var a = 1\nvar b\n\nc', {
        extensions: [mdxjsEsm({acorn})]
      })
    },
    /Unexpected `VariableDeclaration` in code: only import\/exports are supported/,
    'should crash on other declarations in “blocks”'
  )

  assert.throws(
    function () {
      micromark('import ("a")\n\nb', {
        extensions: [mdxjsEsm({acorn})]
      })
    },
    /Unexpected `ExpressionStatement` in code: only import\/exports are supported/,
    'should crash on import-as-a-function with a space `import (x)`'
  )

  assert.equal(
    micromark('import a from "b"\nexport {a}\n\nc', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support a reexport from another import'
  )

  assert.equal(
    micromark('import a from "b";\nexport {a};\n\nc', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support a reexport from another import w/ semicolons'
  )

  assert.equal(
    micromark('import a from "b"\nexport {a as default}\n\nc', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support a reexport default from another import'
  )

  assert.equal(
    micromark('export var a = () => <b />\n\nc', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support JSX if an `acorn` instance supporting it is passed in'
  )

  assert.throws(
    function () {
      micromark('export {a}\n', {
        extensions: [mdxjsEsm({acorn})],
        htmlExtensions: [html]
      })
    },
    /Export 'a' is not defined/,
    'should support EOF after EOL'
  )

  assert.throws(
    function () {
      micromark('export var a = () => {}\n\nb', {
        extensions: [mdxjsEsm({acorn, acornOptions: {ecmaVersion: 5}})],
        htmlExtensions: [html]
      })
    },
    /Could not parse import\/exports with acorn: SyntaxError: Unexpected token/,
    'should support `acornOptions` (1)'
  )

  assert.equal(
    micromark('export var a = () => {}\n\nb', {
      extensions: [mdxjsEsm({acorn, acornOptions: {ecmaVersion: 6}})],
      htmlExtensions: [html]
    }),
    '<p>b</p>',
    'should support `acornOptions` (2)'
  )

  assert.equal(
    micromark('import a from "b"\n\nexport {a}\n\nc', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support a reexport from another esm block (1)'
  )

  assert.equal(
    micromark('import a from "b"\n\nexport {a}\n\n# c', {
      extensions: [mdxjsEsm({acorn})],
      htmlExtensions: [html]
    }),
    '<h1>c</h1>',
    'should support a reexport from another esm block (2)'
  )

  /** @type {HtmlExtension} */
  assert.equal(
    micromark('export var a = () => {}\n\nb', {
      extensions: [mdxjsEsm({acorn, addResult: true})],
      htmlExtensions: [
        {
          enter: {
            mdxjsEsm(token) {
              assert.ok(
                'estree' in token,
                '`addResult` should add `estree` to `mdxjsEsm`'
              )
              assert.equal(
                token.estree.type,
                'Program',
                '`addResult` should add a program'
              )
              assert(html.enter)
              assert(html.enter.mdxjsEsm)
              return html.enter.mdxjsEsm.call(this, token)
            }
          },
          exit: {
            mdxjsEsm(token) {
              assert(html.exit)
              assert(html.exit.mdxjsEsm)
              return html.exit.mdxjsEsm.call(this, token)
            }
          }
        }
      ]
    }),
    '<p>b</p>',
    'should support `addResult`'
  )
})

test('mdxjsEsm (import)', function () {
  const data = {
    default: 'import a from "b"',
    whole: 'import * as a from "b"',
    destructuring: 'import {a} from "b"',
    'destructuring and rename': 'import {a as b} from "c"',
    'default and destructuring': 'import a, {b as c} from "d"',
    'default and whole': 'import a, * as b from "c"',
    'side-effects': 'import "a"'
  }
  /** @type {keyof data} */
  let key

  for (key in data) {
    if (own.call(data, key)) {
      assert.equal(
        micromark(data[key], {
          extensions: [mdxjsEsm({acorn})],
          htmlExtensions: [html]
        }),
        '',
        key
      )
    }
  }
})

test('mdxjsEsm (export)', function () {
  const data = {
    var: 'export var a = ""',
    const: 'export const a = ""',
    let: 'export let a = ""',
    multiple: 'export var a, b',
    'multiple w/ assignment': 'export var a = "a", b = "b"',
    function: 'export function a() {}',
    class: 'export class a {}',
    destructuring: 'export var {a} = {}',
    'rename destructuring': 'export var {a: b} = {}',
    'array destructuring': 'export var [a] = []',
    default: 'export default a = 1',
    'default function': 'export default function a() {}',
    'default class': 'export default class a {}',
    aggregate: 'export * from "a"',
    'whole reexport': 'export * as a from "b"',
    'reexport destructuring': 'export {a} from "b"',
    'reexport destructuring w rename': 'export {a as b} from "c"',
    'reexport as a default whole': 'export {default} from "b"',
    'reexport default and non-default': 'export {default as a, b} from "c"'
  }
  /** @type {keyof data} */
  let key

  for (key in data) {
    if (own.call(data, key)) {
      assert.equal(
        micromark(data[key], {
          extensions: [mdxjsEsm({acorn})],
          htmlExtensions: [html]
        }),
        '',
        key
      )
    }
  }
})
