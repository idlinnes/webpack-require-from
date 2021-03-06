'use strict'

class WebpackRequireFrom {
  constructor (userOptions) {
    this.options = Object.assign({}, WebpackRequireFrom.defaultOptions, userOptions)
    if (this.options.methodName && this.options.path) {
      throw new Error('WebpackRequireFrom: Specify either "methodName" or "path"')
    }
  }

  apply (compiler) {
    compiler.plugin('compilation', this.compilationHook.bind(this))
  }

  buildStringCode (pathString) {
    return `return "${pathString}";`
  }

  buildMethodCode (methodName, defaultPublicPath) {
    return [
      'try {',
      `  if (typeof ${methodName} !== "function") {`,
      `    throw new Error("${methodName} is not a function or not avialable at runtime");`,
      '  }',
      `  return ${methodName}();`,
      '} catch (e) {',
      '  console.error(e);',
      `  return "${defaultPublicPath}";`,
      '}'
    ].join('\n');
  }

  compilationHook (compilation, params) {
    compilation.mainTemplate.plugin('require-extensions', (source, chunk, hash) => {
      const defaultPublicPath = compilation.mainTemplate.getPublicPath({hash})
      const _config = Object.assign({path: defaultPublicPath}, this.options)
      let getterBody;

      if (_config.methodName) {
        getterBody = this.buildMethodCode(_config.methodName, defaultPublicPath)
      } else if (_config.path) {
        getterBody = this.buildStringCode(_config.path)
      } else {
        throw new Error('WebpackRequireFrom cannot determine what method to use')
      }
      return [
        source,
        '// WebpackRequireFrom',
        'Object.defineProperty(' + compilation.mainTemplate.requireFn + ', "p", {',
        '  get: function () {',
        getterBody,
        ' }',
        '})'
      ].join('\n');
    })
  }
}

WebpackRequireFrom.defaultOptions = {}

module.exports = WebpackRequireFrom;
