## v0.5.1

- webmiddle-server: send welcome when getting homepage
- FIX webmiddle-server: express: default to empty api key
- Remove outdated info from packages README

## v0.5.0

- Bump dependencies
- webmiddle-server: Evaluations
- webmiddle: callStateInfo: use context.options as default options
- webmiddle-server: transform callStateInfo: fix options path
- webmiddle-server: serialize error
- Upgrade to Babel 7 and Ava 1.0.0-rc.1
- webmiddle-server, webmiddle-client: authorization with api key
- webmiddle-server: serializeCallNode: fix children
- webmiddle: migrate from proptypes to prop-types dependency
- Browser, HttpRequest: make `name` prop optional

#### BREAKING CHANGES
- Update minimum required node version: "^6.14.0 || >=8.10.0"
- webmiddle: internal refactor: callVirtual -> evaluateVirtual
- Refactor: callStateInfo => callNode
- Refactor internal: call.js => addCallNode.js
- Complete rewrite of transformation components
- Remove obsolete transformation components
- Transformation components: use content prop instead of children
- ErrorBoundary: rename handleCatch prop to catch
- ErrorBoundary: switch from children prop to try
- Resume: drop Pipe dependency and only evaluate children[0]
- Resume: switch from children[0] prop to task
- Resume: don't expect resources anymore, wrap result in a x-webmiddle-type resource
- Pipe: don't expect resources, only pass the last result to functions
- Parallel: switch from children prop to tasks, support both arrays and objects
- Remove obsolete ArrayMap component
- Parallel: do not expect resources anymore
- webmiddle: remove resource overrides

## v0.4.0

- Bump dependencies
- Remove obsolete script execall.js
- #8 | Split save & read cookie tests, remove randomness
- callStateInfo: send result update
- callStateInfo: store and emit thrown error

#### BREAKING CHANGES
- #13 | Don't create callStateInfo for component calls anymore.
- Packages: set webmiddle as peer dependency to prevent duplication
- #14 | Resource API change
- #15 | Virtual API change
- webmiddle-server: transform: lazy load
- webmiddle-server: rename transform to serialize
- #89 | API change: rename service to component. Keep service for components that are "network-aware".
- webmiddle-server: service paths: include name and description of services

## v0.3.0

- #6 | Remove need for webmiddle import when using JSX
- Browser: convert PhantomJS to Headless Chrome
- #5 | Browser - infer contentType from response, return response text for non html resources
- #5 | Browser: default content type even if body is empty
- Browser & HttpRequest: contentType prop not mandatory
- #5 | HttpRequest: infer contentType from response, normalize props and defaults  
- Update dependencies

#### BREAKING CHANGES

- #6 | webmiddle: remove pickDefaults
- #6 | Remove component options
- #7 | Fix error handling
- New context and callStateInfo runtime model
- #6 | Refactor context API
- #6 | Remove webmiddle class
- #6 | Simplify webmiddle-server and webmiddle-client
- #6 | Remove webmiddle settings. Context options can be used instead
- Change minimum node version: "^6.9.0 || >=8.0.0"

#### INTERNAL

- Use yarn workspaces with lerna
- Update dev dependencies
- Use one single ava dependency in the root
- Use one single babel dependency in the root