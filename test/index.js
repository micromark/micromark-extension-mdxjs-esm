import * as acorn from 'acorn'
import jsx from 'acorn-jsx'
import test from 'tape'
import {micromark} from 'micromark'
import {mdxjsEsm as syntax} from '../index.js'

var html = {enter: {mdxjsEsm: start}, exit: {mdxjsEsm: end}}

function start() {
  this.buffer()
}

function end() {
  this.resume()
  this.setData('slurpOneLineEnding', true)
}

test('micromark-extension-mdxjs-esm', function (t) {
  t.throws(
    function () {
      micromark('import a from "b"\n\nc', {
        extensions: [syntax()],
        htmlExtensions: [html]
      })
    },
    /Expected an `acorn` instance passed in as `options\.acorn`/,
    'should throw if `acorn` is not passed in'
  )

  t.equal(
    micromark('import a from "b"\n\nc', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support an import'
  )

  t.equal(
    micromark('export default a\n\nb', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>b</p>',
    'should support an export'
  )

  t.equal(
    micromark('impossible', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>impossible</p>',
    'should not support other keywords (`impossible`)'
  )

  t.equal(
    micromark('exporting', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>exporting</p>',
    'should not support other keywords (`exporting`)'
  )

  t.equal(
    micromark('import.', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>import.</p>',
    'should not support a non-whitespace after the keyword'
  )

  t.equal(
    micromark('import("a")', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>import(&quot;a&quot;)</p>',
    'should not support a non-whitespace after the keyword (import-as-a-function)'
  )

  t.equal(
    micromark('  import a from "b"\n  export default c', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>import a from &quot;b&quot;\nexport default c</p>',
    'should not support an indent'
  )

  t.equal(
    micromark('- import a from "b"\n> export default c', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<ul>\n<li>import a from &quot;b&quot;</li>\n</ul>\n<blockquote>\n<p>export default c</p>\n</blockquote>',
    'should not support keywords in containers'
  )

  t.equal(
    micromark('import a from "b"\nexport default c', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '',
    'should support imports and exports in the same “block”'
  )

  t.equal(
    micromark('import a from "b"\n\nexport default c', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '',
    'should support imports and exports in separate “blocks”'
  )

  t.equal(
    micromark('a\n\nimport a from "b"\n\nb\n\nexport default c', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>a</p>\n<p>b</p>\n',
    'should support imports and exports in between other constructs'
  )

  t.equal(
    micromark('a\nimport a from "b"\n\nb\nexport default c', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>a\nimport a from &quot;b&quot;</p>\n<p>b\nexport default c</p>',
    'should not support import/exports when interrupting paragraphs'
  )

  t.throws(
    function () {
      micromark('import a', {extensions: [syntax({acorn})]})
    },
    /Could not parse import\/exports with acorn: SyntaxError: Unexpected token/,
    'should crash on invalid import/exports (1)'
  )

  t.throws(
    function () {
      micromark('import 1/1', {extensions: [syntax({acorn})]})
    },
    /Could not parse import\/exports with acorn: SyntaxError: Unexpected token/,
    'should crash on invalid import/exports (2)'
  )

  t.equal(
    micromark('export {\n  a\n} from "b"\n\nc', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support line endings in import/exports'
  )

  t.equal(
    micromark('export {\n\n  a\n\n} from "b"\n\nc', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support blank lines in import/exports'
  )

  t.throws(
    function () {
      micromark('import a from "b"\n*md*?', {
        extensions: [syntax({acorn})]
      })
    },
    /Could not parse import\/exports with acorn: SyntaxError: Unexpected token/,
    'should crash on markdown after import/export w/o blank line'
  )

  t.equal(
    micromark('export var a = 1\n// b\n/* c */\n\nd', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>d</p>',
    'should support comments in “blocks”'
  )

  t.throws(
    function () {
      micromark('export var a = 1\nvar b\n\nc', {
        extensions: [syntax({acorn})]
      })
    },
    /Unexpected `VariableDeclaration` in code: only import\/exports are supported/,
    'should crash on other declarations in “blocks”'
  )

  t.throws(
    function () {
      micromark('import ("a")\n\nb', {
        extensions: [syntax({acorn})]
      })
    },
    /Unexpected `ExpressionStatement` in code: only import\/exports are supported/,
    'should crash on import-as-a-function with a space `import (x)`'
  )

  t.equal(
    micromark('import a from "b"\nexport {a}\n\nc', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support a reexport from another import'
  )

  t.equal(
    micromark('import a from "b";\nexport {a};\n\nc', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support a reexport from another import w/ semicolons'
  )

  t.equal(
    micromark('import a from "b"\nexport {a as default}\n\nc', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support a reexport default from another import'
  )

  t.throws(
    function () {
      micromark('export var a = () => <b />', {
        extensions: [syntax({acorn})]
      })
    },
    /Could not parse import\/exports with acorn: SyntaxError: Unexpected token/,
    'should not support JSX by default'
  )

  t.equal(
    micromark('export var a = () => <b />\n\nc', {
      extensions: [syntax({acorn: acorn.Parser.extend(jsx())})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support JSX if an `acorn` instance supporting it is passed in'
  )

  t.throws(
    function () {
      micromark('export var a = () => {}\n\nb', {
        extensions: [syntax({acorn, acornOptions: {ecmaVersion: 5}})],
        htmlExtensions: [html]
      })
    },
    /Could not parse import\/exports with acorn: SyntaxError: Unexpected token/,
    'should support `acornOptions` (1)'
  )

  t.equal(
    micromark('export var a = () => {}\n\nb', {
      extensions: [syntax({acorn, acornOptions: {ecmaVersion: 6}})],
      htmlExtensions: [html]
    }),
    '<p>b</p>',
    'should support `acornOptions` (2)'
  )

  t.equal(
    micromark('import a from "b"\n\nexport {a}\n\nc', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<p>c</p>',
    'should support a reexport from another esm block (1)'
  )

  t.equal(
    micromark('import a from "b"\n\nexport {a}\n\n# c', {
      extensions: [syntax({acorn})],
      htmlExtensions: [html]
    }),
    '<h1>c</h1>',
    'should support a reexport from another esm block (2)'
  )

  t.equal(
    micromark('export var a = () => {}\n\nb', {
      extensions: [syntax({acorn, addResult: true})],
      htmlExtensions: [{enter: {mdxjsEsm: checkResult}, exit: {mdxjsEsm: end}}]
    }),
    '<p>b</p>',
    'should support `addResult`'
  )

  function checkResult(token) {
    t.ok('estree' in token, '`addResult` should add `estree` to `mdxjsEsm`')
    t.equal(token.estree.type, 'Program', '`addResult` should add a program')
    return start.call(this, token)
  }

  t.end()
})

test('micromark-extension-mdxjs-esm (import)', function (t) {
  var data = {
    default: 'import a from "b"',
    whole: 'import * as a from "b"',
    destructuring: 'import {a} from "b"',
    'destructuring and rename': 'import {a as b} from "c"',
    'default and destructuring': 'import a, {b as c} from "d"',
    'default and whole': 'import a, * as b from "c"',
    'side-effects': 'import "a"'
  }
  var key

  for (key in data) {
    t.equal(
      micromark(data[key], {
        extensions: [syntax({acorn})],
        htmlExtensions: [html]
      }),
      '',
      key
    )
  }

  t.end()
})

test('micromark-extension-mdxjs-esm (export)', function (t) {
  var data = {
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
  var key

  for (key in data) {
    t.equal(
      micromark(data[key], {
        extensions: [syntax({acorn})],
        htmlExtensions: [html]
      }),
      '',
      key
    )
  }

  t.end()
})
