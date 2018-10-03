## Unreleased

- #13 | Don't create callStateInfo for component calls anymore.

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