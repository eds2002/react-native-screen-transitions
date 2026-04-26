# Changelog

# [3.5.0](https://github.com/eds2002/react-native-screen-transitions/compare/v3.5.0-beta.0...v3.5.0) (2026-04-26)

# [3.5.0-beta.0](https://github.com/eds2002/react-native-screen-transitions/compare/v3.2.0...v3.5.0-beta.0) (2026-04-21)


### Bug Fixes

* **bounds:** stabilize grouped zoom measurements ([0ed8b82](https://github.com/eds2002/react-native-screen-transitions/commit/0ed8b82560187710a67cb39af421b9b9e2147a6a))
* deep linking bug fix ([1464618](https://github.com/eds2002/react-native-screen-transitions/commit/1464618ac05c52edd0d2a44a2064fec52522e034))
* **docs:** include docs helpers and netlify config ([#88](https://github.com/eds2002/react-native-screen-transitions/issues/88)) ([403cff5](https://github.com/eds2002/react-native-screen-transitions/commit/403cff56e321f21d688345af4d8bb77a1802a40d))
* **docs:** ship docs as static netlify site ([#89](https://github.com/eds2002/react-native-screen-transitions/issues/89)) ([e91472a](https://github.com/eds2002/react-native-screen-transitions/commit/e91472a03d2b1d7df000059e753272a74c5eb4cc))
* group bounds retargetting bug ([319d965](https://github.com/eds2002/react-native-screen-transitions/commit/319d9654e283529b158a2acc7a6848490d319bde))
* **history:** keep v3 close tracking on reanimated ([7f6dcf8](https://github.com/eds2002/react-native-screen-transitions/commit/7f6dcf89066942f3c474d06d117e0f48a19ad80f))
* isolate scroll axis writes in useScrollRegistry ([#85](https://github.com/eds2002/react-native-screen-transitions/issues/85)) ([88e6589](https://github.com/eds2002/react-native-screen-transitions/commit/88e6589decee7d01f9b2bddfcff05f31795a0b20))
* **lifecycle:** align close and history flow with next ([f7f8ba7](https://github.com/eds2002/react-native-screen-transitions/commit/f7f8ba70e09fa27c3f778e90f5fcabfbd47371ec))
* previous screen not animating during flight ([#74](https://github.com/eds2002/react-native-screen-transitions/issues/74)) ([071512c](https://github.com/eds2002/react-native-screen-transitions/commit/071512c292e81986efdffe7e7b40ebbd220670a2))


### Features

* **docs:** lift docs site onto main ([#87](https://github.com/eds2002/react-native-screen-transitions/issues/87)) ([935985c](https://github.com/eds2002/react-native-screen-transitions/commit/935985c8a0904d1128ab9b3abc2dbe13b3951177))

# [3.4.0](https://github.com/eds2002/react-native-screen-transitions/compare/v3.4.0-rc.1...v3.4.0) (2026-04-19)


### Bug Fixes

* **bounds:** make grouped zoom tag cache worklet-safe ([8ab021c](https://github.com/eds2002/react-native-screen-transitions/commit/8ab021cca7194b123524dabc6773bc3ea35bcac8))
* **docs:** include docs helpers and netlify config ([#88](https://github.com/eds2002/react-native-screen-transitions/issues/88)) ([403cff5](https://github.com/eds2002/react-native-screen-transitions/commit/403cff56e321f21d688345af4d8bb77a1802a40d))
* **docs:** ship docs as static netlify site ([#89](https://github.com/eds2002/react-native-screen-transitions/issues/89)) ([e91472a](https://github.com/eds2002/react-native-screen-transitions/commit/e91472a03d2b1d7df000059e753272a74c5eb4cc))
* **docs:** sync docs hosting updates to release/v3.4 ([d3e7d06](https://github.com/eds2002/react-native-screen-transitions/commit/d3e7d06dda1c9dc225f1e082b148e9e8f0d56a89))
* isolate scroll axis writes in useScrollRegistry ([#85](https://github.com/eds2002/react-native-screen-transitions/issues/85)) ([88e6589](https://github.com/eds2002/react-native-screen-transitions/commit/88e6589decee7d01f9b2bddfcff05f31795a0b20))
* **screen-container:** prevent masked navigation dead space from dismissing sheets ([69290f4](https://github.com/eds2002/react-native-screen-transitions/commit/69290f45ef39dae61d4d79c612ca33cdaf52b58c))


### Features

* **docs:** build out new doc site ([31bd748](https://github.com/eds2002/react-native-screen-transitions/commit/31bd7487809d140b338c47a7a038a2f42fe566e7))
* **docs:** lift docs site onto main ([#87](https://github.com/eds2002/react-native-screen-transitions/issues/87)) ([935985c](https://github.com/eds2002/react-native-screen-transitions/commit/935985c8a0904d1128ab9b3abc2dbe13b3951177))

# [3.4.0-rc.1](https://github.com/eds2002/react-native-screen-transitions/compare/v3.4.0-rc.0...v3.4.0-rc.1) (2026-04-12)


### Features

* type navigation mask slots ([7e6f262](https://github.com/eds2002/react-native-screen-transitions/commit/7e6f2622596efa94f8dd0c3229a7fd7e7a4b2373))

# [3.4.0-rc.0](https://github.com/eds2002/react-native-screen-transitions/compare/v3.4.0-beta.2...v3.4.0-rc.0) (2026-04-05)

# [3.4.0-beta.2](https://github.com/eds2002/react-native-screen-transitions/compare/v3.4.0-beta.1...v3.4.0-beta.2) (2026-04-03)

# [3.4.0-beta.1](https://github.com/eds2002/react-native-screen-transitions/compare/v3.4.0-beta.0...v3.4.0-beta.1) (2026-03-31)


### Bug Fixes

* **bounds:** limit pending destination retries to grouped flows ([1e39b56](https://github.com/eds2002/react-native-screen-transitions/commit/1e39b56e83635e3d2b03c338572562e14b7b7be6))
* **bounds:** limit pre-transition source refresh to grouped boundaries ([d5c033a](https://github.com/eds2002/react-native-screen-transitions/commit/d5c033add0e0b215eebe163514c575519a45ba32))
* **bounds:** refresh grouped source before pre-transition measurement ([ec3f4f9](https://github.com/eds2002/react-native-screen-transitions/commit/ec3f4f9da577fe8826037fceaeb7a18431998383))
* restore hidden fallback for non-raw bounds styles ([c7acee9](https://github.com/eds2002/react-native-screen-transitions/commit/c7acee9a405eb8e327f8df89e2e5715ce6197241))
* **zoom:** debug mode ([65443af](https://github.com/eds2002/react-native-screen-transitions/commit/65443af7d26eb2e2ba2f13d709355d35f7fc60a3))
* **zoom:** revert back to old styling ([89fab35](https://github.com/eds2002/react-native-screen-transitions/commit/89fab352343a6e2ab2d1398dc0b09b7f1f397e69))


### Features

* **zoom:** add more options ([4c36338](https://github.com/eds2002/react-native-screen-transitions/commit/4c36338158de4bd98bac4ab91d71e62eacc0828d))

# [3.4.0-beta.0](https://github.com/eds2002/react-native-screen-transitions/compare/v3.4.0-alpha.7...v3.4.0-beta.0) (2026-03-30)


### Bug Fixes

* **bounds:** align id-only navigation zoom fallback targets ([27defdb](https://github.com/eds2002/react-native-screen-transitions/commit/27defdb94d676d765d22f3a0b7fca5f09b945127))
* **bounds:** avoid measuring while still in flight ([2dcceec](https://github.com/eds2002/react-native-screen-transitions/commit/2dcceece5ba3227ed86ef8c20b1a295c32c8dd7e))
* **bounds:** complete retargeted destination links from existing sources ([2574df2](https://github.com/eds2002/react-native-screen-transitions/commit/2574df2162196d17257585953766611c159c3764))
* **bounds:** prevent grouped zoom retarget ghosting and blanking ([dc72dc6](https://github.com/eds2002/react-native-screen-transitions/commit/dc72dc6674815adeeec1b530eebf88d04905c0eb))
* **bounds:** stop prepare from refreshing existing source links ([66da2d6](https://github.com/eds2002/react-native-screen-transitions/commit/66da2d600c991b3dd7840309418385ce18ed676e))
* **e2e:** fallback reel 8 to thumbnail ([d3c7d47](https://github.com/eds2002/react-native-screen-transitions/commit/d3c7d470b18f71c0513ec78331b4474eb9ee6257))
* mask clipping + animation adjustment ([9eab763](https://github.com/eds2002/react-native-screen-transitions/commit/9eab763fce1d7609a2fdfc02a450440f483b8ed2))
* reanimated bug when passing animated styles to boundary ([fe06872](https://github.com/eds2002/react-native-screen-transitions/commit/fe06872b9e13a508e7317b57411252cd1bd9435e))
* revert style reset system for layers ([9bbbcd3](https://github.com/eds2002/react-native-screen-transitions/commit/9bbbcd38c3ba6cc71ab7db582aad2de5f04581d9))
* **scroll:** debounce settled signal from onScroll ([4ec04f5](https://github.com/eds2002/react-native-screen-transitions/commit/4ec04f538d83ec25ffe8b3adb83765d31c1b0835))
* wrong pressable used, running animated styles on reg components ([7595bee](https://github.com/eds2002/react-native-screen-transitions/commit/7595bee7ca17092d61e208644c5f45cb597c4710))
* **zoom:** resolve dst screen hiding on activeId change ([4843ac6](https://github.com/eds2002/react-native-screen-transitions/commit/4843ac6655b7207e04cf11b0052bb507790a005d))


### Features

* willAnimate state and remove scroll settled awareness ([589bd05](https://github.com/eds2002/react-native-screen-transitions/commit/589bd05d18dd97c3f2cf77076cbe69082c2b9003))
* **zoom:** integrate customizable options ([00947b3](https://github.com/eds2002/react-native-screen-transitions/commit/00947b382028a2eb7ae6f8ab58848d7d76b434f3))

# [3.4.0-alpha.7](https://github.com/eds2002/react-native-screen-transitions/compare/v3.4.0-alpha.6...v3.4.0-alpha.7) (2026-03-27)


### Bug Fixes

* avoid breaking static navigation ([913a249](https://github.com/eds2002/react-native-screen-transitions/commit/913a2498242dfd2726cd0a1135bf36d4533bee5d))
* **bounds:** make helpers return visible styles undoing the initial hidden style request ([47714d0](https://github.com/eds2002/react-native-screen-transitions/commit/47714d0fe137a56d0cce9f0eb8553de84f284765))


### Features

* build Transition.Boundary.Target to change the target in nested scenarios ([cb82a6c](https://github.com/eds2002/react-native-screen-transitions/commit/cb82a6c4d14eaa52d9577b3a756843c1f1a49536))


### Performance Improvements

* **bounds:** skip idle initial layout snapshots on mount ([34b0d7a](https://github.com/eds2002/react-native-screen-transitions/commit/34b0d7a76618dcea4ff02f7786a51869a24aa856))

# [3.4.0-alpha.6](https://github.com/eds2002/react-native-screen-transitions/compare/v3.4.0-alpha.4...v3.4.0-alpha.6) (2026-03-25)


### Bug Fixes

* already release alpha 5 ([8a9e847](https://github.com/eds2002/react-native-screen-transitions/commit/8a9e847ed91ab4d25031a4e306c2c956d9ab393d))
* backdrop behavior passthrough not working ([3f1a68f](https://github.com/eds2002/react-native-screen-transitions/commit/3f1a68fb68a8aac57d688aed2c655a4314709d00))
* **bounds:** reset element transformation styles to avoid shitty remeasurement ([757ee2b](https://github.com/eds2002/react-native-screen-transitions/commit/757ee2b0957f0671627e093f7b053c8c3de41d63))
* **bounds:** restore grouped source refresh and narrow zoom hide fallback ([13e0ac9](https://github.com/eds2002/react-native-screen-transitions/commit/13e0ac9c59bfbe23a822defef4d87eb496212254))
* **docs:** restore old docs ([bcbb3e5](https://github.com/eds2002/react-native-screen-transitions/commit/bcbb3e57a2ad5b851d9cafea9c39ffa12fa146db))
* harden gesture worklet defaults ([53d350e](https://github.com/eds2002/react-native-screen-transitions/commit/53d350e19d8d794625596dbf44be57be965b982d))


### Features

* new logicallySettled prop + fix zoom transition quirks ([149af8c](https://github.com/eds2002/react-native-screen-transitions/commit/149af8cebee459515a5669d15afa1a3baa642623))

# [3.4.0-alpha.4](https://github.com/eds2002/react-native-screen-transitions/compare/v3.4.0-alpha.2...v3.4.0-alpha.4) (2026-03-23)


### Bug Fixes

* **bounds:** fix flickering in individual bound components ([aa14c85](https://github.com/eds2002/react-native-screen-transitions/commit/aa14c8530e5dc059e3b0e9e30c4dcd598df56351))
* **bounds:** initialize navigation mask state in canonical frame props ([c362c18](https://github.com/eds2002/react-native-screen-transitions/commit/c362c18220d15b8b3e3847e4e5de7e9561a66b73))
* **bounds:** lessen strictness bounds not measuring on active id change ([0d8ddf7](https://github.com/eds2002/react-native-screen-transitions/commit/0d8ddf7b8357cf11a4a0669d2b4364fb1b142bb8))
* **bounds:** settle destination group refresh and drop source retarget writes ([bbdf4a2](https://github.com/eds2002/react-native-screen-transitions/commit/bbdf4a2efd631e421070ce9edf77d3ff0da8b7dc))
* **defer:** flip to opacity 0 to opacity 1 ([c53c23b](https://github.com/eds2002/react-native-screen-transitions/commit/c53c23bd85053b5cd4a0e22e2a65584484a396cc))
* **screen-interpolator:** make defer explicit and null pass through ([1c7b7b6](https://github.com/eds2002/react-native-screen-transitions/commit/1c7b7b68e513f412ec85765f0c233235d0e9d33a))
* **shared:** scope navigation mask container styles to masked screens ([a2f1678](https://github.com/eds2002/react-native-screen-transitions/commit/a2f167854421c055f930550a32917f2d25734caa))
* **zoom:** border radius not applied to non mask screens ([da6bdc2](https://github.com/eds2002/react-native-screen-transitions/commit/da6bdc2a551a786ebdd0a053ddb6e8a8a0b5a16f))
* **zoom:** fix animation not working with non mask screens ([70da048](https://github.com/eds2002/react-native-screen-transitions/commit/70da0488dc7beda6dec891590271986fa9f7bf3e))
* **zoom:** mis matched scaling for bound targets, make more opiniated ([a4873e2](https://github.com/eds2002/react-native-screen-transitions/commit/a4873e249d80c57b0a0b37782141cfb0ae98721b))
* **zoom:** preserve typed navigation slot return ([bc2757d](https://github.com/eds2002/react-native-screen-transitions/commit/bc2757d45626e22a1bf32b5b38ef746d6b9512e2))


### Features

* create store helper and refactor animation.store and gesture.store to use this new helper ([46cdbff](https://github.com/eds2002/react-native-screen-transitions/commit/46cdbff6b2ac5ba2e729fba8f44c19b4278b2e6a))
* **shared:** add deferred reveal and stabilize no-mask navigation zoom flicker ([3437046](https://github.com/eds2002/react-native-screen-transitions/commit/3437046898d18a171e283048b0432bb48a08ef6e))
* **shared:** add experimental initial mount animation for first screens ([938a1f3](https://github.com/eds2002/react-native-screen-transitions/commit/938a1f39db59b0a57ac12d5b8b1d77844cf68840))
* **zoom:** add border radius back, fix animating switching off during screen reset ([c6fc14f](https://github.com/eds2002/react-native-screen-transitions/commit/c6fc14f8c6a8a53a58b45e372513ac6268bd00dc))

# [3.4.0-alpha.2](https://github.com/eds2002/react-native-screen-transitions/compare/v3.4.0-alpha.1...v3.4.0-alpha.2) (2026-03-20)


### Bug Fixes

* **android:** prevent release flicker when native screens are disabled ([3b0db64](https://github.com/eds2002/react-native-screen-transitions/commit/3b0db64ab6b1599662f0661d26ec82af0646bff0))
* **blank-stack:** delay inactive screen detachment until transition end ([a494b4b](https://github.com/eds2002/react-native-screen-transitions/commit/a494b4b1fd05172732b2438176c90e1880221ee7))
* **bounds:** preserve content target direction when destination falls back to source snapshot ([8f53fa3](https://github.com/eds2002/react-native-screen-transitions/commit/8f53fa3c9d2841ab228d891eddb2edcc57e11675))
* dst screens do NOT need a boundary component to work ([af5b0b1](https://github.com/eds2002/react-native-screen-transitions/commit/af5b0b1a3e6848ec1bb380da36d92e40687a74de))
* flags regression ([201e48e](https://github.com/eds2002/react-native-screen-transitions/commit/201e48eb5b682f4cbada03f51ebd2ae33c3df53f))
* **gestures:** improve scroll boundary handoff across platforms ([77af400](https://github.com/eds2002/react-native-screen-transitions/commit/77af400588d9886559fbfdc1b2592e3ecefd1be3))
* masked screens not respecting pointer events based on backdropBehavior ([2d993e8](https://github.com/eds2002/react-native-screen-transitions/commit/2d993e8aecc48ee793d8dc53cebb8b4a99ccc041))
* **mask:** flickering when navigation mask is off ([6972aa3](https://github.com/eds2002/react-native-screen-transitions/commit/6972aa31aea2b214812cb326186ee5a7dc365400))
* **styles:** revert style resetter, post pone till v4 ([8c6b263](https://github.com/eds2002/react-native-screen-transitions/commit/8c6b263fdcd28df0e57fe3ffd0d21d60c0fa9496))
* **transitions:** clear stale root slot styles after screen removal ([96c0599](https://github.com/eds2002/react-native-screen-transitions/commit/96c0599a42a9d6ca560061032e9085a0d6174d15))
* zoom navigation should work with mask enabled or not mask enabled ([95cb695](https://github.com/eds2002/react-native-screen-transitions/commit/95cb695810a328c685ea7342a7ba7407d8bf94b5))


### Features

* add new layouts.content for snapPoints auto scenarios ([aac13d6](https://github.com/eds2002/react-native-screen-transitions/commit/aac13d6c9430eb02b789d5873ff0be31c6a65739))
* **bounds:** activeId should remeasure unfocused component when it changes ([0a51432](https://github.com/eds2002/react-native-screen-transitions/commit/0a51432888bdc92fab1449d335d6c3ee36287c83))
* expose alreadyAnimated option for creator hoc ([22e516c](https://github.com/eds2002/react-native-screen-transitions/commit/22e516ccfd1c7e34b81c4e11237e228d1ad909af))
* make blank stack support ability to use reg views for screens & support independent navigation ([ac7ee0c](https://github.com/eds2002/react-native-screen-transitions/commit/ac7ee0c0e7a1f8723c9205aae88b921ab367f8db))

# [3.4.0-alpha.1](https://github.com/eds2002/react-native-screen-transitions/compare/v3.4.0-alpha.0...v3.4.0-alpha.1) (2026-03-09)


### Bug Fixes

* **mask:** align surfaceComponent with masked navigation zoom ([cc5163b](https://github.com/eds2002/react-native-screen-transitions/commit/cc5163b03aa101725f9cff26c94b5cefadf52758))
* method content not working on the inverse ([96559d2](https://github.com/eds2002/react-native-screen-transitions/commit/96559d268d336d72804228cc82b2f02d912acb81))
* update example ([261bb9a](https://github.com/eds2002/react-native-screen-transitions/commit/261bb9af2895d27a3e557f6ee384f93f9d393002))


### Features

* add ability to get animation via ancestor ([f6da4c2](https://github.com/eds2002/react-native-screen-transitions/commit/f6da4c2ce1ffb105c369ece351756b64b7d80239))
* added support for auto snap points ([965705d](https://github.com/eds2002/react-native-screen-transitions/commit/965705dd8f5253b9201f54d0e5be40174b81b52f))
* expand zoom navigation options ([801338f](https://github.com/eds2002/react-native-screen-transitions/commit/801338fdb21f6c56be43ac476a93907543681394))
* useScreenGesture able to get ancestors ([4b6ad53](https://github.com/eds2002/react-native-screen-transitions/commit/4b6ad53396f8a1bcd8e1e90932517b975e446e2e))

# [3.4.0-alpha.0](https://github.com/eds2002/react-native-screen-transitions/compare/v3.2.0...v3.4.0-alpha.0) (2026-03-01)


### Bug Fixes

* adjust animation for a better masking during drag ([b3a08b1](https://github.com/eds2002/react-native-screen-transitions/commit/b3a08b171a9258dbeb683229b575afae252d0258))
* bounds improvement ([4ac3fb8](https://github.com/eds2002/react-native-screen-transitions/commit/4ac3fb8353e7e2341b1fff9c979e2cb432fb5a60))
* **bounds:** clear bounds by navigator route keys on stack teardown ([6d35f38](https://github.com/eds2002/react-native-screen-transitions/commit/6d35f3885610fa26281775867d3d11b16aee2aa5))
* **bounds:** defer style unsets during active transitions ([2607382](https://github.com/eds2002/react-native-screen-transitions/commit/2607382013c485e9e2c396485617e4b6b73de9f0))
* **bounds:** gate destination link writes to viewport valid measurements ([76e0350](https://github.com/eds2002/react-native-screen-transitions/commit/76e0350d2d45bebd0c4e2bb63996368a1f5eea5d))
* **bounds:** harden associated style lifecycle for grouped shared boundaries ([04ea98a](https://github.com/eds2002/react-native-screen-transitions/commit/04ea98a2e3ddbde14fbd350c68e3142af04194c0))
* **bounds:** keep active links protected during retarget close ([71e4766](https://github.com/eds2002/react-native-screen-transitions/commit/71e4766fe3311ec1f1985965f1ce264b83d3896e))
* **bounds:** reset grouped boundary styles when no longer active member ([f5b6544](https://github.com/eds2002/react-native-screen-transitions/commit/f5b6544716f55e36ba20db8c877bc9d93de898d9))
* **bounds:** split startup vs in-flight style guards for retarget stability ([93872ee](https://github.com/eds2002/react-native-screen-transitions/commit/93872eef3209068586f14274583191be592e1fcc))
* **bounds:** stabilize associated style lifecycle for shared boundaries ([398176d](https://github.com/eds2002/react-native-screen-transitions/commit/398176d11425d949a45f0183034bee5ad5355db4))
* clean up bound functions causing crash on spam ([d3ca9ef](https://github.com/eds2002/react-native-screen-transitions/commit/d3ca9efc1ee9da8be20fdfab017629daef52183c))
* custom backdrop issues ([0eeb53d](https://github.com/eds2002/react-native-screen-transitions/commit/0eeb53d12718df256cf77337deb8007f4edad819))
* dont block other boundary components when it has already resolved ([1f05417](https://github.com/eds2002/react-native-screen-transitions/commit/1f054179f19ba5a372a18a7a91c8b24f72d3dc2f))
* fix anchor handling inside zoom ([8483350](https://github.com/eds2002/react-native-screen-transitions/commit/848335068ff635072bfc8b78d251983941ffe460))
* fix same element spamming bug ([9a47ae5](https://github.com/eds2002/react-native-screen-transitions/commit/9a47ae534735904836e5783152457d463a97662f))
* for branch calculation, use the actually screen index rather than global index ([69db2f1](https://github.com/eds2002/react-native-screen-transitions/commit/69db2f108a3d9b4cb4c2af7990d0e244e03a2944))
* **gestures:** honor gestureReleaseVelocityMax ([2b6c021](https://github.com/eds2002/react-native-screen-transitions/commit/2b6c0210e56c5baee919a1d97b30f52a5bb1eec4))
* performance issues with boundary component ([9f4363a](https://github.com/eds2002/react-native-screen-transitions/commit/9f4363a9dca2133cc8b06d0c748fd2bc61ebcb77))
* preset specs ([293f12e](https://github.com/eds2002/react-native-screen-transitions/commit/293f12efb70817f1369004375f6a37bdaa3bf28d))
* prevent against spam pressing ([5309ece](https://github.com/eds2002/react-native-screen-transitions/commit/5309ece2f8d34385a0a83785de22e072d3011d84))
* previous screen not animating during flight ([#74](https://github.com/eds2002/react-native-screen-transitions/issues/74)) ([071512c](https://github.com/eds2002/react-native-screen-transitions/commit/071512c292e81986efdffe7e7b40ebbd220670a2))
* remove useNavigationHelpers from native stack close transition ([26c4841](https://github.com/eds2002/react-native-screen-transitions/commit/26c4841f305a51a753faf4a697fa358773ea4700))
* reset zIndex / elevation on reset ([83d4cc0](https://github.com/eds2002/react-native-screen-transitions/commit/83d4cc0bc2f6543f2d7f7f4033b02a51edce7f56))
* resolve size bounds bug, integrate bound sync examples ([9c8ecc8](https://github.com/eds2002/react-native-screen-transitions/commit/9c8ecc828eb8a35e408642d52d0537def7c03cc6))
* **stack:** skip closing routes in neighbor resolution via provider derived closing map ([af62c4d](https://github.com/eds2002/react-native-screen-transitions/commit/af62c4d549c5b42865aa9703b188065e6cb32cca))
* **stack:** skip visually closing routes when resolving scene neighbors ([327ade4](https://github.com/eds2002/react-native-screen-transitions/commit/327ade43498c346a85fba7187d7f7fdcace10705))
* style id example ([efbdc0d](https://github.com/eds2002/react-native-screen-transitions/commit/efbdc0d32d64a66f9e9c9415ee80022c1c7a8613))
* type safety ([1cf2044](https://github.com/eds2002/react-native-screen-transitions/commit/1cf2044438a5606759c3838ab5326fe98cef2ece))
* zoom example ([b3247c7](https://github.com/eds2002/react-native-screen-transitions/commit/b3247c7b87cade16f2c2e5ad363beecda32c990f))
* zoom preset initial faulty measurement ([51eb719](https://github.com/eds2002/react-native-screen-transitions/commit/51eb719fab7e9778ce1af92c199f6f2bf2c750c7))
* zoom preset shifting downwards on drag ([3ed4f24](https://github.com/eds2002/react-native-screen-transitions/commit/3ed4f24e734f556042792822e8c466f2350a7e47))
* **zoom:** respect scaleMode "match" in navigation zoom preset ([55996f8](https://github.com/eds2002/react-native-screen-transitions/commit/55996f8162685b4da03102f83270f678ef2e4aee))


### Features

* add benchmark ([c730ad8](https://github.com/eds2002/react-native-screen-transitions/commit/c730ad8968709bcc60dab28877ce1cee0b53cccf))
* add bounds options inside boundary component ([f8806d0](https://github.com/eds2002/react-native-screen-transitions/commit/f8806d00904f5b5f056fd5d8273b15ef90368863))
* add fling/orbit dismiss effect to zoom navigation with drag-scale sync ([10126b0](https://github.com/eds2002/react-native-screen-transitions/commit/10126b06d3e59e462b322834b66ca9c0081b1051))
* add scroll settle source remeasurement for grouped boundaries ([7868e1c](https://github.com/eds2002/react-native-screen-transitions/commit/7868e1c77e9386f38584131c2a546878e65bd895))
* bake masked view into a prop ([b557964](https://github.com/eds2002/react-native-screen-transitions/commit/b557964bc4871bc48f4d86fcad38849686ed7cba))
* **boundary:** remove mode API and prioritize source measurement on press ([0e4ade6](https://github.com/eds2002/react-native-screen-transitions/commit/0e4ade6ac65d26cffe42480a6400733c98be580f))
* **bounds:** add deterministic transition-pair resolver and migrate compute/zoom paths ([0540f57](https://github.com/eds2002/react-native-screen-transitions/commit/0540f57fc8835f0803913135e8342c67f2706d47))
* **bounds:** auto match Boundary links without route params and add conservative measurement gating ([e7491a5](https://github.com/eds2002/react-native-screen-transitions/commit/e7491a5c40b8f2c2371db924aa5dfc7bb7aee41b))
* build math helpers ([864636c](https://github.com/eds2002/react-native-screen-transitions/commit/864636c837e25fd5d7136ed6a3e805e3a69f9fa4))
* build new boundary component ([631d650](https://github.com/eds2002/react-native-screen-transitions/commit/631d6503e874c37be322a8364a78d24f49b563a4))
* build out zoom animation ([9efb98e](https://github.com/eds2002/react-native-screen-transitions/commit/9efb98eda0367e859fbd9efd63605c921b9d7c28))
* export buildBoundaryMatchKey ([de9e76e](https://github.com/eds2002/react-native-screen-transitions/commit/de9e76e7f51fc8839bb2f183e32c3edf7254e40c))
* handle new group prop ([0eb6b1a](https://github.com/eds2002/react-native-screen-transitions/commit/0eb6b1aa4fa324d33ff84342144b3ede9cb7f6ad))
* integrate masked view into the package, integrate bounds zoom transition ([eb438fc](https://github.com/eds2002/react-native-screen-transitions/commit/eb438fc4dac67292d09feff7cc6e89e2cea11851))
* integrate new role prop ([8494493](https://github.com/eds2002/react-native-screen-transitions/commit/849449372dd6dcd5ee13d6a373604cd5e9904e04))
* integrate set list example ([bbf0ae7](https://github.com/eds2002/react-native-screen-transitions/commit/bbf0ae7d904fc99b714bbbd977dc91938df5e037))
* phase 2, work in bounds options into new bounds util api ([28c132a](https://github.com/eds2002/react-native-screen-transitions/commit/28c132a4dde878374992e2c47810bf22e5f48ef6))
* provide props for user to customize velocity ([419098c](https://github.com/eds2002/react-native-screen-transitions/commit/419098c66222e86b3b4b34d40263b7deecaf94e2))
* **surface:** replace background API with surface and extract SurfaceContainer layer ([113672c](https://github.com/eds2002/react-native-screen-transitions/commit/113672cc1e4c75643276cb90a6ee4a036a82b480))
* **transitions:** skip initial-route open animation ([d8a75b9](https://github.com/eds2002/react-native-screen-transitions/commit/d8a75b9b1bf63105e47950ab97ac260dd76773f7))
* unified interpolator slot system with backgroundComponent support ([51aba84](https://github.com/eds2002/react-native-screen-transitions/commit/51aba84c3face030fe3bcf72c6282879ec3bd075))
* unset styles when previous active id changes ([4034b64](https://github.com/eds2002/react-native-screen-transitions/commit/4034b64b0ab9d3d74e5fd3fa0851f930b4e86597))


### Performance Improvements

* **boundary:** split keys context to reduce context-driven rerenders ([de98af3](https://github.com/eds2002/react-native-screen-transitions/commit/de98af31fd1f9ebeb1cc6e6ebebd38aed94ccf09))
* **bounds:** reduce mount-time overhead for boundary-heavy screens ([62e16f0](https://github.com/eds2002/react-native-screen-transitions/commit/62e16f0603ac4e86f54f3eaa6bd7b1c8b67775c8))
* **bounds:** reduce transition stutter with bounds fast-path + layout-timed destination capture ([253474b](https://github.com/eds2002/react-native-screen-transitions/commit/253474b6e0ffda37fb919d75ce72eac92c06af3f))
* memoize flags in StackCoreProvider to stabilize context ([7d10006](https://github.com/eds2002/react-native-screen-transitions/commit/7d10006392e2d86d025dd9a9fe3c6e401d7507f5))
* **shared:** hoist viewport reads and avoid inert next route gesture allocation ([40b7337](https://github.com/eds2002/react-native-screen-transitions/commit/40b7337f32825971e8db57110c80f5f70a6b75af))
* **stack:** add local routes fast path and snapshot gesture checks ([5cba5fd](https://github.com/eds2002/react-native-screen-transitions/commit/5cba5fda4ca6dbada87aec7e840b96a09302649b))

# [3.3.0](https://github.com/eds2002/react-native-screen-transitions/compare/v3.3.0-rc.2...v3.3.0-rc.3) (2026-02-14)


### Bug Fixes

* bug fix for spamming multiple screens ([dc87378](https://github.com/eds2002/react-native-screen-transitions/commit/dc87378431eeb0083df276179f213179a1db4a5c))
* **overlay:** default float overlays and sync optimistic focus state ([a4d1c5d](https://github.com/eds2002/react-native-screen-transitions/commit/a4d1c5d779e74bd93b363c6b7f087b2a28c73564))
* **snap:** prevent ancestor fallback and invalid targets in no dismiss snap flows ([5c9d7fc](https://github.com/eds2002/react-native-screen-transitions/commit/5c9d7fcf2fc6adde70da420af8e0954205011272))


### Features

* backdrop component ([d1d3f41](https://github.com/eds2002/react-native-screen-transitions/commit/d1d3f4154beb03795341f0ca8f1b074590cb0c97))


### Performance Improvements

* **overlay:** reduce JS coordination overhead during push transitions ([1e37d75](https://github.com/eds2002/react-native-screen-transitions/commit/1e37d75648225811f3c288ba19ac0b9200eb211f))



# [3.3.0-rc.3](https://github.com/eds2002/react-native-screen-transitions/compare/v3.3.0-rc.2...v3.3.0-rc.3) (2026-02-09)


### Bug Fixes

* **bounds:** fix crashing when using remeasureOnFocus prop ([91c5d3b](https://github.com/eds2002/react-native-screen-transitions/commit/91c5d3b5fafb0520572d9234fc5a2a47a2d93a4b))
* **bounds:** refresh stale source bounds on refocus and honor custom target overrides ([c6b2471](https://github.com/eds2002/react-native-screen-transitions/commit/c6b2471777017a8990f698b9df377db081d2fe79))
* options ref not updating correctly ([510b4b1](https://github.com/eds2002/react-native-screen-transitions/commit/510b4b14b0882e83b80e786025e1bc8515626ff9))
* **scroll:** compose user onScroll handler instead of calling it directly ([4b05328](https://github.com/eds2002/react-native-screen-transitions/commit/4b053283281fa060cc8290898f7016839cd5de4c))
* **snap:** make snapTo work in nested layout routes ([3c2bce8](https://github.com/eds2002/react-native-screen-transitions/commit/3c2bce8e2c7fe591904286aa5ae8007e0f8e4d05))
* **transitions:** correct optimistic focused index for rapid dismiss chains ([b0a2088](https://github.com/eds2002/react-native-screen-transitions/commit/b0a208872963ed739c6c07c1db143e6452bf9845))


### Features

* build SET examples with bounds api for native stack and blank stack ([c2fd34a](https://github.com/eds2002/react-native-screen-transitions/commit/c2fd34a39bd2ba048c4271d3f96b4be0ebfd347c))
* **snap:** add gestureSnapLocked with comprehensive bottom-sheet e2e scenarios ([f59b056](https://github.com/eds2002/react-native-screen-transitions/commit/f59b056565b6db6a8ea7afaa2e1a079976b8f8fe))


### Performance Improvements

* stabilize context memoization to prevent rerender cascades from unstable descriptors ([fbc6776](https://github.com/eds2002/react-native-screen-transitions/commit/fbc6776ba032dcd6411b934ea7da1ea09f89b456))

# Change Log

## 3.3.0-rc.3

### Patch Changes

- fix(scroll): compose user `onScroll` with the transition-aware handler to prevent dropped user handlers
- fix(transitions): correct optimistic focused index during rapid dismiss chains
- feat(snap): add `gestureSnapLocked` with expanded bottom-sheet scenarios
- fix(snap): make `snapTo` work in nested layout routes
- fix(bounds): refresh stale source bounds on refocus and honor custom target overrides
- fix: resolve stale options refs and `remeasureOnFocus` crash cases

## 3.3.0-rc.2

### Patch Changes

- fix(blank-stack): prevent background touches during transitions
- fix(component-stack): revert to regular views after regressions from native-screen integration

## 3.3.0-rc.1

### Patch Changes

- feat(component-stack): integrate `react-native-screens`-based screen management
- fix(worklets): normalize deep-link params for safer serialization

## 3.3.0-rc.0

### Patch Changes

- fix(reanimated): avoid worklet crashes by using plain route snapshots
- fix(gestures): resolve ScrollView ownership per direction (instead of per axis)

## 3.3.0-beta.4

### Patch Changes

- fix(gestures): resolve scroll/gesture race conditions and improve snap shadowing behavior
- fix(gestures): enable axis-isolated ScrollView coordination with ancestor gesture owners
- fix: register direction claims only for the current route to avoid stale ownership
- feat: add `backdropBehavior: "collapse"`
- feat: add `snapVelocityImpact` and improve snap targeting
- fix: respect ScrollView bounce state in gesture activation
- chore: tests/docs updates and dead code cleanup

## 3.3.0-beta.3

### Patch Changes

- feat: improve `snapTo` behavior
- fix: move gesture detector placement to content for better interaction handling

## 3.3.0-beta.2

### Patch Changes

- feat: add global `snapTo`
- fix(gestures): allow ScrollView scrolling while animating to max detent
- fix(gestures): animate back to fully visible when canceling mid-transition

## 3.3.0-beta.1

### Patch Changes

- feat: improve animation-settled/animating reliability
- fix: avoid `.set/.get` usage patterns that caused worklet instability
- fix: correct vertical-inverted scrollable logic with snap points
- refactor: cleanup and readability improvements across gesture handlers

## 3.3.0-beta.0

### Minor Changes

- feat: introduce snap points (`snapPoints`, `initialSnapIndex`) with bidirectional axis claims
- feat: add backdrop behavior controls (`block`, `passthrough`, `dismiss`, `collapse`)
- feat: add programmatic `snapTo` and animated `snapIndex`
- feat: extend snap sheets to horizontal gestures and sheet-specific ScrollView boundary rules
- feat: add customizable `expand`/`collapse` transition specs
- feat: integrate a unified gesture ownership mental model with e2e coverage

### Patch Changes

- fix: previous screen not animating during flight

## 3.2.1

### Patch Changes

- fix: previous screen not animating during flight
- chore: migrate package release process to `release-it`

## 3.2.0

### Minor Changes

- [#70](https://github.com/eds2002/react-native-screen-transitions/pull/70) [`1deafc5`](https://github.com/eds2002/react-native-screen-transitions/commit/1deafc5fa4293c6075776e26546a9d0151fb8be8) Thanks [@eds2002](https://github.com/eds2002)! - feat: unified stack type system, component-stack improvements

- [#70](https://github.com/eds2002/react-native-screen-transitions/pull/70) [`1deafc5`](https://github.com/eds2002/react-native-screen-transitions/commit/1deafc5fa4293c6075776e26546a9d0151fb8be8) Thanks [@eds2002](https://github.com/eds2002)! - Added useScreenState() hook and progress prop for overlays, deprecated overlayMode/screenAnimation/overlayAnimation in favor of simpler APIs, and fixed a navigation dismissal bug caused by lifecycle re-runs.

- [#70](https://github.com/eds2002/react-native-screen-transitions/pull/70) [`1deafc5`](https://github.com/eds2002/react-native-screen-transitions/commit/1deafc5fa4293c6075776e26546a9d0151fb8be8) Thanks [@eds2002](https://github.com/eds2002)! - ## v3.2.0 Release Summary

  ### New Features

  - `useScreenState()` hook - Access screen index, focused route, navigation state, and metadata
  - `useHistory()` hook - Navigation history tracking with path queries
  - Component Stack (Experimental) - Standalone navigator isolated from React Navigation, ideal for embedded flows
  - Unified stack type system - Consistent APIs across Blank Stack, Native Stack, and Component Stack
  - Overlay `progress` prop - Direct access to transition progress in overlay components
  - `entering` animation state - New interpolation value for enter transitions

  ### Improvements

  - More accurate bounds measurements
  - Better flickering handling during transitions
  - Component Stack is fully separated from root navigation tree
  - Touch-through events fixed in Component Stack

  ### Breaking Changes

  - Deprecated `overlayMode` - Overlays are now float by default. For screen overlays, use a position absolute view instead.
  - `screenAnimation` / `overlayAnimation` replaced by `screenStyleInterpolator`

  ### Fixes

  - Navigation dismissal bug caused by lifecycle re-runs
  - Isolated navigation state bug in Component Stack
  - Removed dead code and unused types

### Patch Changes

- [#70](https://github.com/eds2002/react-native-screen-transitions/pull/70) [`1deafc5`](https://github.com/eds2002/react-native-screen-transitions/commit/1deafc5fa4293c6075776e26546a9d0151fb8be8) Thanks [@eds2002](https://github.com/eds2002)! - Fix touch through events in new component-stack, fix isolated navigation bug

- [#70](https://github.com/eds2002/react-native-screen-transitions/pull/70) [`1deafc5`](https://github.com/eds2002/react-native-screen-transitions/commit/1deafc5fa4293c6075776e26546a9d0151fb8be8) Thanks [@eds2002](https://github.com/eds2002)! - More accurate bound measurements, component-stack is seperated from the root navigation tree. Handle flickering better

## 3.2.0-beta.3

### Minor Changes

- Added useScreenState() hook and progress prop for overlays, deprecated overlayMode/screenAnimation/overlayAnimation in favor of simpler APIs, and fixed a navigation dismissal bug caused by lifecycle re-runs.

## 3.2.0-beta.2

### Patch Changes

- Fix touch through events in new component-stack, fix isolated navigation bug

## 3.2.0-beta.1

### Patch Changes

- More accurate bound measurements, component-stack is seperated from the root navigation tree. Handle flickering better

## 3.2.0-beta.0

### Minor Changes

- feat: unified stack type system, component-stack improvements

## 3.1.0

### Minor Changes

- [#62](https://github.com/eds2002/react-native-screen-transitions/pull/62) [`6292b27`](https://github.com/eds2002/react-native-screen-transitions/commit/6292b274cd8c2d61f359f3938659cbfbae8ad73c) Thanks [@eds2002](https://github.com/eds2002)! - Integrate new helper prop `inactive`, useful for knowing the meta of unfocused screens.

## 3.0.0

### Major Changes

- [`04cafc1`](https://github.com/eds2002/react-native-screen-transitions/commit/04cafc1c1de5f7616d3179c3c607fcbc47bcb5d7) - Introduce the v3 beta with the new blank stack navigator, overlay channel, and the bespoke transition workflow for building custom flows.

### Minor Changes

- [`5ae76bb`](https://github.com/eds2002/react-native-screen-transitions/commit/5ae76bb9bb3a60087e7fadc06c66c998acad0bae) - Integrate helper hook for viewing blank stack state

- [`9730dc9`](https://github.com/eds2002/react-native-screen-transitions/commit/9730dc9b2d01e8622fbe31ef607967083d7ac201) - Integrate focusedRoute for overlays

- [`daab39b`](https://github.com/eds2002/react-native-screen-transitions/commit/daab39b26209cbc613374a4c80b5930099de835d) - refactors & remove useOverlayAnimation

- [`4b5ff23`](https://github.com/eds2002/react-native-screen-transitions/commit/4b5ff23c0180f08452bcaa3a33b1b86530405e85) - Introduce new bounds architecture

- [`6fcc868`](https://github.com/eds2002/react-native-screen-transitions/commit/6fcc8689bfa8eb8275d0ecbddd26d358482eec57) - Export useOverlayAnimation

- [`75fac81`](https://github.com/eds2002/react-native-screen-transitions/commit/75fac8139cca72d84c44b95c0bb1cec79d64b2e7) - Meta options for overlays

- [`a312b70`](https://github.com/eds2002/react-native-screen-transitions/commit/a312b70129e8e895d4d85f02772409266020e230) - Adds support for non pressable bounds

- [`67bfbe3`](https://github.com/eds2002/react-native-screen-transitions/commit/67bfbe34d3fa4750a0864e52b4db5b3a4d46bb20) - Performance optimizations & new type exports

### Patch Changes

- [`eb5fec4`](https://github.com/eds2002/react-native-screen-transitions/commit/eb5fec4be082029373d641e85a9888a6b29220dd) - Release another beta patch of `react-native-screen-transitions`.

- [`b5c8bc0`](https://github.com/eds2002/react-native-screen-transitions/commit/b5c8bc0f73cfa2223750402b311b6b83da63c018) - Potential memory leak

- [`7608071`](https://github.com/eds2002/react-native-screen-transitions/commit/76080716b7ec13eddf94b6f55a6c0e75120427f0) - Fix memory leak

- [`f389166`](https://github.com/eds2002/react-native-screen-transitions/commit/f3891668a1ec5f42d50931eaedaa356a9f53f637) - Fix entire stack rerendering due to new gestures logic

- [`b5686ed`](https://github.com/eds2002/react-native-screen-transitions/commit/b5686ede836020aaa5479717c2ee2943fc3849e7) - Memory leak 2

- [`873f360`](https://github.com/eds2002/react-native-screen-transitions/commit/873f3605d4ca08377366656196769471259fccf5) - New stackProgress, avoid setting gestures to non gesture defined screens, set 'none' to pointer events in already closing screens

- [`e9fbace`](https://github.com/eds2002/react-native-screen-transitions/commit/e9fbace61e38a4e496cd1fe0a3c618d5620b8782) - Better handling of measure on blur

- [`fe74315`](https://github.com/eds2002/react-native-screen-transitions/commit/fe74315a9fc7c63cf32939470262d8a966b7a2e3) - Fixes gesture race condition

## 3.0.0-rc.5

### Patch Changes

- Fix entire stack rerendering due to new gestures logic

## 3.0.0-rc.4

### Patch Changes

- New stackProgress, avoid setting gestures to non gesture defined screens, set 'none' to pointer events in already closing screens

## 3.0.0-rc.3

### Minor Changes

- refactors & remove useOverlayAnimation

## 3.0.0-rc.1

### Patch Changes

- Better handling of measure on blur

## 3.0.0-beta.11

### Minor Changes

- Introduce new bounds architecture

## 3.0.0-beta.10

### Minor Changes

- Integrate helper hook for viewing blank stack state

## 3.0.0-beta.9

### Minor Changes

- Export useOverlayAnimation

## 3.0.0-beta.8

### Patch Changes

- Potential memory leak

## 3.0.0-beta.7

### Patch Changes

- Memory leak 2

## 3.0.0-beta.6

### Patch Changes

- Fix memory leak

## 3.0.0-beta.5

### Patch Changes

- Fixes gesture race condition

## 3.0.0-beta.4

### Minor Changes

- Integrate focusedRoute for overlays

## 3.0.0-beta.3

### Minor Changes

- [`67bfbe3`](https://github.com/eds2002/react-native-screen-transitions/commit/67bfbe34d3fa4750a0864e52b4db5b3a4d46bb20) - Performance optimizations & new type exports

## 3.0.0-beta.2

### Minor Changes

- [`a312b70`](https://github.com/eds2002/react-native-screen-transitions/commit/a312b70129e8e895d4d85f02772409266020e230) - Adds support for non pressable bounds

## 3.0.0-beta.1

### Patch Changes

- Release another beta patch of `react-native-screen-transitions`.

## 3.0.0-beta.0

### Major Changes

- Introduce the v3 beta with the new blank stack navigator, overlay channel, and the bespoke transition workflow for building custom flows.

## 2.4.2

### Patch Changes

- [#49](https://github.com/eds2002/react-native-screen-transitions/pull/49) [`561d2e2`](https://github.com/eds2002/react-native-screen-transitions/commit/561d2e2ebb66bfe27db253f8c97349dea304107f) Thanks [@eds2002](https://github.com/eds2002)! - Fix shared element transitions crashing in production

## 2.4.1

### Patch Changes

- [#46](https://github.com/eds2002/react-native-screen-transitions/pull/46) [`dd54bb7`](https://github.com/eds2002/react-native-screen-transitions/commit/dd54bb78734cceba38d6de62a777c8e20845825f) Thanks [@eds2002](https://github.com/eds2002)! - Move NEAR_ZERO_THRESHOLD to the function body instead, also remove it as a prop required prop since it's not needed.

## 2.4.0

### Minor Changes

- [#42](https://github.com/eds2002/react-native-screen-transitions/pull/42) [`bc8f46d`](https://github.com/eds2002/react-native-screen-transitions/commit/bc8f46d940aa3763b105b93133041e632cfcee45) Thanks [@eds2002](https://github.com/eds2002)! - Integrate new direction value for screen interpolation props, as well as introduce some improvements in the apple music preset to closely match.

## 2.3.4

### Patch Changes

- [#40](https://github.com/eds2002/react-native-screen-transitions/pull/40) [`aea9f15`](https://github.com/eds2002/react-native-screen-transitions/commit/aea9f1557797fbee18ed190fd4d15bfed6747cf9) Thanks [@eds2002](https://github.com/eds2002)! - Prevent bounds from measuring again when the screen is blurred, prevent running the beforeRemove listener on screens that don't have transitions enabled.

- [#40](https://github.com/eds2002/react-native-screen-transitions/pull/40) [`aea9f15`](https://github.com/eds2002/react-native-screen-transitions/commit/aea9f1557797fbee18ed190fd4d15bfed6747cf9) Thanks [@eds2002](https://github.com/eds2002)! - Introduce fixes to support new reanimated v4

## 2.3.3

### Patch Changes

- [#38](https://github.com/eds2002/react-native-screen-transitions/pull/38) [`c3647ce`](https://github.com/eds2002/react-native-screen-transitions/commit/c3647ce5af18575caf0722402c6792121aa1ef2f) Thanks [@eds2002](https://github.com/eds2002)! - Introduce fixes to support new reanimated v4

## 2.3.2

### Patch Changes

- [#33](https://github.com/eds2002/react-native-screen-transitions/pull/33) [`41b8df6`](https://github.com/eds2002/react-native-screen-transitions/commit/41b8df6269b5025bef0ae9f0fbb87a2d89d0f653) Thanks [@eds2002](https://github.com/eds2002)! - Fixes: onPress shouldn't run when measuremenets failed (sharedBoundTag only), nested sharedBoundTags should be automatically measured alongside the parent, transitioning to non transition enabled screens should not affect the previous screen

## 2.3.1

### Patch Changes

- [#31](https://github.com/eds2002/react-native-screen-transitions/pull/31) [`2c4e476`](https://github.com/eds2002/react-native-screen-transitions/commit/2c4e4767de5ae6203121db446a06ca1ca5e1556a) Thanks [@eds2002](https://github.com/eds2002)! - Fix screens that don't have transitions enabled affecting previous screens

## 2.3.0

### Minor Changes

- [#28](https://github.com/eds2002/react-native-screen-transitions/pull/28) [`86995d0`](https://github.com/eds2002/react-native-screen-transitions/commit/86995d034ece0e8e475cb9b6c40ce6eb753f5700) Thanks [@eds2002](https://github.com/eds2002)! - Expose new helper variables for screenStyleInterpolator:active, isActiiveTransitioning, isDismissing.

## 2.2.1

### Patch Changes

- [#25](https://github.com/eds2002/react-native-screen-transitions/pull/25) [`9dba7df`](https://github.com/eds2002/react-native-screen-transitions/commit/9dba7dfe1a1e6e2f4c12082894be22120e54d392) Thanks [@eds2002](https://github.com/eds2002)! - Fixes: Flickering, activeBoundId being replaced when using measureOnLayout, adds tests

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.2.0](https://github.com/eds2002/react-native-screen-transitions/compare/react-native-screen-transitions@2.0.6...react-native-screen-transitions@2.2.0) (2025-09-03)

### Features

- integrate measureOnLayout for components that don't need to be pressed to measure. ([#23](https://github.com/eds2002/react-native-screen-transitions/issues/23)) ([22f3470](https://github.com/eds2002/react-native-screen-transitions/commit/22f3470688dc21a836dc80af4f5d00df42ec332b))
- **shared,bounds,gestures:** shared presets (IG/Apple Music), bounds(options) API, gestureActivationArea ([#21](https://github.com/eds2002/react-native-screen-transitions/issues/21)) ([e72d51b](https://github.com/eds2002/react-native-screen-transitions/commit/e72d51b3ae8c950534752ea51acd2b365631f00d))

# [2.1.0](https://github.com/eds2002/react-native-screen-transitions/compare/react-native-screen-transitions@2.0.6...react-native-screen-transitions@2.1.0) (2025-09-03)

### Features

- **shared,bounds,gestures:** shared presets (IG/Apple Music), bounds(options) API, gestureActivationArea ([#21](https://github.com/eds2002/react-native-screen-transitions/issues/21)) ([e72d51b](https://github.com/eds2002/react-native-screen-transitions/commit/e72d51b3ae8c950534752ea51acd2b365631f00d))

## [2.0.6](https://github.com/eds2002/react-native-screen-transitions/compare/react-native-screen-transitions@2.0.5...react-native-screen-transitions@2.0.6) (2025-08-21)

### Bug Fixes

- https://github.com/eds2002/react-native-screen-transitions/issues/7 ([#14](https://github.com/eds2002/react-native-screen-transitions/issues/14)) ([2b6aaa4](https://github.com/eds2002/react-native-screen-transitions/commit/2b6aaa4ae888c8e2bed6337127ebb7cb09793fc5))

## [2.0.5](https://github.com/eds2002/react-native-screen-transitions/compare/react-native-screen-transitions@2.0.3...react-native-screen-transitions@2.0.5) (2025-08-20)

### Bug Fixes

- correct import paths and whitespace issues ([#8](https://github.com/eds2002/react-native-screen-transitions/issues/8)) ([5a3a57e](https://github.com/eds2002/react-native-screen-transitions/commit/5a3a57eb983df3195e648f0a06129ee5743e49f3))

## [2.0.4](https://github.com/eds2002/react-native-screen-transitions/compare/react-native-screen-transitions@2.0.3...react-native-screen-transitions@2.0.4) (2025-08-20)

### Bug Fixes

- correct import paths and whitespace issues ([#8](https://github.com/eds2002/react-native-screen-transitions/issues/8)) ([5a3a57e](https://github.com/eds2002/react-native-screen-transitions/commit/5a3a57eb983df3195e648f0a06129ee5743e49f3))

## [2.0.3](https://github.com/eds2002/react-native-screen-transitions/compare/react-native-screen-transitions@2.0.2...react-native-screen-transitions@2.0.3) (2025-08-13)

**Note:** Version bump only for package react-native-screen-transitions

## [2.0.2](https://github.com/eds2002/react-native-screen-transitions/compare/react-native-screen-transitions@2.0.1...react-native-screen-transitions@2.0.2) (2025-08-12)

**Note:** Version bump only for package react-native-screen-transitions

## [2.0.1](https://github.com/eds2002/react-native-screen-transitions/compare/react-native-screen-transitions@2.0.0...react-native-screen-transitions@2.0.1) (2025-08-12)

### Bug Fixes

- **package:** correct main/module/types paths for npm build ([015d20d](https://github.com/eds2002/react-native-screen-transitions/commit/015d20d91a2f95efc377c764a2b1d9be12610b6f))

# 2.0.0 (2025-08-11)

### Bug Fixes

- Bug fix in create scrollable causing duplication of screen animations ([a2448e7](https://github.com/eds2002/react-native-screen-transitions/commit/a2448e722536623811c2d120f2c72bb3767ff474))
- Fix lingering transparent modals in nested stacks ([c365e37](https://github.com/eds2002/react-native-screen-transitions/commit/c365e37893aab00289d861a5ae0fc1195e621da7))
- Fix presets not defining timing config ( default timing config is removed ) ([627a765](https://github.com/eds2002/react-native-screen-transitions/commit/627a76530724c5e43fc7b6c92e84ee4f16aefee9))
- Fix Scrollables inside transitional views that have matching gestures. ([2a3e6fc](https://github.com/eds2002/react-native-screen-transitions/commit/2a3e6fc63b663e6d38daede4f4ee2322e1db7f88))
- prevent gesture reactivation during screen dismiss animation + examples + refactors ([2cdff32](https://github.com/eds2002/react-native-screen-transitions/commit/2cdff32ec6f0638443b1f0e553d1c7c010093bae))
- prevent on layout measures from running multiple times causing inaccurate measurements ([20d53a5](https://github.com/eds2002/react-native-screen-transitions/commit/20d53a5fcfb2d4b2827e787169e26642837476eb))
- Readd manual activation for gesture to work ([f8f67a2](https://github.com/eds2002/react-native-screen-transitions/commit/f8f67a25ab0e7bd2c95121550cdfffac6935120f))
- Remeasure on press, and check if applicable to measure onLayout. Allow users to set the x and y for shared bounds. Create new bound builder to align the bound screen with the previous bound. ([90a77dd](https://github.com/eds2002/react-native-screen-transitions/commit/90a77dddc4a780a98714c87d63556ecb7c3338f1))
- respect gesture direction in progress mapping. ([3ef296f](https://github.com/eds2002/react-native-screen-transitions/commit/3ef296f252e63196b77a14a28c33fce3625f2903))
- Set onlayout for scrollables, this fixes the issue where you have to scroll multiple times when setting vertical-inverted. ([45029c2](https://github.com/eds2002/react-native-screen-transitions/commit/45029c270c55c46f44179ecdeab307c8d5fd4a6a))

### Features

- Add new store for bounds ( yet to actually include the measuring logic ) ([38195aa](https://github.com/eds2002/react-native-screen-transitions/commit/38195aaa674fbae28e008c6096317d931c74d862))
- Add new utils, prepare to convert most stores to utilzie the ui thread. ([4e9e160](https://github.com/eds2002/react-native-screen-transitions/commit/4e9e16069a1a2f3ca6ffce1c74deafcc7aaaf858))
- create helpful bound utilities to simplify shared bound animations ([276f5dc](https://github.com/eds2002/react-native-screen-transitions/commit/276f5dc33536fb6e74b95b3800698028637d0ab4))
- Expand on existing example, allow users to get bounds if needed, pass route metadata for more customization via useScreenAnimation hook ([01326a0](https://github.com/eds2002/react-native-screen-transitions/commit/01326a09e97c44719199cd919fcb804122546dd9))
- Integrate ability to disable gesture driving progress via gestureDrivesProgress, ([df8d7be](https://github.com/eds2002/react-native-screen-transitions/commit/df8d7be0408b99d52db050fdd2f9c7ac39030038))
- integrate working example of shared bounds. ([5ef22ee](https://github.com/eds2002/react-native-screen-transitions/commit/5ef22eeb577ca56f480ab15ac58ee4e3c66d3dba))
- new navigator ([4f3bb3c](https://github.com/eds2002/react-native-screen-transitions/commit/4f3bb3ce8b9bef2193a602154e59a54ec33c497f))
- Start ability to decide of gesture should drive the progress. ([5179038](https://github.com/eds2002/react-native-screen-transitions/commit/5179038ec348efc8a20a979e97a01413ac39349f))
