# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.1]
### Fixed
- Fix module in type definitions file to match name of package ([#17](https://github.com/MetaMask/eth-query/pull/17))

## [3.0.0]
### Added
- First release of this package
  - This package, `@metamask/eth-query`, is derived from [`eth-query`](https://github.com/ethereumjs/eth-query), whose last version at this time is 2.1.2. All changes listed below are in reference to this package.
- Add TypeScript type definitions ([#2](https://github.com/MetaMask/eth-query/pull/2), [#12](https://github.com/MetaMask/eth-query/pull/12))

### Changed
- **BREAKING:** Enforce a minimum Node version of 16 ([#7](https://github.com/MetaMask/eth-query/pull/7))
- Make install scripts for dependencies opt-in via `@lavamoat/allow-scripts` ([#5](https://github.com/MetaMask/eth-query/pull/5))

[Unreleased]: https://github.com/MetaMask/eth-query/compare/v3.0.1...HEAD
[3.0.1]: https://github.com/MetaMask/eth-query/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/MetaMask/eth-query/releases/tag/v3.0.0
