const hapi = require('@hapi/hapi')
const call = require('@hapi/call')
const plugin = require('../index')

/**
 * @function
 * @public
 *
 * Setup and expose an Hapi server connection
 *
 * @returns {Object} The server
 */
const getServer = async () => {
  const server = hapi.server({
    port: 1337,
    host: 'localhost'
  })

  await server.register(plugin)

  return server
}

/**
 * @function
 * @public
 *
 * Setup and expose a Call router
 *
 * @returns {Object} Router
 */
const getRouter = async () => {
  return new call.Router()
}

module.exports = {
  getServer,
  getRouter
}
