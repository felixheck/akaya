![akaya](https://raw.githubusercontent.com/felixheck/akaya/master/assets/logo.png)

# akaya
#### Generate URIs based on named [hapi](https://github.com/hapijs/hapi) routes and their parameters

[![Travis](https://img.shields.io/travis/felixheck/akaya.svg)](https://travis-ci.org/felixheck/akaya/builds/) ![node](https://img.shields.io/node/v/akaya.svg) ![npm](https://img.shields.io/npm/dt/akaya.svg) [![standard](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](http://standardjs.com/) ![npm](https://img.shields.io/npm/l/akaya.svg)
---

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Usage](#usage)
4. [API](#api)
5. [Example](#example)
6. [Testing](#testing)
7. [Contribution](#contribution)

## Introduction

This [hapi](https://github.com/hapijs/hapi) plugin enables to generate URIs dynamically based on the `config.id` of a route and passed parameters. It supports mandatory, multiple and optionals parameters as well as wildcards. Because it is not necessary to hardcode the URIs, it supersedes further adjustments in the case of refactoring.

This plugin is based on a [hapi-to](https://github.com/mtharrison/hapi-to) fork but it is about 30x faster.<br/>
The modules `standard` and `tape` are used to grant a high quality implementation.<br/>

#### Compatibility
| Major Release | [hapi.js](https://github.com/hapijs/hapi) version | node version |
| --- | --- | --- |
| `v5` | `>=18.4 @hapi/hapi` | `>=12` |
| `v4.1` | `>=18.3.1 @hapi/hapi` | `>=8` |
| `v4` | `>=18 hapi` | `>=8` |
| `v3` | `>=17 hapi` | `>=8` |
| `v2` | `>=13 hapi` | `>=6` |

## Installation
For installation use the [Node Package Manager](https://github.com/npm/npm):
```
$ npm install --save akaya
```

or clone the repository:
```
$ git clone https://github.com/felixheck/akaya
```

## Usage
#### Change from `hapi-to` to `akaya`
If you want to change from `hapi-to` to `akaya` for performance reasons, just replace the `require` and use `request.aka` instead of `request.to`. Because the configuration is almost the same, the migration is seamless.

It just differs in the [configuration](#api) of `options.secure`. The value `"match"` is not available in `akaya`. The plugin matches the current request's connections protocol automatically as default.

Additionally parts of the functionality are exposed as server method.

#### Import
First you have to import the module:
``` js
const akaya = require('akaya');
```

#### Create hapi server
Afterwards create your hapi server if not already done:
``` js
const hapi = require('@hapi/hapi');
const server = hapi.server({
  port: 1337,
  host: 'localhost',
});
```

#### Registration
Finally register the plugin per `server.register()`:
``` js
(async () => {
  await server.register(akaya);
  server.start();
})();
```

After registering `akaya`, the [hapi request object](hapijs.com/api#request-object) and the [hapi server object](https://hapijs.com/api#server) will be decorated with the new methods `request.aka()` and `server.aka()`.

## API
`server.aka(id, [params])`

Returns an relative URI to a route
- `id {string}` - required routes `config.id`.
- `params`
  - `query {Object.<?string>}` - Necessary query parameters, which will be stringified.
  - `params {Object.<?string>}` - Necessary path parameters.

`request.aka(id, [params], [options])`

Returns an URI to a route
- `id {string}` - see above
- `params` – see above
- `options`
  - `rel {boolean}` - Whether to generate a relative URL. Default: `false`.
  - `secure {boolean}` - If `true` the URL will be https, if `false` will be http. Default: match the `x-forwarded-proto` header or the current request's connection protocol.
  - `host {string}` - Sets the host in the URL. Default: match the current request.

## Example

```js
const hapi = require('hapi');
const akaya = require('akaya');

const server = hapi.server({ port: 1337 });

server.route([{
    method: 'GET',
    path: '/',
    handler (request, h) {
        const url = request.aka('foo', {
          params: { object: 'world' },
          query: { page: '1' }
        });

        return h.redirect(url);
    }
}, {
    method: 'GET',
    path: '/multi',
    handler (request, h) {
        const url = request.aka('bar', {
          params: { multi: [42, is, sense, of life] }
        });

        return h.redirect(url);
    }
}, {
    method: 'GET',
    path: '/hello/{object}',
    config: {
        id: 'foo',
        handler (request) {
          return 'No more redirects.';
        }
    }
}, {
    method: 'GET',
    path: '/{multi*5}',
    config: {
        id: 'bar',
        handler (request) {
          return 'No more redirects.';
        }
    }
}]);

(async () => {
  try {
    await server.register(akaya);
    await server.start();
    console.log('Server started successfully');
  } catch (err) {
    console.error(err);
  }
})();
```

The example above make use of redirects and `akaya`:

The route `http://localhost:1337/` will be redirected to `http://localhost:1337/hello/world?page=1`.<br/>
And the route `http://localhost:1337/multi` will be redirected to `http://localhost:1337/42/is/sense/of/life`.

## Testing
First you have to install all dependencies:
```
$ npm install
```

To execute all unit tests once, use:
```
$ npm test
```

or to run tests based on file watcher, use:
```
$ npm start
```

To get information about the test coverage, use:
```
$ npm run coverage
```

## Contribution
Fork this repository and push in your ideas.

Do not forget to add corresponding tests to keep up 100% test coverage.

In case of questions or suggestions just open an issue.
