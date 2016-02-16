/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var React = require('React');
var Site = require('Site');
var center = require('center');

var featured = [
  {
    name: 'Facebook Groups',
    icon: 'http://is4.mzstatic.com/image/pf/us/r30/Purple69/v4/57/f8/4c/57f84c0c-793d-5f9a-95ee-c212d0369e37/mzl.ugjwfhzx.png',
    link: 'https://itunes.apple.com/us/app/facebook-groups/id931735837?mt=8',
    author: 'Facebook',
  },
  {
    name: 'Facebook Ads Manager',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple5/v4/9e/16/86/9e1686ef-cc55-805a-c977-538ddb5e6832/mzl.gqbhwitj.png',
    linkAppStore: 'https://itunes.apple.com/us/app/facebook-ads-manager/id964397083?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.facebook.adsmanager',
    author: 'Facebook',
    blogs: [
      "https://code.facebook.com/posts/1014532261909640/react-native-bringing-modern-web-techniques-to-mobile/",
      "https://code.facebook.com/posts/1189117404435352/react-native-for-android-how-we-built-the-first-cross-platform-react-native-app/",
      "https://code.facebook.com/posts/435862739941212/making-react-native-apps-accessible/",
    ],
  },
  {
    name: 'AIGA Design Conference 2015',
    icon: 'http://a5.mzstatic.com/us/r30/Purple69/v4/b0/4b/29/b04b2939-88d2-f61f-dec9-24fae083d8b3/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/aiga-design-conference-2015/id1038145272?ls=1&mt=8',
    author: 'W&Co',
  },
  {
    name: 'Discord',
    icon: 'http://a5.mzstatic.com/us/r30/Purple5/v4/c1/2f/4c/c12f4cba-1d9a-f6bf-2240-04085d3470ec/icon175x175.jpeg',
    link:  'https://itunes.apple.com/us/app/discord-chat-for-gamers/id985746746?mt=8',
    author: 'Hammer & Chisel',
  },
  {
    name: 'Discovery VR',
    icon: 'http://a2.mzstatic.com/us/r30/Purple6/v4/d1/d5/f4/d1d5f437-9f6b-b5aa-5fe7-47bd19f934bf/icon175x175.png',
    link:  'https://itunes.apple.com/us/app/discovery-vr/id1030815031?mt=8',
    author: 'Discovery Communications',
    blog: [
      "https://medium.com/ios-os-x-development/an-ios-developer-on-react-native-1f24786c29f0",
    ],
  },
  {
    name: 'Exponent',
    icon: 'http://a4.mzstatic.com/us/r30/Purple2/v4/3a/d3/c9/3ad3c96c-5e14-f988-4bdd-0fdc95efd140/icon175x175.png',
    link:  'http://exponentjs.com/',
    author: 'Exponent',
  },
  {
    name: 'Lrn',
    icon: 'http://is4.mzstatic.com/image/pf/us/r30/Purple1/v4/41/a9/e9/41a9e9b6-7801-aef7-2400-2eca14923321/mzl.adyswxad.png',
    link: 'https://itunes.apple.com/us/app/lrn-learn-to-code-at-your/id1019622677',
    author: 'Lrn Labs, Inc',
  },
  {
    name: 'Movie Trailers by MovieLaLa',
    icon: 'https://lh3.googleusercontent.com/16aug4m_6tvJB7QZden9w1SOMqpZgNp7rHqDhltZNvofw1a4V_ojGGXUMPGiK0dDCqzL=w300',
    linkAppStore: 'https://itunes.apple.com/us/app/movie-trailers-by-movielala/id1001416601?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.movielala.trailers',
    author: 'MovieLaLa'
  },
  {
    name: 'Myntra',
    icon: 'http://a5.mzstatic.com/us/r30/Purple6/v4/9c/78/df/9c78dfa6-0061-1af2-5026-3e1d5a073c94/icon350x350.png',
    link: 'https://itunes.apple.com/in/app/myntra-fashion-shopping-app/id907394059',
    author: 'Myntra Designs',
  },
  {
    name: 'React Native Playground',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple1/v4/20/ec/8e/20ec8eb8-9e12-6686-cd16-7ac9e3ef1d52/mzl.ngvuoybx.png',
    linkAppStore: 'https://itunes.apple.com/us/app/react-native-playground/id1002032944?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=org.rnplay.playground',
    author: 'Joshua Sierles',
  },
  {
    name: 'Running',
    icon: 'http://a1.mzstatic.com/us/r30/Purple3/v4/33/eb/4f/33eb4f73-c7e3-8659-9285-f758e403485b/icon175x175.jpeg',
    link: 'https://gyrosco.pe/running/',
    author: 'Gyroscope Innovations',
    blogs: [
      'https://blog.gyrosco.pe/the-making-of-gyroscope-running-a4ad10acc0d0',
    ],
  },
  {
    name: 'Squad',
    icon: 'http://a4.mzstatic.com/us/r30/Purple69/v4/e8/5b/3f/e85b3f52-72f3-f427-a32e-a73efe2e9682/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/squad-snaps-for-groups-friends/id1043626975?mt=8',
    author: 'Tackk Inc.',
  },
  {
    name: 'Start - medication manager for depression',
    icon: 'http://a1.mzstatic.com/us/r30/Purple49/v4/de/9b/6f/de9b6fe8-84ea-7a12-ba2c-0a6d6c7b10b0/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/start-medication-manager-for/id1012099928?mt=8',
    author: 'Iodine Inc.',
  },
  {
    name: 'Townske',
    icon: 'http://a3.mzstatic.com/us/r30/Purple69/v4/8b/42/20/8b4220af-5165-91fd-0f05-014332df73ef/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/townske-stunning-city-guides/id1018136179?ls=1&mt=8',
    author: 'Townske PTY LTD',
  },
  {
    name: 'Tucci',
    icon: 'http://a3.mzstatic.com/us/r30/Purple3/v4/c0/0c/95/c00c95ce-4cc5-e516-db77-5c5164b89189/icon175x175.jpeg',
    link: 'https://itunes.apple.com/app/apple-store/id1039661754?mt=8',
    author: 'Clay Allsopp & Tiffany Young',
    blogs: [
      'https://medium.com/@clayallsopp/making-tucci-what-is-it-and-why-eaa2bf94c1df#.lmm3dmkaf',
      'https://medium.com/@clayallsopp/making-tucci-the-technical-details-cc7aded6c75f#.wf72nq372',
    ],
  },
];

