'use strict'

module.exports = mdxjs

var markdownLineEnding = require('micromark/dist/character/markdown-line-ending')
var unicodeWhitespace = require('micromark/dist/character/unicode-whitespace')
var blank = require('micromark/dist/tokenize/partial-blank-line')
var VMessage = require('vfile-message')

var nextBlankConstruct = {tokenize: tokenizeNextBlank, partial: true}

var allowedAcornTypes = [
  'ExportAllDeclaration',
  'ExportDefaultDeclaration',
  'ExportNamedDeclaration',
  'ImportDeclaration'
]

function mdxjs(options) {
  var exportImportConstruct = {tokenize: tokenizeExportImport, concrete: true}
  var acornOptions
  var acorn

  if (!options || !options.acorn || !options.acorn.parse) {
    throw new Error('Expected an `acorn` instance passed in as `options.acorn`')
  }

  acorn = options.acorn
  acornOptions = Object.assign(
    {ecmaVersion: 2020, sourceType: 'module'},
    options.acornOptions || {},
    {locations: true}
  )

  // Lowercase E (`e`) and lowercase I (`i`).
  return {flow: {101: exportImportConstruct, 105: exportImportConstruct}}

  function tokenizeExportImport(effects, ok, nok) {
    var self = this
    var lastEventIndex = this.events.length + 1 // Add the main `mdxjsEsm` token
    var position = self.now()
    var source = ''
    var index = 0
    var buffer

    return start

    function start(code) {
      /* istanbul ignore else - handled by mm */
      if (code === 101 /* `e` */) {
        buffer = 'export'
      } else if (code === 105 /* `i` */) {
        buffer = 'import'
      } else {
        throw new Error('Expected `e` or `i`')
      }

      // Do not support indent (the easiest check for containers).
      if (position.column !== 1) return nok(code)

      effects.enter('mdxjsEsm')
      effects.enter('mdxjsEsmData')
      return keyword(code)
    }

    function keyword(code) {
      if (code === buffer.charCodeAt(index++)) {
        effects.consume(code)
        return index === buffer.length ? after : keyword
      }

      return nok(code)
    }

    function after(code) {
      if (unicodeWhitespace(code)) {
        effects.consume(code)
        return rest
      }

      return nok(code)
    }

    function rest(code) {
      if (code === null) {
        return atEnd(code)
      }

      if (markdownLineEnding(code)) {
        return effects.check(nextBlankConstruct, atEnd, atEol)(code)
      }

      effects.consume(code)
      return rest
    }

    function atEol(code) {
      effects.exit('mdxjsEsmData')
      return lineStart(code)
    }

    function lineStart(code) {
      if (markdownLineEnding(code)) {
        effects.enter('lineEnding')
        effects.consume(code)
        effects.exit('lineEnding')
        return lineStart
      }

      effects.enter('mdxjsEsmData')
      return rest(code)
    }

    function atEnd(code) {
      var result
      var exception
      var index
      var token

      effects.exit('mdxjsEsmData')

      while (lastEventIndex < self.events.length) {
        source += self.sliceSerialize(self.events[lastEventIndex][1])
        lastEventIndex += 2 // Skip over `exit`.
      }

      try {
        result = acorn.parse(source, acornOptions)
      } catch (error) {
        exception = error
      }

      if (code !== null && exception && exception.raisedAt === source.length) {
        return lineStart(code)
      }

      if (exception) {
        throw new VMessage(
          'Could not parse import/exports with acorn: ' +
            String(exception).replace(/ \(\d+:\d+\)$/, ''),
          {
            line: position.line + exception.loc.line - 1,
            column: exception.loc.column + 1
          },
          'micromark-extension-mdxjs-esm:acorn'
        )
      }

      index = -1

      while (++index < result.body.length) {
        token = result.body[index]

        if (allowedAcornTypes.indexOf(token.type) < 0) {
          throw new VMessage(
            'Unexpected `' +
              token.type +
              '` in code: only import/exports are supported',
            {
              start: {
                line: position.line + token.loc.start.line - 1,
                column: token.loc.start.column + 1
              },
              end: {
                line: position.line + token.loc.end.line - 1,
                column: token.loc.end.column + 1
              }
            },
            'micromark-extension-mdxjs-esm:non-esm'
          )
        }
      }

      token = effects.exit('mdxjsEsm')
      if (options.addResult) token.estree = result
      return ok(code)
    }
  }
}

function tokenizeNextBlank(effects, ok, nok) {
  return start

  function start(code) {
    effects.exit('mdxjsEsmData')
    effects.enter('lineEndingBlank')
    effects.consume(code)
    effects.exit('lineEndingBlank')
    return effects.attempt(blank, ok, nok)
  }
}
