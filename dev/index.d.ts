import type {Program} from 'estree'
import type {Acorn, AcornOptions} from 'micromark-util-events-to-acorn'

export {mdxjsEsm} from './lib/syntax.js'

/**
 * Configuration (required).
 */
export interface Options {
  /**
   * Acorn parser to use (required).
   */
  acorn: Acorn
  /**
   * Configuration for acorn (default: `{ecmaVersion: 2024, locations: true,
   * sourceType: 'module'}`); all fields except `locations` can be set.
   */
  acornOptions?: AcornOptions | null | undefined
  /**
   * Whether to add `estree` fields to tokens with results from acorn
   * (default: `false`).
   */
  addResult?: boolean | null | undefined
}

/**
 * Augment types.
 */
declare module 'micromark-util-types' {
  /**
   * Parse context.
   */
  interface ParseContext {
    definedModuleSpecifiers?: Array<string>
  }

  /**
   * Token.
   */
  interface Token {
    estree?: Program
  }

  /**
   * Token types.
   */
  interface TokenTypeMap {
    mdxjsEsm: 'mdxjsEsm'
    mdxjsEsmData: 'mdxjsEsmData'
  }
}
