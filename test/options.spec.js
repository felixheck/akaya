const test = require('tape').test
const { setup } = require('./utils')

test('akaya/options.secure >> `true` forces https', t => {
  const { server } = setup()

  server.route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo', {}, { secure: true }))
    }
  }, {
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply()
      }
    }
  }])

  server.inject('/', res => {
    t.equal(res.payload, 'https://localhost:1337/foo')
    t.end()
  })
})

test('akaya/options.secure >> `false` forces http', t => {
  const { server } = setup()

  server.route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo', {}, { secure: false }))
    }
  }, {
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply()
      }
    }
  }])

  server.inject('/', res => {
    t.equal(res.payload, 'http://localhost:1337/foo')
    t.end()
  })
})

test('akaya/options.secure >> auto detecting secure option as default', t => {
  const { server } = setup()

  const options = {
    method: 'GET',
    url: 'http://localhost:1337',
    headers: {
      'x-forwarded-proto': 'http'
    }
  }

  const options2 = {
    method: 'GET',
    url: 'http://localhost:1337',
    headers: {
      'x-forwarded-proto': 'https'
    }
  }

  server.route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo', {}))
    }
  }, {
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply()
      }
    }
  }])

  server.inject(options, res => {
    t.equal(res.payload, 'http://localhost:1337/foo')

    server.inject(options2, res2 => {
      t.equal(res2.payload, 'https://localhost:1337/foo')
      t.end()
    })
  })
})

test('akaya/options.rel >> `true` returns a relative URI', t => {
  const { server } = setup()

  server.route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo', { }, { rel: true }))
    }
  }, {
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply()
      }
    }
  }])

  server.inject('/', res => {
    t.equal(res.payload, '/foo')
    t.end()
  })
})

test(' akaya/options.host >> overrides the host if set', t => {
  const { server } = setup()

  server.route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo', { }, { host: 'foobar.io:5000' }))
    }
  }, {
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply()
      }
    }
  }])

  server.inject('/', res => {
    t.equal(res.payload, 'http://foobar.io:5000/foo')
    t.end()
  })
})
