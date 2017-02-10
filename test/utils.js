const Hapi = require('hapi')
const plugin = require('../index')

/**
 * @function
 * @public
 *
 * @description
 * Setup and expose an Hapi server connection
 *
 * @returns {Object} The needed fixtures
 */
const setup = (multiple = false) => {
  const fixtures = {
    server: new Hapi.Server()
  }

  fixtures.server.connection({
    port: 1337,
    host: 'localhost',
    labels: ['a']
  })

  if (multiple) {
    fixtures.server.connection({
      port: 1338,
      host: 'localhost',
      labels: ['b']
    })
  }

  fixtures.server.register(plugin, () => {})

  return fixtures
}

module.exports = {
  setup
}
