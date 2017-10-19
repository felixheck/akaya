const test = require('ava')
const helpers = require('./_helpers')

test('set `secure` to `true` to force https', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo', {}, { secure: true })
      }
    }
  })

  const res = await server.inject({
    method: 'GET',
    url: '/foo',
    headers: {
      'x-forwarded-proto': 'http'
    }
  })
  t.is(res.payload, 'https://localhost:1337/foo')
})

test('set `secure` to `false` to force https', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo', {}, { secure: false })
      }
    }
  })

  const res = await server.inject({
    method: 'GET',
    url: '/foo',
    headers: {
      'x-forwarded-proto': 'https'
    }
  })
  t.is(res.payload, 'http://localhost:1337/foo')
})

test('set `secure` to `undefined` to auto detect', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo')
      }
    }
  })

  const res1 = await server.inject({
    method: 'GET',
    url: '/foo',
    headers: {
      'x-forwarded-proto': 'http'
    }
  })
  t.is(res1.payload, 'http://localhost:1337/foo')

  const res2 = await server.inject({
    method: 'GET',
    url: '/foo',
    headers: {
      'x-forwarded-proto': 'https'
    }
  })
  t.is(res2.payload, 'https://localhost:1337/foo')
})

test('set `rel` to `true` to return a relative uri', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo', { }, { rel: true })
      }
    }
  })

  const res = await server.inject('/foo')
  t.is(res.payload, '/foo')
})

test('set `host` to overrides the host', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo', { }, { host: 'foobar.io:5000' })
      }
    }
  })

  const res = await server.inject('/foo')
  t.is(res.payload, 'http://foobar.io:5000/foo')
})
