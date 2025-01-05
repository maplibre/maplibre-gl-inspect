## How to release a new version

In Order to release a new version the following steps need to be done:

1. `npm version <new-version> --no-git-tag-version`.
2. Commit changes to with a message of `Bump version to <new-version>`.
3. The CI will pick-up the version change and will do the rest for you.