var apps = [
  {
    name: 'Accio',
    icon: 'http://a3.mzstatic.com/us/r30/Purple3/v4/03/a1/5b/03a15b9f-04d7-a70a-620a-9c9850a859aa/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/accio-on-demand-delivery/id1047060673?mt=8',
    author: 'Accio Delivery Inc.',
  },
  {
    name: 'Beetroot',
    icon: 'http://is1.mzstatic.com/image/pf/us/r30/Purple5/v4/66/fd/dd/66fddd70-f848-4fc5-43ee-4d52197ccab8/pr_source.png',
    link: 'https://itunes.apple.com/us/app/beetroot/id1016159001?ls=1&mt=8',
    author: 'Alex Duckmanton',
  },
  {
    name: 'Bionic eStore',
    icon: 'http://a5.mzstatic.com/us/r30/Purple7/v4/c1/9a/3f/c19a3f82-ecc3-d60b-f983-04acc203705f/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/bionic-estore/id994537615?mt=8',
    author: 'Digidemon',
  },
  {
    name: 'CANDDi',
    icon: 'http://a5.mzstatic.com/eu/r30/Purple7/v4/c4/e4/85/c4e48546-7127-a133-29f2-3e2e1aa0f9af/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/gb/app/canddi/id1018168131?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.canddi',
    author: 'CANDDi LTD.',
  },
  {
    name: 'CBS Sports Franchise Football',
    icon: 'http://a2.mzstatic.com/us/r30/Purple69/v4/7b/0c/a0/7b0ca007-885a-7cfc-9fa2-2ec4394c2ecc/icon175x175.png',
    link: 'https://play.google.com/store/apps/details?id=com.cbssports.fantasy.franchisefootball2015',
    author: 'CBS Sports',
  },
  {
    name: 'Choke - Rap Battle With Friends',
    icon: 'http://a3.mzstatic.com/us/r30/Purple49/v4/3e/83/85/3e8385d8-140f-da38-a100-1393cef3e816/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/choke-rap-battle-with-friends/id1077937445?ls=1&mt=8',
    author: 'Henry Kirkness',
  },
  {
    name: 'Codementor - Live 1:1 Expert Developer Help',
    icon: 'http://a1.mzstatic.com/us/r30/Purple3/v4/db/cf/35/dbcf3523-bac7-0f54-c6a8-a80bf4f43c38/icon175x175.jpeg',
    link: 'https://www.codementor.io/downloads',
    author: 'Codementor',
  },
  {
    name: 'Company name search',
    icon: 'http://a4.mzstatic.com/us/r30/Purple69/v4/fd/47/53/fd47537c-5861-e208-d1d1-1e26b5e45a36/icon350x350.jpeg',
    link: 'https://itunes.apple.com/us/app/company-name-search/id1043824076',
    author: 'The Formations Factory Ltd',
    blogs: [
      'https://medium.com/formations-factory/creating-company-name-search-app-with-react-native-36a049b0848d',
    ],
  },
  {
    name: 'DareU',
    icon: 'http://a3.mzstatic.com/us/r30/Purple6/v4/10/fb/6a/10fb6a50-57c8-061a-d865-503777bf7f00/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/dareu-dare-your-friends-dare/id1046434563?mt=8',
    author: 'Rishabh Mehan',
  },
  {
    name: 'DockMan',
    icon: 'http://a1.mzstatic.com/us/r30/Purple49/v4/91/b5/75/91b57552-d9bc-d8bc-10a1-617de920aaa6/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/app/dockman/id1061469696',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.s21g.DockMan',
    blogs: [
      'http://www.s21g.com/DockMan.html',
    ],
    author: 'Genki Takiuchi (s21g Inc.)',
  },
  {
    name: 'Fixt',
    icon: 'http://a5.mzstatic.com/us/r30/Purple69/v4/46/bc/66/46bc66a2-7775-4d24-235d-e1fe28d55d7f/icon175x175.png',
    linkAppStore:  'https://itunes.apple.com/us/app/dropbot-phone-replacement/id1000855694?mt=8',
    linkPlayStore:  'https://play.google.com/store/apps/details?id=co.fixt',
    author: 'Fixt',
  },
  {
    name: 'Due',
    icon: 'http://a1.mzstatic.com/us/r30/Purple69/v4/a2/41/5d/a2415d5f-407a-c565-ffb4-4f27f23d8ac2/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/due-countdown-reminders-for/id1050909468?mt=8',
    author: 'Dotan Nahum',
  },
  {
    name: 'Eat or Not',
    icon: 'http://a3.mzstatic.com/us/r30/Purple5/v4/51/be/34/51be3462-b015-ebf2-11c5-69165b37fadc/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/eat-or-not/id1054565697?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.eon',
    author: 'Sharath Prabhal',
  },
  {
    name: 'Fan of it',
    icon: 'http://a4.mzstatic.com/us/r30/Purple3/v4/c9/3f/e8/c93fe8fb-9332-e744-f04a-0f4f78e42aa8/icon350x350.png',
    link: 'https://itunes.apple.com/za/app/fan-of-it/id1017025530?mt=8',
    author: 'Fan of it (Pty) Ltd',
  },
  {
    name: 'FastPaper',
    icon: 'http://a2.mzstatic.com/us/r30/Purple5/v4/72/b4/d8/72b4d866-90d2-3aad-d1dc-0315f2d9d045/icon350x350.jpeg',
    link: 'https://itunes.apple.com/us/app/fast-paper/id1001174614',
    author: 'Liubomyr Mykhalchenko (@liubko)',
  },
  {
    name: 'Foodstand',
    icon: 'http://a3.mzstatic.com/us/r30/Purple69/v4/33/c1/3b/33c13b88-8ec2-23c1-56bb-712ad9938290/icon350x350.jpeg',
    link: 'https://www.thefoodstand.com/download',
    author: 'Foodstand, Inc.',
  },
  {
    name: 'Go Fire',
    icon: 'http://a2.mzstatic.com/us/r30/Purple5/v4/42/50/5a/42505a8d-3c7a-e49a-16e3-422315f24cf1/icon350x350.png',
    link: 'https://itunes.apple.com/us/app/gou-huo/id1001476888?ls=1&mt=8',
    author: 'beijing qingfengyun Technology Co., Ltd.',
  },
  {
    name: 'Harmonizome',
    icon: 'http://is1.mzstatic.com/image/thumb/Purple6/v4/18/a9/bc/18a9bcde-d2d9-7574-2664-e82fff7b7208/pr_source.png/350x350-75.png',
    link: 'https://itunes.apple.com/us/app/harmonizome/id1046990905?mt=8',
    author: 'Michael McDermott (@_mgmcdermott)',
  },
  {
    name: 'Hashley',
    icon: 'http://a2.mzstatic.com/us/r30/Purple4/v4/5f/19/fc/5f19fc13-e7af-cd6b-6749-cedabdaeee7d/icon350x350.png',
    link: 'https://itunes.apple.com/us/app/hashtag-by-hashley-ironic/id1022724462?mt=8',
    author: 'Elephant, LLC',
  },
  {
    name: 'Hey, Neighbor!',
    icon: 'https://raw.githubusercontent.com/scrollback/io.scrollback.neighborhoods/master/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
    link: 'https://play.google.com/store/apps/details?id=io.scrollback.neighborhoods',
    author: 'Scrollback',
  },
  {
    name: 'Honest Reviews',
    icon: 'http://honestreviews.techulus.com/icon.png',
    link: 'https://play.google.com/store/apps/details?id=com.techulus.honestreviews&hl=en',
    author: 'Arjun Komath',
  },
  {
    name: 'HSK Level 1 Chinese Flashcards',
    icon: 'http://is2.mzstatic.com/image/pf/us/r30/Purple1/v4/b2/4f/3a/b24f3ae3-2597-cc70-1040-731b425a5904/mzl.amxdcktl.jpg',
    link: 'https://itunes.apple.com/us/app/hsk-level-1-chinese-flashcards/id936639994',
    author: 'HS Schaaf',
  },
  {
    name: 'Hubhopper',
    icon: 'http://hubhopper.com/images/h_logo.jpg',
    link: 'https://play.google.com/store/apps/details?id=com.hubhopper',
    author: 'Soch Technologies',
  },
  {
    name: 'Jukebox',
    icon: 'https://s3.amazonaws.com/theartistunion-production/Jukebox-logo.png',
    link: 'https://itunes.apple.com/us/app/jukebox-offline-music-player/id1072583255?ls=1&mt=8',
    author: 'The Beat Drop Inc'
  },
  {
    name: 'Kakapo',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple3/v4/12/ab/2a/12ab2a01-3a3c-9482-b8df-ab38ad281165/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/gb/app/kakapo/id1046673139?ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.kakaponative',
    author: 'Daniel Levitt',
  },
  {
    name: 'Koza Gujarati Dictionary',
    icon: 'http://a1.mzstatic.com/us/r30/Purple69/v4/77/95/83/77958377-05ae-4754-684a-3c9dbb67b517/icon175x175.jpeg',
    link: 'https://itunes.apple.com/in/app/koza-english-to-gujarati-dictionary/id982752928?mt=8',
    author: 'KozaApps',
  },
  {
    name: 'Leanpub',
    icon: 'http://a2.mzstatic.com/us/r30/Purple6/v4/9f/4a/6f/9f4a6f8c-8951-ed89-4083-74ace23df9ef/icon350x350.jpeg',
    link: 'https://itunes.apple.com/us/app/leanpub/id913517110?ls=1&mt=8',
    author: 'Leanpub',
  },
  {
    name: 'LoadDocs',
    icon: 'http://a2.mzstatic.com/us/r30/Purple3/v4/b5/ca/78/b5ca78ca-392d-6874-48bf-762293482d42/icon350x350.jpeg',
    link: 'https://itunes.apple.com/us/app/loaddocs/id1041596066',
    author: 'LoadDocs',
  },
  {
    name: 'Lugg – Your On-Demand Mover',
    icon: 'http://lh3.googleusercontent.com/EV9z7kRRME2KPMBRNHnje7bBNEl_Why2CFq-MfKzBC88uSFJTYr1HO3-nPt-JuVJwKFb=w300-rw',
    link: 'https://play.google.com/store/apps/details?id=com.lugg',
    author: 'Lugg',
  },
  {
    name: 'Lumpen Radio',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple1/v4/46/43/00/464300b1-fae3-9640-d4a2-0eb050ea3ff2/mzl.xjjawige.png',
    link: 'https://itunes.apple.com/us/app/lumpen-radio/id1002193127?mt=8',
    author: 'Joshua Habdas',
  },
  {
    name: 'Makerist Mediathek',
    icon: 'http://a5.mzstatic.com/eu/r30/Purple3/v4/fa/5f/4c/fa5f4ce8-5aaa-5a4b-ddcc-a0c6f681d08a/icon175x175.png',
    link: 'https://itunes.apple.com/de/app/makerist-mediathek/id1019504544',
    author: 'Railslove',
  },
  {
    name: 'MaxReward - Android',
    icon: 'https://lh3.googleusercontent.com/yynCUCdEnyW6T96xCto8KzWQr4Yeiy0M6c2p8auYMIyFgAZVBsjf4JCEX7QkPijhBg=w175-rw',
    linkAppStore: 'https://itunes.apple.com/us/app/maxreward/id1050479192?ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.bitstrek.maxreward&hl=en',
    author: 'Neil Ma',
  },
  {
    name: 'MinTrain',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple5/v4/51/51/68/51516875-1323-3100-31a8-cd1853d9a2c0/mzl.gozwmstp.png',
    link: 'https://itunes.apple.com/us/app/mintrain/id1015739031?mt=8',
    author: 'Peter Cottle',
  },
  {
    name: 'Mobabuild',
    icon: 'http://mobabuild.co/images/applogo.png',
    link: 'http://mobabuild.co',
    author: 'Sercan Demircan ( @sercanov )',
  },
  {
    name: 'MockingBot',
    icon: 'https://s3.cn-north-1.amazonaws.com.cn/modao/downloads/images/MockingBot175.png',
    link: 'https://itunes.apple.com/cn/app/mockingbot/id1050565468?l=en&mt=8',
    author: 'YuanYi Zhang (@mockingbot)',
  },
  {
    name: 'MoneyLion',
    icon: 'http://a5.mzstatic.com/us/r30/Purple69/v4/d7/9d/ad/d79daddc-8d67-8a6c-61e2-950425946dd2/icon350x350.jpeg',
    link: 'https://itunes.apple.com/us/app/moneylion/id1064677082?mt=8',
    author: 'MoneyLion LLC',
  },
  {
    name: 'Mr. Dapper',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple4/v4/e8/3f/7c/e83f7cb3-2602-f8e8-de9a-ce0a775a4a14/mzl.hmdjhfai.png',
    link: 'https://itunes.apple.com/us/app/mr.-dapper-men-fashion-app/id989735184?ls=1&mt=8',
    author: 'wei ping woon',
  },
  {
    name: 'MyPED',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple69/v4/88/1f/fb/881ffb3b-7986-d427-7fcf-eb5920a883af/icon175x175.png',
    link: 'https://itunes.apple.com/it/app/myped/id1064907558?ls=1&mt=8',
    author: 'Impronta Advance',
  },
  {
    name: 'Nalathe Kerala',
    icon: 'https://lh3.googleusercontent.com/5N0WYat5WuFbhi5yR2ccdbqmiZ0wbTtKRG9GhT3YK7Z-qRvmykZyAgk0HNElOxD2JOPr=w300-rw',
    link: 'https://play.google.com/store/apps/details?id=com.rhyble.nalathekerala',
    author: 'Rhyble',
  },
  {
    name: 'Ncredible',
    icon: 'http://a3.mzstatic.com/us/r30/Purple2/v4/a9/00/74/a9007400-7ccf-df10-553b-3b6cb67f3f5f/icon350x350.png',
    link: 'https://itunes.apple.com/ca/app/ncredible/id1019662810?mt=8',
    author: 'NBC News Digital, LLC',
  },
  {
    name: 'Noodler',
    icon: 'http://a5.mzstatic.com/us/r30/Purple6/v4/d9/9a/69/d99a6919-7f11-35ad-76ea-f1741643d875/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/noodler-noodle-soup-oracle/id1013183002?mt=8',
    author: 'Michele Humes & Joshua Sierles',
  },
  {
    name: 'Night Light',
    icon: 'http://is3.mzstatic.com/image/pf/us/r30/Purple7/v4/5f/50/5f/5f505fe5-0a30-6bbf-6ed9-81ef09351aba/mzl.lkeqxyeo.png',
    link: 'https://itunes.apple.com/gb/app/night-light-feeding-light/id1016843582?mt=8',
    author: 'Tian Yuan',
  },
  {
    name: 'Okanagan News',
    icon: 'http://a5.mzstatic.com/us/r30/Purple69/v4/aa/93/17/aa93171e-d0ed-7e07-54a1-be27490e210c/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/okanagan-news-reader-for-viewing/id1049147148?mt=8',
    author: 'Levi Cabral',
  },
  {
    name: 'Pimmr',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple69/v4/99/da/0e/99da0ee6-bc87-e1a6-1d95-7027c78f50e1/icon175x175.jpeg',
    link: 'https://itunes.apple.com/nl/app/pimmr/id1023343303?mt=8',
    author: 'Pimmr'
  },
  {
    name: 'Posyt - Tinder for ideas',
    icon: 'http://a3.mzstatic.com/us/r30/Purple6/v4/a5/b3/86/a5b38618-a5e9-6089-7425-7fa51ecd5d30/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/posyt-anonymously-meet-right/id1037842845?mt=8',
    author: 'Posyt.com',
  },
  {
    name: 'Raindrop.io',
    icon: 'http://a5.mzstatic.com/us/r30/Purple3/v4/f0/a4/57/f0a4574e-4a59-033f-05ff-5c421f0a0b00/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/raindrop.io-keep-your-favorites/id1021913807',
    author: 'Mussabekov Rustem',
  },
  {
    name: 'ReactTo36',
    icon: 'http://is2.mzstatic.com/image/pf/us/r30/Purple5/v4/e3/c8/79/e3c87934-70c6-4974-f20d-4adcfc68d71d/mzl.wevtbbkq.png',
    link: 'https://itunes.apple.com/us/app/reactto36/id989009293?mt=8',
    author: 'Jonathan Solichin',
  },
  {
    name: 'RenovationFind',
    icon: 'http://a2.mzstatic.com/us/r30/Purple3/v4/4f/89/af/4f89af72-9733-2f59-6876-161983a0ee82/icon175x175.png',
    link: 'https://itunes.apple.com/ca/app/renovationfind/id1040331641?mt=8',
    author: 'Christopher Lord'
  },
  {
    name: 'RepairShopr',
    icon: 'http://a3.mzstatic.com/us/r30/Purple69/v4/fa/96/ee/fa96ee57-c5f0-0c6f-1a34-64c9d3266b86/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/repairshopr-payments-lite/id1023262888?mt=8',
    author: 'Jed Tiotuico',
  },
  {
    name: 'Rota Employer - Hire On Demand',
    link: 'https://itunes.apple.com/us/app/rota-employer-hire-on-demand/id1042270305?mt=8',
    icon: 'https://avatars2.githubusercontent.com/u/15051833?v=3&s=200',
    author: 'Rota',
  },
  {
    name: 'Rota Worker - Shifts On Demand',
    icon: 'http://a5.mzstatic.com/us/r30/Purple3/v4/51/ca/49/51ca4924-61c8-be1d-ab6d-afa510b1d393/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/rota-worker-shifts-on-demand/id1042111289?mt=8',
    author: 'Rota',
  },
  {
    name: 'Round - A better way to remember your medicine',
    icon: 'https://s3.mzstatic.com/us/r30/Purple69/v4/d3/ee/54/d3ee54cf-13b6-5f56-0edc-6c70ac90b2be/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/round-beautiful-medication/id1059591124?mt=8',
    author: 'Circadian Design',
  },
  {
    name: 'RWpodPlayer - audio player for RWpod podcast',
    icon: 'http://a1.mzstatic.com/us/r30/Purple69/v4/a8/c0/b1/a8c0b130-e44b-742d-6458-0c89fcc15b6b/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/rwpodplayer/id1053885042?mt=8',
    author: 'Alexey Vasiliev aka leopard',
  },
  {
    name: 'SG Toto 4d',
    icon: 'http://a4.mzstatic.com/us/r30/Purple7/v4/d2/bc/46/d2bc4696-84d6-9681-a49f-7f660d6b04a7/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/sg-toto-4d/id1006371481?mt=8',
    author: 'Steve Ng'
  },
  {
    name: 'ShareHows',
    icon: 'http://a4.mzstatic.com/us/r30/Purple5/v4/78/1c/83/781c8325-a1e1-4afc-f106-a629bcf3c6ef/icon175x175.png',
    link: 'https://itunes.apple.com/kr/app/sweeohauseu-sesang-ui-modeun/id1060914858?mt=8',
    author: 'Dobbit Co., Ltd.'
  },
  {
    name: 'Spero for Cancer',
    icon: 'https://s3-us-west-1.amazonaws.com/cancerspot/site_images/Spero1024.png',
    link: 'https://geo.itunes.apple.com/us/app/spero-for-cancer/id1033923573?mt=8',
    author: 'Spero.io',
  },
  {
    name: 'Tabtor Parent',
    icon: 'http://a1.mzstatic.com/us/r30/Purple4/v4/80/50/9d/80509d05-18f4-a0b8-0cbb-9ba927d04477/icon175x175.jpeg',
    link: 'https://itunes.apple.com/us/app/tabtor-math/id1018651199?utm_source=ParentAppLP',
    author: 'PrazAs Learning Inc.',
  },
  {
    name: 'Thai Tone',
    icon: 'http://a5.mzstatic.com/us/r30/Purple2/v4/b1/e6/2b/b1e62b3d-6747-0d0b-2a21-b6ba316a7890/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/thai-tone/id1064086189?mt=8',
    author: 'Alexey Ledak',
  },
  {
    name: 'Text Blast',
    icon: 'http://a3.mzstatic.com/us/r30/Purple49/v4/4f/29/58/4f2958a1-7f35-9260-6340-c67ac29d7740/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/text-blast-2016/id1023852862?mt=8',
    author: 'Sesh',
  },
  {
    name: 'Tong Xing Wang',
    icon: 'http://a3.mzstatic.com/us/r30/Purple1/v4/7d/52/a7/7d52a71f-9532-82a5-b92f-87076624fdb2/icon175x175.jpeg',
    link: 'https://itunes.apple.com/cn/app/tong-xing-wang/id914254459?mt=8',
    author: 'Ho Yin Tsun Eugene',
  },
  {
    name: 'WEARVR',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple69/v4/4f/5a/28/4f5a2876-9530-ef83-e399-c5ef5b2dab80/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/gb/app/wearvr/id1066288171?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.wearvr.app',
    author: 'WEARVR LLC',
  },
  {
    name: 'WOOP',
    icon: 'http://a4.mzstatic.com/us/r30/Purple6/v4/b0/44/f9/b044f93b-dbf3-9ae5-0f36-9b4956628cab/icon350x350.jpeg',
    link: 'https://itunes.apple.com/us/app/woop-app/id790247988?mt=8',
    author: 'Moritz Schwörer (@mosch)',
  },
  {
    name: 'WPV',
    icon: 'http://a1.mzstatic.com/us/r30/Purple3/v4/f1/ae/51/f1ae516b-d8e9-1b6d-acfe-755623a88327/icon350x350.png',
    link: 'https://itunes.apple.com/us/app/wpv/id725222647?mt=8',
    author: 'Yamill Vallecillo (@yamill3)',
  },
  {
    name: 'Yoloci',
    icon: 'http://a5.mzstatic.com/eu/r30/Purple7/v4/fa/e5/26/fae52635-b97c-bd53-2ade-89e2a4326745/icon175x175.jpeg',
    link: 'https://itunes.apple.com/de/app/yoloci/id991323225?mt=8',
    author: 'Yonduva GmbH (@PhilippKrone)',
  },
  {
    name: 'youmeyou',
    icon: 'http://is1.mzstatic.com/image/pf/us/r30/Purple7/v4/7c/42/30/7c423042-8945-7733-8af3-1523468706a8/mzl.qlecxphf.png',
    link: 'https://itunes.apple.com/us/app/youmeyou/id949540333?mt=8',
    author: 'youmeyou, LLC',
  },
  {
    name: 'Ziliun',
    icon: 'https://lh3.googleusercontent.com/c6ot13BVlU-xONcQi-llFmKXZCLRGbfrCv1RnctWtOELtPYMc0A52srXAfkU897QIg=w300',
    link: 'https://play.google.com/store/apps/details?id=com.ziliunapp',
    author: 'Sonny Lazuardi',
  },
  {
    name: 'YazBoz',
    icon: 'http://a4.mzstatic.com/us/r30/Purple6/v4/80/4f/43/804f431d-2828-05aa-2593-99cfb0475351/icon175x175.png',
    link: 'https://itunes.apple.com/us/app/yazboz-batak-esli-batak-okey/id1048620855?ls=1&mt=8',
    author: 'Melih Mucuk',
  },
  {
    name: '天才段子手',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_12236104_1451810987/96',
    linkAppStore: 'https://itunes.apple.com/us/app/tian-cai-duan-zi-shou-shen/id992312701?l=zh&ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.geniusJokeWriter.app',
    author: 'Ran Zhao&Ji Zhao'
  },
  {
    name: '你造么',
    icon: 'http://7xk1ez.com2.z0.glb.qiniucdn.com/logo-mobile-0114logo_welcom.png',
    link: 'https://itunes.apple.com/us/app/ni-zao-me/id1025294933?l=zh&ls=1&mt=8',
    author: 'Scott Chen(@NZAOM)'
  }
];

