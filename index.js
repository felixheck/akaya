const joi = require('@hapi/joi')
const boom = require('@hapi/boom')
const qs = require('qs')
const pkg = require('./package.json')

/**
 * @type {Object}
 * @private
 *
 * Store internal objects
 */
const internals = {
  regexp: {
    braces: /[{}']+/g,
    params: /\{(\w+\*?|\w+\?|\w+\*[1-9][0-9]*)\}/g,
    wildcard: /\*$/g
  },
  scheme: {
    params: {
      query: joi.object(),
      params: joi.object()
    },
    options: {
      secure: joi.boolean(),
      rel: joi.boolean().default(false),
      host: joi.string()
    }
  }
}

/**
 * @function
 * @private
 *
 * Check if condition is true and throw error if not
 *
 * @param {any} condition The condition to be checked
 * @param {any} [msg=''] The error message
 * @param {string} [type='badRequest'] The error type
 */
function assert (condition, msg = '', type = 'badRequest') {
  if (!condition) {
    throw boom[type](msg)
  }
}

/**
 * @function
 * @private
 *
 * Parse optional parameters
 *
 * @param {Object} params The parameters to be inserted
 * @param {string} section The section to be replaced
 * @param {string} stripped The sections key
 * @returns {*} Parsed source and destination for replacement
 */
function parseOptional (params, section, stripped) {
  stripped = stripped.slice(0, -1)
  const key = (params && params[stripped]) || ''

  return {
    dst: key && key.toString() ? section : `/${section}`,
    src: key
  }
}

/**
 * @function
 * @private
 *
 * Parse multi-parameters
 *
 * @param {Object} params The parameters to be inserted
 * @param {string} section The section to be replaced
 * @param {string} stripped The sections key
 * @returns {*} Parsed source and destination for replacement
 */
function parseMulti (params, section, stripped) {
  const split = stripped.split('*')
  const value = params[split[0]]

  assert(Array.isArray(value), `The ${stripped} parameter should be an array`)
  assert(parseInt(split[1], 10) === value.length, 'The number of passed multi-parameters does not match the defined multiplier')

  const src = value.join('/')
  assert(src, `The '${stripped} parameter is missing`)

  return { dst: section, src }
}

/**
 * @function
 * @private
 *
 * Parse plain parameters
 *
 * @param {Object} params The parameters to be inserted
 * @param {string} section The section to be replaced
 * @param {string} stripped The sections key
 * @returns {*} Parsed source and destination for replacement
 */
function parsePlain (params, section, stripped) {
  stripped = stripped.replace(internals.regexp.wildcard, '')
  assert(params && params[stripped], `The '${stripped}' parameter is missing`)

  return { dst: section, src: params[stripped] }
}

/**
 * @function
 * @private
 *
 * Get route configuration object of one or multiple connections by id
 *
 * @param {Object} server The related server object
 * @param {string} id The unique route ID to be looked for
 * @returns {Object} The route configuration object
 *
 * @throws Whether there is no related route
 */
function lookupRoute (server, id) {
  const route = server.lookup(id)
  assert(route, 'There is no route with the defined ID', 'notFound')

  return route
}

/**
 * @function
 * @public
 *
 * Handle the basic operations with relative paths
 *
 * @param {Object} server The server to be extended
 * @param {string} id The unique route ID to be looked for
 * @param {Object} params The parameters to be inserted
 */
function serverDecorator (server, id, params = {}) {
  params = joi.attempt(params, internals.scheme.params)

  const route = Object.assign({}, lookupRoute(server, id))
  const routeSections = route.path.match(internals.regexp.params) || []

  routeSections.forEach((routeSection) => {
    const stripped = routeSection.replace(internals.regexp.braces, '')
    let parsed

    if (stripped.includes('?')) {
      parsed = parseOptional(params.params, routeSection, stripped)
    } else if (stripped.includes('*') && stripped.slice(-1) !== '*') {
      parsed = parseMulti(params.params, routeSection, stripped)
    } else {
      parsed = parsePlain(params.params, routeSection, stripped)
    }

    route.path = route.path.replace(parsed.dst, parsed.src)
  })

  if (params.query) {
    route.path += `?${qs.stringify(params.query)}`
    route.path = route.path.replace(/\?$/, '')
  }

  return route.path
}

/**
 * @function
 * @public
 *
 * Plugin to generate URIs based on ID and parameters
 *
 * @param {Object} server The server to be extended
 * @param {Object} pluginOptions The plugin options
 */
function akaya (server, pluginOptions) {
  server.decorate('server', 'aka', serverDecorator.bind(this, server))
  server.decorate('request', 'aka', function (id, params = {}, options = {}) {
    options = joi.attempt(options, internals.scheme.options)

    const path = server.aka(id, params)
    let protocol

    if (options.rel) {
      return path
    }

    switch (options.secure) {
      case true:
        protocol = 'https'
        break
      case false:
        protocol = 'http'
        break
      default:
        protocol = this.headers['x-forwarded-proto'] || server.info.protocol
    }

    return `${protocol}://${options.host || this.info.host}${path}`
  })
}

module.exports = {
  register: akaya,
  pkg
}
