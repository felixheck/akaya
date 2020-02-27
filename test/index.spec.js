const test = require('ava')
const helpers = require('./_helpers')

test('get the url of a named route', async (t) => {
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

  const res = await server.inject('/foo')
  t.is(res.payload, 'http://localhost:1337/foo')
})

test("get the url of a named route on custom router", async t => {
  const server = await helpers.getServer();
  const customRouter = await helpers.getRouter();

  customRouter.add({
    id: "bar",
    method: "GET",
    path: "/bar"
  });

  server.route({
    method: "GET",
    path: "/foo",
    config: {
      id: "foo",
      handler(request) {
        return request.aka("bar", {}, { router: customRouter });
      }
    }
  });

  const res = await server.inject("/foo");
  t.is(res.payload, "http://localhost:1337/bar");
});

test('throw if no route matches', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/',
    handler (request) {
      return request.aka('foo')
    }
  })

  const res = await server.inject('/')
  t.is(res.statusCode, 404)
  t.is(res.statusMessage, 'Not Found')
})

test("throw if no route matches on custom router", async t => {
  const server = await helpers.getServer();
  const customRouter = await helpers.getRouter();

  server.route({
    method: "GET",
    path: "/",
    handler(request) {
      return request.aka("foo", {}, { router: customRouter });
    }
  });

  const res = await server.inject("/");
  t.is(res.statusCode, 404);
  t.is(res.statusMessage, "Not Found");
});

test('throw if there is a missing parameter', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/{name}',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo')
      }
    }
  })

  const res = await server.inject('/bar')
  t.is(res.statusCode, 400)
  t.is(res.statusMessage, 'Bad Request')
})

test('throw if there is s a mismatch in number of parameters required and given', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/{greet}/{object}',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo', { params: { greet: 'hello' } })
      }
    }
  })

  const res = await server.inject('/hello/world')
  t.is(res.statusCode, 400)
  t.is(res.statusMessage, 'Bad Request')
})

test('place multiple parameters in the url', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/{greet}/{object}',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo', { params: { greet: 'hello', object: 'world' } })
      }
    }
  })

  const res = await server.inject('/hello/world')
  t.is(res.payload, 'http://localhost:1337/hello/world')
})

test('places wildcard parameter in the url', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/{path*}',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo', { params: { path: 'hello/world' } })
      }
    }
  })

  const res = await server.inject('/hello/world')
  t.is(res.payload, 'http://localhost:1337/hello/world')
})

test('places multiple wildcard parameters', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/{path*3}',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo', { params: { path: ['hello', 'foo', 'bar'] } })
      }
    }
  })

  const res = await server.inject('/hello/foo/bar')
  t.is(res.payload, 'http://localhost:1337/hello/foo/bar')
})

test('throw if number of parameters mismatches the multiplier', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/{path*3}',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo', { params: { path: ['hello', 'foo'] } })
      }
    }
  })

  const res = await server.inject('/hello/foo/bar')
  t.is(res.statusCode, 400)
  t.is(res.statusMessage, 'Bad Request')
})

test('strip optional params from path if none specified', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/foobar/{param?}',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo')
      }
    }
  })

  const res = await server.inject('/foobar')
  t.is(res.payload, 'http://localhost:1337/foobar')
})

test('strip trailing slash after stripping optional parameters', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/{param?}',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo')
      }
    }
  })

  const res = await server.inject('/')
  t.is(res.payload, 'http://localhost:1337')
})

test('append a query string', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/foobar',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo', {
          query: {
            greet: 'hello',
            object: 'world'
          }
        })
      }
    }
  })

  const res = await server.inject('/foobar')
  t.is(res.payload, 'http://localhost:1337/foobar?greet=hello&object=world')
})

test('strips a trailing question mark if query paramter is undefined', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/foobar',
    config: {
      id: 'foo',
      handler (request) {
        return request.aka('foo', {
          query: {
            greet: undefined
          }
        })
      }
    }
  })

  const res = await server.inject('/foobar')
  t.is(res.payload, 'http://localhost:1337/foobar')
})

test('server method for relative uri is accessible', async (t) => {
  const server = await helpers.getServer()

  server.route({
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler (request) {}
    }
  })

  t.is(server.aka('foo'), '/foo')
})