var AppList = React.createClass({

  render: function() {
    return (
      <div>
        {this.props.apps.map(this._renderApp)}
      </div>
    )
  },

  _renderApp: function(app, i) {
    var inner = (
      <div>
        <img src={app.icon} alt={app.name} />
        <h3>{app.name}</h3>
        {app.linkAppStore && app.linkPlayStore ? this._renderLinks(app) : null}
        <p>By {app.author}</p>
        {this._renderBlogPosts(app)}
      </div>
    );

    if (app.linkAppStore && app.linkPlayStore) {
      return (<div className="showcase" key={i}>{inner}</div>);
    }

    return (
      <div className="showcase" key={i}>
        <a href={app.link} target="blank">
          {inner}
        </a>
      </div>
    );
  },

  _renderBlogPosts: function(app) {
    if (!app.blogs) {
      return;
    }

    if (app.blogs.length === 1) {
      return (
        <p><a href={app.blogs[0]} target="blank">Blog post</a></p>
      );
    } else if (app.blogs.length > 1) {
      return (
        <p>Blog posts: {app.blogs.map(this._renderBlogPost)}</p>
      );
    }
  },

  _renderBlogPost: function(url, i) {
    return (
      <a href={url} target="blank">
        {i + 1}&nbsp;
      </a>
    );
  },

  _renderLinks: function(app) {
    return (
      <p>
        <a href={app.linkAppStore} target="blank">iOS</a>
        {" - "}
        <a href={app.linkPlayStore} target="blank">Android</a>
      </p>
    );
  },
});

