# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.17.2](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.17.1...v2.17.2) (2025-12-02)

**Note:** Version bump only for package tiff-imagery-provider





## [2.17.1](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.17.0...v2.17.1) (2025-06-13)

**Note:** Version bump only for package tiff-imagery-provider






# [2.17.0](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.16.0...v2.17.0) (2025-01-06)


### Features

* **TIFFImageryProvider:** enhance tile loading and reprojection performance ([baea8c3](https://github.com/hongfaqiu/tiff-imagery-provider/commit/baea8c32b355718c2f226fce736d947e4677bd8d))





# [2.16.0](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.15.2...v2.16.0) (2024-11-26)


### Features

* upgrade to WebGL2 and optimize color scale texture ([85c6048](https://github.com/hongfaqiu/tiff-imagery-provider/commit/85c6048a51d17fedab5b3b342bdc541cfbf2f168))





## [2.15.2](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.15.1...v2.15.2) (2024-11-20)


### Bug Fixes

* Fixed the tile border splicing issue [#41](https://github.com/hongfaqiu/tiff-imagery-provider/issues/41) ([295d476](https://github.com/hongfaqiu/tiff-imagery-provider/commit/295d4768c716f56f33a9df82d8c4f4f05e76cb6f))





## [2.15.1](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.15.0...v2.15.1) (2024-11-15)


### Bug Fixes

* process NAN value ([cb91df3](https://github.com/hongfaqiu/tiff-imagery-provider/commit/cb91df38ddfd67911a8e73c4c6bdf0eb054cc5b9))





# [2.15.0](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.14.2...v2.15.0) (2024-11-15)


### Features

* **plot:** use plot class for RGB rendering ([#41](https://github.com/hongfaqiu/tiff-imagery-provider/issues/41)) ([c133785](https://github.com/hongfaqiu/tiff-imagery-provider/commit/c1337856902b9dec5f79797c8acb4e2295a66362))






## [2.14.2](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.14.1...v2.14.2) (2024-10-18)


### Bug Fixes

* modify getValue function to properly handle buffer boundaries ([267cc0a](https://github.com/hongfaqiu/tiff-imagery-provider/commit/267cc0a1913d2c2dd5ec72e6c5f19587ca4ee465))





## [2.14.1](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.14.0...v2.14.1) (2024-10-18)


### Bug Fixes

* copyNewSize func ([df4fde7](https://github.com/hongfaqiu/tiff-imagery-provider/commit/df4fde7d689523b8720822a6846f0719ec6863cc))





# [2.14.0](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.13.3...v2.14.0) (2024-10-18)


### Features

* add useImageCountAsMaximumLevel parameter ([8ffc2c2](https://github.com/hongfaqiu/tiff-imagery-provider/commit/8ffc2c2d0a9c531b19a345011b61c726909be1ea))
* gpu based resample ([0ca44b2](https://github.com/hongfaqiu/tiff-imagery-provider/commit/0ca44b26e355dc1c61fd7210250dcef73af62990))





## [2.13.3](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.13.2...v2.13.3) (2024-10-11)


### Bug Fixes

* geotiff workpool setting ([eb741c5](https://github.com/hongfaqiu/tiff-imagery-provider/commit/eb741c5f70d165bc6981c1f248f2e5d4c2667c2e))





## [2.13.2](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.13.1...v2.13.2) (2024-09-23)


### Bug Fixes

* show grid when neighboring with nodata ([cd8941e](https://github.com/hongfaqiu/tiff-imagery-provider/commit/cd8941e703716c01abd9c85913ee37fb4357798f))





## [2.13.1](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.13.0...v2.13.1) (2024-09-22)


### Bug Fixes

* resample with nodata ([f3e17cf](https://github.com/hongfaqiu/tiff-imagery-provider/commit/f3e17cf69363b15edcff2cf03d0b1afc89fd3f02))





# [2.13.0](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.12.3...v2.13.0) (2024-09-22)


### Bug Fixes

* bilinear resample dont handle nodata ([6b1d709](https://github.com/hongfaqiu/tiff-imagery-provider/commit/6b1d70940101314fb9d97c267af2591ab4934913))


### Features

* optimize memory usage and improve performance ([0a44295](https://github.com/hongfaqiu/tiff-imagery-provider/commit/0a4429572ff6b29a94fc52c21f565d2c7fa8b051))





## [2.12.3](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.12.2...v2.12.3) (2024-09-21)


### Bug Fixes

* single render dont request more than one band ([575bdd9](https://github.com/hongfaqiu/tiff-imagery-provider/commit/575bdd9ab50f9ba3fad62b5d3e25bcfb3fb659d1))






## [2.12.2](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.12.1...v2.12.2) (2024-08-07)


### Bug Fixes

* [#35](https://github.com/hongfaqiu/tiff-imagery-provider/issues/35) tentatively solved the boundary anomaly of the bilinear methods ([bc4e481](https://github.com/hongfaqiu/tiff-imagery-provider/commit/bc4e48197f609861907b05c1beb987413ee3ea4c))





## [2.12.1](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.12.0...v2.12.1) (2024-07-17)

**Note:** Version bump only for package tiff-imagery-provider





# [2.12.0](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.11.1...v2.12.0) (2024-07-17)


### Features

* bilinear resampling method ([2aea3b1](https://github.com/hongfaqiu/tiff-imagery-provider/commit/2aea3b1ccc5e5065c48986d7f31a32e050761733))





## [2.11.1](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.11.0...v2.11.1) (2024-07-11)

**Note:** Version bump only for package tiff-imagery-provider





# [2.11.0](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.10.7...v2.11.0) (2024-07-09)


### Features

* new resampling method [#30](https://github.com/hongfaqiu/tiff-imagery-provider/issues/30) ([9c2f8d0](https://github.com/hongfaqiu/tiff-imagery-provider/commit/9c2f8d06f2c2a880dff01a7a4a810cc332ae8daa))





## [2.10.7](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.10.6...v2.10.7) (2024-07-03)


### Bug Fixes

* fix discrete rendering errors, 4 decimal places of render precision support ([2006a62](https://github.com/hongfaqiu/tiff-imagery-provider/commit/2006a62dda50baecd88966cccbae04fcf3ef492c))





## [2.10.6](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.10.5...v2.10.6) (2024-07-02)


### Bug Fixes

* discrete colorScale drawing error ([1ced789](https://github.com/hongfaqiu/tiff-imagery-provider/commit/1ced78973fa8e5e19a95e65b973ed2301b0583ba))





## [2.10.5](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.10.4...v2.10.5) (2024-04-03)


### Bug Fixes

* useRealValue with domain config ([ca6fc2b](https://github.com/hongfaqiu/tiff-imagery-provider/commit/ca6fc2be48f0cfd1dc030d9d276732023044d607))






## [2.10.4](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.10.3...v2.10.4) (2024-03-14)


### Bug Fixes

* native tiff range request error ([78ca47f](https://github.com/hongfaqiu/tiff-imagery-provider/commit/78ca47f6f2b0721be1c3586f7fb21616438c5f10))





## [2.10.3](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.10.2...v2.10.3) (2024-03-13)


### Bug Fixes

* safari canvas.toDataUrl() error ([1b0894f](https://github.com/hongfaqiu/tiff-imagery-provider/commit/1b0894f83f4cdbaff722f6c9c6b63ebf63a3d574))





## [2.10.2](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.10.1...v2.10.2) (2024-03-06)


### Bug Fixes

* compatible Safari (remove web-worker) ([81ffe2d](https://github.com/hongfaqiu/tiff-imagery-provider/commit/81ffe2d5fc7c0c728b1815f25e19f06d5311d66f))





## [2.10.1](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.10.0...v2.10.1) (2024-01-12)


### Bug Fixes

* remove console & update readme ([7c6dcae](https://github.com/hongfaqiu/tiff-imagery-provider/commit/7c6dcaeee56c6152f854cad89e2029226ff3f229))





# [2.10.0](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.9.6...v2.10.0) (2024-01-12)


### Bug Fixes

* fix the issue of incomplete display across 180 degrees ([64ef6ef](https://github.com/hongfaqiu/tiff-imagery-provider/commit/64ef6efb1478af9b7868f9b5cc6437b94eb52d2f))


### Features

* add useRealValue option ([567861a](https://github.com/hongfaqiu/tiff-imagery-provider/commit/567861afa2e0501885b5c595538c3d653997bb13))





## [2.9.6](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.9.5...v2.9.6) (2023-11-20)


### Bug Fixes

* reverseY check ([fc695f5](https://github.com/hongfaqiu/tiff-imagery-provider/commit/fc695f55af82c3afb0c07338f359fcad0c18c797))





## [2.9.5](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.9.4...v2.9.5) (2023-11-17)


### Bug Fixes

* support reverseY tiff ([22e7194](https://github.com/hongfaqiu/tiff-imagery-provider/commit/22e7194a96c9840b8e5c1d7eb28f65a78938cf1e))





## [2.9.4](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.9.3...v2.9.4) (2023-11-07)


### Bug Fixes

* delete url options when use fromUrl ([83de3e9](https://github.com/hongfaqiu/tiff-imagery-provider/commit/83de3e9772007537627c6382089a3410375840f2))





## [2.9.3](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.9.2...v2.9.3) (2023-11-07)


### Bug Fixes

* auto delete url in options when use fromUrl ([f3e8908](https://github.com/hongfaqiu/tiff-imagery-provider/commit/f3e890846ec39e4c753bb01ddca59fa4114c51b7))





## [2.9.2](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.9.1...v2.9.2) (2023-09-04)


### Bug Fixes

* multi band tiff single band rendering [#20](https://github.com/hongfaqiu/tiff-imagery-provider/issues/20) ([eb4a653](https://github.com/hongfaqiu/tiff-imagery-provider/commit/eb4a653ef97b0b87b1eb33ec43e719d4958f3843))





## [2.9.1](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.9.0...v2.9.1) (2023-09-04)


### Bug Fixes

* error publish ([e7ecb7e](https://github.com/hongfaqiu/tiff-imagery-provider/commit/e7ecb7e988404f700ff853ef554455bfac407b03))





# [2.9.0](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.8.2...v2.9.0) (2023-09-04)


### Features

* web based reprojection(but slow) ([665de3a](https://github.com/hongfaqiu/tiff-imagery-provider/commit/665de3a1eff952655db5daa8d516be8583f507f6))





## [2.8.2](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.8.1...v2.8.2) (2023-08-02)


### Bug Fixes

* account for different corner coordinates [#16](https://github.com/hongfaqiu/tiff-imagery-provider/issues/16) ([ed9e928](https://github.com/hongfaqiu/tiff-imagery-provider/commit/ed9e92835a4535779126b76d5237b32cf1817db2))





## [2.8.1](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.8.0...v2.8.1) (2023-07-31)


### Performance Improvements

* reduce packaging size ([1455d78](https://github.com/hongfaqiu/tiff-imagery-provider/commit/1455d789877406aeaf8b04282f2b66a8b0eae39f))





# [2.8.0](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.7.0...v2.8.0) (2023-07-31)


### Bug Fixes

* **demo:** higher cesium version mistake ([7392a20](https://github.com/hongfaqiu/tiff-imagery-provider/commit/7392a20fa8373f8917e79cbccc86dd21669bfe6a))


### Features

* add colorMapping options [#19](https://github.com/hongfaqiu/tiff-imagery-provider/issues/19) ([c751416](https://github.com/hongfaqiu/tiff-imagery-provider/commit/c75141647aa72f3f749d28ffa5a16006f0c40215))





# [2.7.0](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.6.7...v2.7.0) (2023-07-04)


### Bug Fixes

* update readme [#16](https://github.com/hongfaqiu/tiff-imagery-provider/issues/16) ([c52dfca](https://github.com/hongfaqiu/tiff-imagery-provider/commit/c52dfca52dc4b3cc4bd3bd099e9827e3bb039aaa))


### Features

* reproject any projection coords [#18](https://github.com/hongfaqiu/tiff-imagery-provider/issues/18) ([64f404a](https://github.com/hongfaqiu/tiff-imagery-provider/commit/64f404aa3ce87a7e059cc92e9dc21654dc037281))





## [2.6.7](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.6.6...v2.6.7) (2023-07-03)


### Bug Fixes

* fromUrl options ([655eba1](https://github.com/hongfaqiu/tiff-imagery-provider/commit/655eba120e2dcfa3036274b6193cb630e398c977))





## [2.6.6](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.6.5...v2.6.6) (2023-07-03)


### Bug Fixes

* fromUrl options defaults to undefined [#17](https://github.com/hongfaqiu/tiff-imagery-provider/issues/17) ([9fd81b3](https://github.com/hongfaqiu/tiff-imagery-provider/commit/9fd81b328504000ef58420d1d80ca216396b3383))





## [2.6.5](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.6.4...v2.6.5) (2023-06-26)


### Bug Fixes

* error extend ImageryProvider ([6d0cbe9](https://github.com/hongfaqiu/tiff-imagery-provider/commit/6d0cbe9f019479eefef8c61ec31dd3c250beda82))





## [2.6.4](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.6.3...v2.6.4) (2023-06-26)


### Performance Improvements

* some uncertain modifications ([a53c115](https://github.com/hongfaqiu/tiff-imagery-provider/commit/a53c115888e2e3367c0298eb7639314e1eb31dc7))





## [2.6.3](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.6.2...v2.6.3) (2023-06-21)


### Performance Improvements

* adjust code order ([a59d0de](https://github.com/hongfaqiu/tiff-imagery-provider/commit/a59d0de3746c1960821b29f4159346a2808e8764))





## [2.6.2](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.6.1...v2.6.2) (2023-06-21)


### Bug Fixes

* colorScaleImage not working [#13](https://github.com/hongfaqiu/tiff-imagery-provider/issues/13) ([99812c8](https://github.com/hongfaqiu/tiff-imagery-provider/commit/99812c8d71ee1ffea4e0c338ba1d3be19047a6f2))





## [2.6.1](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.6.0...v2.6.1) (2023-06-21)


### Bug Fixes

* native tiff support ([2899702](https://github.com/hongfaqiu/tiff-imagery-provider/commit/28997027125d6841a6fbf49f63ed78d4a5c7ba55))





# [2.6.0](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.5.0...v2.6.0) (2023-06-20)


### Features

* add fromUrl, support cesium@1.104+ [#11](https://github.com/hongfaqiu/tiff-imagery-provider/issues/11) ([8ce6a81](https://github.com/hongfaqiu/tiff-imagery-provider/commit/8ce6a81a49cf49634f64b6ca05eb376292709e7e))





# [2.5.0](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.4.3...v2.5.0) (2023-06-20)


### Features

* some features and fixed ([a6a37fa](https://github.com/hongfaqiu/tiff-imagery-provider/commit/a6a37fa72844a418492c4eb289c0cdf5cc1ca486))





## [2.4.3](https://github.com/hongfaqiu/tiff-imagery-provider/compare/v2.4.2...v2.4.3) (2023-05-06)


### Bug Fixes

* display_range unavalible on expression [#10](https://github.com/hongfaqiu/tiff-imagery-provider/issues/10) ([de464e9](https://github.com/hongfaqiu/tiff-imagery-provider/commit/de464e94c5a0af41c4b8978b430aaf154d245a2e))
