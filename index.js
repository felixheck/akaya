const Joi = require('joi')
const Hoek = require('hoek')
const Querystring = require('qs')
const pkg = require('./package.json')

/**
 * @type {Object}
 * @private
 *
 * @description
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
      query: Joi.object(),
      params: Joi.object()
    },
    options: {
      secure: Joi.boolean(),
      rel: Joi.boolean().default(false),
      host: Joi.string()
    }
  }
}

/**
 * @function
 * @private
 *
 * @description
 * Parse optional parameters
 *
 * @param {Object} params The parameters to be inserted
 * @param {string} section The section to be replaced
 * @param {string} stripped The sections key
 * @returns {*} Parsed source and destination for replacement
 */
function parseOptional (params, section, stripped) {
  stripped = stripped.slice(0, -1)
  const key = params && params[stripped] ? params[stripped] : ''

  return {
    dst: key && key.toString() ? section : `/${section}`,
    src: key
  }
}

/**
 * @function
 * @private
 *
 * @description
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

  Hoek.assert(
    Array.isArray(value),
    `The ${stripped} parameter should be an array`
  )

  Hoek.assert(
    parseInt(split[1], 10) === value.length,
    'The number of passed multi-parameters does not match the defined multiplier'
  )

  const src = value.join('/')
  Hoek.assert(src, `The '${stripped} parameter is missing`)

  return { dst: section, src }
}

/**
 * @function
 * @private
 *
 * @description
 * Parse plain parameters
 *
 * @param {Object} params The parameters to be inserted
 * @param {string} section The section to be replaced
 * @param {string} stripped The sections key
 * @returns {*} Parsed source and destination for replacement
 */
function parsePlain (params, section, stripped) {
  stripped = stripped.replace(internals.regexp.wildcard, '')
  Hoek.assert(params && params[stripped], `The '${stripped}' parameter is missing`)

  return { dst: section, src: params[stripped] }
}

/**
 * @function
 * @private
 *
 * @description
 * Get route coonfiguration object of one or multiple connections by id
 *
 * @param {Object} server The related server object
 * @param {string} id The unique route ID to be looked for
 * @returns {Object} The route configuration object
 *
 * @throws Whether there is no related route
 */
function lookupRoute (server, id) {
  let route

  if (server.connections.length === 1) {
    route = server.lookup(id)
  } else {
    server.connections.some(connection => {
      route = connection.lookup(id)

      return route
    })
  }

  Hoek.assert(route, 'None of the defined routes match the ID')

  return route
}

/**
 * @function
 * @public
 *
 * @description
 * Plugin to generate URIs based on ID and parameters
 *
 * @param {Object} server The server to be extended
 * @param {Object} pluginOptions The plugin options
 * @param {Function} next The callback to continue in the chain of plugins
 */
function akaya (server, pluginOptions, next) {
  server.decorate('server', 'aka', function serverDecorator (id, params = {}) {
    params = Joi.attempt(params, internals.scheme.params)

    const route = Object.assign({}, lookupRoute(server, id))
    const routeSections = route.path.match(internals.regexp.params) || []

    routeSections.forEach(routeSection => {
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
      route.path += `?${Querystring.stringify(params.query)}`
      route.path = route.path.replace(/\?$/, '')
    }

    return route.path
  })

  server.decorate('request', 'aka', function requestDecorator (id, params = {}, options = {}) {
    const path = server.aka(id, params)

    if (options.rel) {
      return path
    }

    options = Joi.attempt(options, internals.scheme.options)

    let protocol = this.headers['x-forwarded-proto'] || this.connection.info.protocol

    if (options.secure === true) {
      protocol = 'https'
    } else if (options.secure === false) {
      protocol = 'http'
    }

    return `${protocol}://${options.host || this.info.host}${path}`
  })

  next()
}

akaya.attributes = {
  pkg
}

module.exports = {
  register: akaya
}
