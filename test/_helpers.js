const hapi = require('hapi')
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

module.exports = {
  getServer
}
