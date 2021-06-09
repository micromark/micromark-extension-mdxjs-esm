import {markdownLineEnding, unicodeWhitespace} from 'micromark-util-character'
import {blankLine} from 'micromark-core-commonmark'
import {eventsToAcorn} from 'micromark-util-events-to-acorn'
import {VFileMessage} from 'vfile-message'

const nextBlankConstruct = {tokenize: tokenizeNextBlank, partial: true}

const allowedAcornTypes = new Set([
  'ExportAllDeclaration',
  'ExportDefaultDeclaration',
  'ExportNamedDeclaration',
  'ImportDeclaration'
])

export function mdxjsEsm(options) {
  const exportImportConstruct = {tokenize: tokenizeExportImport, concrete: true}

  if (!options || !options.acorn || !options.acorn.parse) {
    throw new Error('Expected an `acorn` instance passed in as `options.acorn`')
  }

  const acorn = options.acorn
  const acornOptions = Object.assign(
    {ecmaVersion: 2020, sourceType: 'module'},
    options.acornOptions
  )

  // Lowercase E (`e`) and lowercase I (`i`).
  return {flow: {101: exportImportConstruct, 105: exportImportConstruct}}

  function tokenizeExportImport(effects, ok, nok) {
    const self = this
    const definedModuleSpecifiers =
      self.parser.definedModuleSpecifiers ||
      (self.parser.definedModuleSpecifiers = [])
    const eventStart = this.events.length + 1 // Add the main `mdxjsEsm` token
    let index = 0
    let buffer

    return self.interrupt ? nok : start

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
      if (self.now().column !== 1) return nok(code)

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
      let index
      let offset
      let token

      effects.exit('mdxjsEsmData')

      const result = eventsToAcorn(self.events.slice(eventStart), {
        acorn,
        acornOptions,
        prefix:
          definedModuleSpecifiers.length > 0
            ? 'var ' + definedModuleSpecifiers.join(',') + '\n'
            : ''
      })

      if (code !== null && result.swallow) {
        return lineStart(code)
      }

      if (result.error) {
        throw new VFileMessage(
          'Could not parse import/exports with acorn: ' + String(result.error),
          {
            line: result.error.loc.line,
            column: result.error.loc.column + 1,
            offset: result.error.pos
          },
          'micromark-extension-mdxjs-esm:acorn'
        )
      }

      index = -1

      // Remove the `VariableDeclaration`
      if (definedModuleSpecifiers.length > 0) {
        result.estree.body.shift()
      }

      while (++index < result.estree.body.length) {
        token = result.estree.body[index]

        if (!allowedAcornTypes.has(token.type)) {
          throw new VFileMessage(
            'Unexpected `' +
              token.type +
              '` in code: only import/exports are supported',
            {
              start: {
                line: token.loc.start.line,
                column: token.loc.start.column + 1,
                offset: token.start
              },
              end: {
                line: token.loc.end.line,
                column: token.loc.end.column + 1,
                offset: token.end
              }
            },
            'micromark-extension-mdxjs-esm:non-esm'
          )
        }
        // Otherwise, when we’re not interrupting (hacky, because `interrupt` is
        // used to parse containers and “sniff” if this is ESM), collect all the
        // local values that are imported.
        else if (token.type === 'ImportDeclaration' && !self.interrupt) {
          offset = -1

          while (++offset < token.specifiers.length) {
            definedModuleSpecifiers.push(token.specifiers[offset].local.name)
          }
        }
      }

      token = effects.exit('mdxjsEsm')
      if (options.addResult) token.estree = result.estree
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
    return effects.attempt(blankLine, ok, nok)
  }
}
