# Installation

Get started in 3 steps:
1. **CLI**: Install `hdlss` CLI.
2. **Configuration**: Create a configuration file and provision your service instance.
3. **Frontend**: Include the client library in your frontend code.

**Step 1: CLI**

```bash
npm i -g hdlss
```

**Step 2: Configuration**

Create a configuration file named `hdlss.config.js`:

```js
config = {
    projectId: 'myapp.com',
    appUrl: 'https://myapp.com',
    '/thumb': {
        load: '/thumbnail',
    },
}
```

Ask hdlss.io to generate your CLI UUID, project token, and provision some resources for you:

```bash
hdlss init
```

(From the same folder.)

You now have a `hdlss.token.js` file that you should keep safe and treat like you would any service token with full permissions.

To update the configuration make changes to the config file and run:

```bash
hdlss apply
```

(These operations may take up to a few minutes to complete.)

**Step 3: Frontend**

Include the `hdlss-browser-client` library in your frontend project:

```bash
npm i hdlss-browser-client
```

Call the `ready` function in all (relevant) routes that should be renderable using hdlss.io:

```js
// ...
// route has finished rendering, capture screen now
hdlss.ready()
// ...
```

You're good to go:

```bash
curl https://hdlss.io/a/myapp.com/thumb > thumb.png
```

# Use Cases (Examples)

## generating thumbnails for your users

Sample config:

```js
config = {
    appUrl: 'https://mydrawingapp.com',
    '/thumb/$id/$width': {
        load: '/drawing/$id',
        output: {
            type: 'jpeg',
            maxWidth: 680,
        },
        cache: '24h',
    },
}
```

Sample curl:

```bash
curl https://hdlss.io/a/mydrawingapp.com/thumb/12345/320 > thumb-12345-320.jpeg
```

## allowing your users to export pages as PDF or image

Sample config:

```js
config = {
    appUrl: 'https://mydrawingapp.com',
    defaults: {load: '/drawing/$id'},
    '/export/pdf/$id': {
        output: {
            type: 'pdf',
            media: 'screen',
            landscape: true,
        },
        cache: false,
    },
    '/export/png/$id': {
        output: 'png',
        viewport: '4k',
        cache: false,
    },
}
```

Sample curl:

```bash
curl https://hdlss.io/a/mydrawingapp.com/thumb/12345/320 > thumb-12345-320.jpeg
```

# Gitops Support

Sample git hook script that will check if any `hdlss.config.js` file has changed and will run `hdlss apply` for each one:

```bash
#!/usr/bin/env bash

set -euo pipefail

HDLSS_API=https://api.hdlss.io

hdlss_files=$(git diff-tree --no-commit-id --name-only -r HEAD | { grep hdlss.config.js || true; })

[[ -n "$hdlss_files" ]] || exit 0

for f in "$hdlss_files"; do
    echo -n "hdlss.io config changed at $f, applying update... "
    token_file="$(dirname $f)/hdlss.token.js"
    [[ -f $token_file ]] || { echo "ERROR: token file not found at $token_file, cannot apply update!" >&2; exit 1; }
    curl -s -S --fail --data-binary @$f -H 'Content-Type: text/plain' -H "Authorization: $(cat $token_file | base64 -w0)" ${HDLSS_API}/v1/apply >/dev/null
    echo "OK"
done
```

Sample `.gitlab-ci.yml` to go with the above:

```yaml
stages:
- hooks

run_hooks:
  stage: hooks
  script: .ci/hooks/hdlss.sh
  only:
  - master
```

Suggested dir layout in your gitops git repo, assuming single gitops repo for a single group of co-deployed/interdependent (micro-)services:

```
(repo root)
|- services
   |- hdlss.io
      |- hdlss.config.js
      |- hdlss.token.js
```

# Configuration Options Reference

## Spec for the configuration format

```js
const routeOptions = {
    basicAuth: {username: 'string', password: 'string'},
    load: 'uriWithParams',
    viewport: 'dimensions',
    cache: 'bool|duration', // | means OR
    timeout: 'duration',
    output: {
        __defaultKey__: 'type', // this means if given output: 'png' it will transform into output:{type:'png'}
        type: 'pdf|png|jpeg', // these are literals, not types
        media: 'screen|print', // again both literals
        landscape: 'bool',
        maxWidth: 'uint',
        width: 'uint',
        height: 'uint',
    },
}

module.exports = {
    spec: {
        appUrl: 'url!',
        customDomain: 'domain',
        environments: {
            '[string]': { // applies to all key-value pairs with a key type of string
                appUrl: 'urlWithParams',
                defaults: routeOptions,
            }
        },
        defaults: routeOptions,
        '[uriWithParams] route': { // applies to all key-value pairs with a key type of uriWithParams
            ...routeOptions
        },
        projectId: 'string',
    },
}
```

### Type notes
**dimensions**

Any "number non-decimal-non-whitespace number" string, ignoring whitespace. Examples: 1024*768, 1024 x 768
Special named dimensions:

```js
const named = {
    '8k': '7680 x 4320',
    '4k': '3840 x 2160',
    'hd': '1920 x 1080',
    '1080p': '1920 x 1080',
    '720p': '1280 x 720',
}
```

## Parameter Handling

Any parameters (path or query) are passed to the app being rendered and can be retrieved by calling `hdlss.getEnv(paramName)`.

## Special Parameters

| Parameter | Function |
|---|---|
| width | overrides configured output width |
| authToken | replaced with cryptographically secure randomly chosen token in any output URLs; so if any routes require a user's personal token to render their content the token will not be leaked even if a user should copy-paste an image URL to share it with someone else; otherwise not treated specially |

## Advanced Configuration Example

```js
config = {
    customDomain: 'img.myapp.com', // projectId defaults to (customDomain || appUrl)
    appUrl: 'https://app.myapp.com',
    environments: { // urls can be prefixed by environment name
        preview: {
            appUrl: 'https://preview.myapp.com/$branch', // path variables defined here are expected to be passed right after the environment name, e.g. hdlss.io/a/img.myapp.com/preview/master/...
            defaults: {
                basicAuth: {username: 'myuser', password: 'mypass'}, // require http basic auth for all routes accessed through this environment
            },
            // env-specific routes could be defined here
        },
        // more envs can go here
    },
    defaults: {
        load: '/print/$id',
        output: 'png',
        timeout: '60s', // increase from default 10s
    },
    '/t/$width/$id/$authToken?': { // '?' means optional param
        cache: '30m', // cache for a short time
        output: {
            maxWidth: 700, // mostly to prevent anyone from messing with us and use up unnecessary compute
        },
        load: '/print/$id?hideNonPrintSection=1', // url params available to app as expected
    },
    '/export/png/$id/$authToken?': {
        cache: false, // always render freshly
        viewport: '4k',
    },
    '/export/png/8k/$id/$authToken?': {
        cache: false,
        viewport: '8k',
    },
    '/export/pdf/$id/$authToken?': {
        cache: false,
        viewport: '4k',
        output: {
            type: 'pdf',
            media: 'screen',
            landscape: true,
        },
    },
}

```

# Known Issues

* It may sometimes take up to 10 minutes or longer before a configuration update via `hdlss apply` has been processed.

# Roadmap

* Make any configured parameters overridable via URL path or query parameters
* Zero-config mode
* (Sub-)Domain validation
* Not requiring client library inclusion and `hdlss.ready()` call when request is already validated through (sub-)domain
