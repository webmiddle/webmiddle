- Manually update peerDependencies since lerna doesn't do it when running `yarn lerna publish`. See https://github.com/lerna/lerna/issues/955
- Update CHANGELOG.md
- Execute `yarn build`
- Execute `yarn test` and make sure it passes
- Commit changes
- Execute `yarn lerna publish` and release the new version specified in CHANGELOG / peerDependencies.