var showcase = React.createClass({
  render: function() {
    return (
      <Site section="showcase" title="Showcase">
        <section className="content wrap documentationContent nosidebar showcaseSection">
          <div className="inner-content showcaseHeader">
            <h1 style={{textAlign: 'center'}}>Apps using React Native</h1>
            <div className="subHeader"></div>
            <p>The following is a list of some of the public apps using <strong>React Native</strong> and are published on the Apple App Store or the Google Play Store. Not all are implemented 100% in React Native -- many are hybrid native/React Native. Can you tell which parts are which? :)</p>
            <p>Want to add your app? Found an app that no longer works or no longer uses React Native? Please submit a pull request on <a href="https://github.com/facebook/react-native">GitHub</a> to update this page!</p>
          </div>

          <div className="inner-content showcaseHeader">
            <h1 style={{textAlign: 'center'}}>Featured Apps</h1>
            <div className="subHeader"></div>
            <p>These are some of the most well-crafted React Native apps that we have come across.<br/>Be sure to check them out to get a feel for what React Native is capable of!</p>
          </div>
          <div className="inner-content">
            <AppList apps={featured} />
          </div>

          <div className="inner-content showcaseHeader">
            <h1 style={{textAlign: 'center'}}>All Apps</h1>
            <p>Not all apps can be featured, otherwise we would have to create some other category like &quot;super featured&quot; and that's just silly. But that doesn't mean you shouldn't check these apps out!</p>
          </div>
          <div className="inner-content">
            <AppList apps={apps} />
          </div>
        </section>
      </Site>
    );
  }
});

module.exports = showcase;
