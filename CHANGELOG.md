# Changelog

## [1.3.0](https://github.com/sunix/karasun/compare/v1.2.1...v1.3.0) (2026-08-03)


### Features

* give PR-preview APKs their own package id, scheme, and app name ([#14](https://github.com/sunix/karasun/issues/14)) ([a54c5d7](https://github.com/sunix/karasun/commit/a54c5d73a64eadf670c491e75eaff1212a2fccdd))

## [1.2.1](https://github.com/sunix/karasun/compare/v1.2.0...v1.2.1) (2026-08-03)


### Bug Fixes

* keyPassword reported missing despite identical assignment ([#11](https://github.com/sunix/karasun/issues/11)) ([6b7e53e](https://github.com/sunix/karasun/commit/6b7e53e21bf60cb9aa0dcdf60a3c5c9fddc5278e))
* reuse store password as key password (PKCS12 has no separate one) ([#10](https://github.com/sunix/karasun/issues/10)) ([393dde1](https://github.com/sunix/karasun/commit/393dde1be526db61064a9cc2976d9ff14899417f))
* strip all whitespace (not just \r) before decoding the keystore ([#8](https://github.com/sunix/karasun/issues/8)) ([c26759e](https://github.com/sunix/karasun/commit/c26759edbcb74a500b64799654a1f3e42bc8b51f))
* use = assignment for signingConfig properties, not setter-call style ([#12](https://github.com/sunix/karasun/issues/12)) ([3b1b9ce](https://github.com/sunix/karasun/commit/3b1b9ce15e46ce80056e7abd6fca8deadefa494b))

## [1.2.0](https://github.com/sunix/karasun/compare/v1.1.0...v1.2.0) (2026-07-27)


### Features

* add release automation, self-update, and real release signing ([#2](https://github.com/sunix/karasun/issues/2)) ([b23d054](https://github.com/sunix/karasun/commit/b23d0542305999e6d1f655da2faa7ddea92469dc))


### Bug Fixes

* release-apk.yml never triggers, and tags break version parsing ([#5](https://github.com/sunix/karasun/issues/5)) ([d743fae](https://github.com/sunix/karasun/commit/d743faebaeaaf77b125ba8e9212e0044e3086d43))
* secrets context isn't allowed in if: conditions (release-apk.yml) ([#3](https://github.com/sunix/karasun/issues/3)) ([a047c9a](https://github.com/sunix/karasun/commit/a047c9a4999249581fbc14dc5a5feabbd4a909ce))

## [1.1.0](https://github.com/sunix/karasun/compare/karasun-v1.0.0...karasun-v1.1.0) (2026-07-27)


### Features

* add release automation, self-update, and real release signing ([#2](https://github.com/sunix/karasun/issues/2)) ([b23d054](https://github.com/sunix/karasun/commit/b23d0542305999e6d1f655da2faa7ddea92469dc))


### Bug Fixes

* secrets context isn't allowed in if: conditions (release-apk.yml) ([#3](https://github.com/sunix/karasun/issues/3)) ([a047c9a](https://github.com/sunix/karasun/commit/a047c9a4999249581fbc14dc5a5feabbd4a909ce))
