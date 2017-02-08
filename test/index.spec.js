const test = require('tape').test;
const { setup } = require('./utils');

test('akaya >> gets a URI to a named route', t => {
  const { server } = setup();
  
  server.route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo'));
    }
  }, {
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply();
      }
    }
  }]);
  
  server.inject('/', res => {
    t.equal(res.payload, 'http://localhost:1337/foo');
    t.end();
  });
});

test('akaya >> works with multiple connections', t => {
  const { server } = setup(true);

  server.select('a').route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo'));
    }
  }, {
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply();
      }
    }
  }]);

  server.select('a').inject('/', res => {
    t.equal(res.payload, 'http://localhost:1337/foo');
    t.end();
  });
});

test('akaya >> works across multiple connections', t => {
  const { server } = setup(true);

  server.select('a').route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('bar'));
    }
  }, {
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply();
      }
    }
  }]);

  server.select('b').route({
    method: 'GET',
    path: '/bar',
    config: {
      id: 'bar',
      handler: function (request, reply) {
        reply();
      }
    }
  });

  server.select('a').inject('/', res => {
    t.equal(res.payload, 'http://localhost:1337/bar');
    t.end();
  });
});

test('akaya >> works with routes inside prefixed plugins', t => {
  const { server } = setup();

  function plugin(serv, options, next) {
    serv.route({
      method: 'GET',
      path: '/foo',
      config: {
        id: 'foo',
        handler: function (request, reply) {
          reply();
        }
      }
    });

    next();
  }

  plugin.attributes = { name: 'plugin' };

  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo'));
    }
  });

  server.register(plugin, { routes: { prefix: '/prefix' } }, function () {
    server.inject('/', function (res) {

      t.equal(res.payload, 'http://localhost:1337/prefix/foo');
      t.end();
    });
  });
});

test('akaya >> throws if no route matches', t => {
  const { server } = setup();

  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo'));
    }
  });

  t.throws(() => server.inject('/', res => {}), /error/i);
  t.end();
});

test('akaya >> throws if there is a missing parameter', t => {
  const { server } = setup();

  server.route({
    config: {
      id: 'foo'
    },
    method: 'GET',
    path: '/{name}',
    handler: function (request, reply) {
      reply(request.aka('foo'));
    }
  });

  t.throws(() => server.inject('/bar', res => {}), /error/i);
  t.end();
});

test('akaya >> throws if there is s a mismatch in number of parameters required and given', t => {
  const { server } = setup();

  server.route({
    config: {
      id: 'foo'
    },
    method: 'GET',
    path: '/{greet}/{object}',
    handler: function (request, reply) {
      reply(request.aka('foo', { params: { greet: 'hello' } }));
    }
  });

  t.throws(() => server.inject('/hello/world', res => {}), /error/i);
  t.end();
});

test('akaya >> can place parameters in the URL', t => {
  const { server } = setup();

  server.route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo', { params: { greet: 'hello', object: 'world' } }));
    }
  }, {
    method: 'GET',
    path: '/{greet}/{object}',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply();
      }
    }
  }]);

  server.inject('/', res => {
    t.equal(res.payload, 'http://localhost:1337/hello/world');
    t.end();
  });
});

test('akaya >> works on wildcard parameters', t => {
  const { server} = setup();

  server.route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo', { params: { path: 'hello/world' } }));
    }
  }, {
    method: 'GET',
    path: '/{path*}',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply();
      }
    }
  }]);

  server.inject('/', res => {
    t.equal(res.payload, 'http://localhost:1337/hello/world');
    t.end();
  });
});

test('akaya >> works on multiple parameters', t => {
  const { server } = setup();

  server.route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo', { params: { path: ['hello', 'foo', 'bar'] } }));
    }
  }, {
    method: 'GET',
    path: '/{path*3}',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply();
      }
    }
  }]);

  server.inject('/', res => {
    t.equal(res.payload, 'http://localhost:1337/hello/foo/bar');
    t.end();
  });
});

test('akaya >> throws if number of parameters mismatches the multiplier', t => {
  const { server } = setup();

  server.route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo', { params: { path: ['hello', 'foo'] } }));
    }
  }, {
    method: 'GET',
    path: '/{path*3}',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply();
      }
    }
  }]);

  t.throws(() => server.inject('/', res => {}), /error/i);
  t.end();
});

test('akaya >> strips optional params from path if none specified', t => {
  const { server } = setup();

  server.route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo'));
    }
  }, {
    method: 'GET',
    path: '/foobar/{param?}',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply();
      }
    }
  }]);

  server.inject('/', res => {
    t.equal(res.statusCode, 200);
    t.equal(res.payload, 'http://localhost:1337/foobar');
    t.end();
  });
});

test('akaya >> strips trailing slash after stripping optional parameters', t => {
  const { server } = setup();

  server.route([{
    method: 'GET',
    path: '/{param?}',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply(request.aka('foo'));
      }
    }
  }]);

  server.inject('/', res => {
    t.equal(res.statusCode, 200);
    t.equal(res.payload, 'http://localhost:1337');
    t.end();
  });
});

test('akaya >> appends a query string', t => {
  const { server } = setup();

  server.route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo', {
        query: {
          greet: 'hello',
          object: 'world'
        }
      }));
    }
  }, {
    method: 'GET',
    path: '/foobar',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply();
      }
    }
  }]);

  server.inject('/', res => {
    t.equal(res.payload, 'http://localhost:1337/foobar?greet=hello&object=world');
    t.end();
  });
});

test('akaya >> strips a trailing question mark if query paramter is undefined', t => {
  const { server } = setup();

  server.route([{
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply(request.aka('foo', {
        query: {
          greet: undefined
        }
      }));
    }
  }, {
    method: 'GET',
    path: '/foobar',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply();
      }
    }
  }]);

  server.inject('/', res => {
    t.equal(res.payload, 'http://localhost:1337/foobar');
    t.end();
  });
});

test('akaya >> server method for relative URI is accessible', t => {
  const { server } = setup();

  server.route([{
    method: 'GET',
    path: '/foo',
    config: {
      id: 'foo',
      handler: function (request, reply) {
        reply();
      }
    }
  }]);

  t.equal(server.aka('foo'), '/foo');
  t.end();
});
