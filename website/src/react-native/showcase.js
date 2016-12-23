/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
*/
'use strict';

var React = require('React');
var Site = require('Site');

/*
Thousands of applications use React Native, so we can't list all of them
in our showcase. To be useful to someone looking through the showcase,
either the app must be something that most readers would recognize, or the
makers of the application must have posted useful technical content about the
making of the app. It also must be useful considering that the majority of
readers only speak English. So, each app in the showcase should link to either:

1/ An English-language news article discussing the app, built either by a funded startup or for a public company
2/ An English-language technical post on a funded startup or public company blog discussing React Native

For each app in the showcase, use infoLink and infoTitle to reference this
content.
*/
var featured = [
  {
    name: 'Qzone (QQ空间)',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_9959_1460036593/96',
    linkPlayStore: 'http://android.myapp.com/myapp/detail.htm?apkName=com.qzone',
    infoLink: 'https://en.wikipedia.org/wiki/Qzone',
    infoTitle: 'Qzone is a Chinese social network with over 600 million users',
  },
  {
    name: 'QQ Music (QQ音乐)',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_6259_1462429453/96',
    linkPlayStore: 'http://android.myapp.com/myapp/detail.htm?apkName=com.tencent.qqmusic',
    infoLink: 'http://www.wsj.com/articles/tencent-customers-come-for-the-music-stay-for-the-perks-1433869369',
    infoTitle: 'Internet giant tries to get people to pay for digital music',
  },
  {
    name: 'FanVision Bolt',
    icon: 'http://a4.mzstatic.com/us/r30/Purple18/v4/94/b4/6e/94b46ee5-80e3-ff6e-513d-16da926b03a3/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/fanvision-bolt/id1081891275',
    infoLink: 'https://www.youtube.com/watch?v=oWOcAXyDf0w',
    infoTitle: 'FanVision Bolt accessory + app provide live audio/video and stats at NASCAR events',
  },
  {
    name: 'F8',
    icon: 'https://raw.githubusercontent.com/fbsamples/f8app/master/ios/F8v2/Images.xcassets/AppIcon.appiconset/AppIcon%402x.png',
    linkAppStore: 'https://itunes.apple.com/us/app/f8/id853467066?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.facebook.f8',
    infoLink: 'http://makeitopen.com/tutorials/building-the-f8-app/planning/',
    infoTitle: 'Tutorial: Building the F8 2016 conference app',
  },
  {
    name: 'Discovery VR',
    icon: 'http://a2.mzstatic.com/us/r30/Purple6/v4/d1/d5/f4/d1d5f437-9f6b-b5aa-5fe7-47bd19f934bf/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/discovery-vr/id1030815031?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.discovery.DiscoveryVR',
    infoLink: 'https://medium.com/ios-os-x-development/an-ios-developer-on-react-native-1f24786c29f0',
    infoTitle: '"I may never write an iOS app in Objective-C or Swift again."',
  },
  {
    name: 'Movie Trailers',
    icon: 'https://lh3.googleusercontent.com/16aug4m_6tvJB7QZden9w1SOMqpZgNp7rHqDhltZNvofw1a4V_ojGGXUMPGiK0dDCqzL=w300',
    linkAppStore: 'https://itunes.apple.com/us/app/movie-trailers-by-movielala/id1001416601?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.movielala.trailers',
    infoLink: 'http://variety.com/2016/digital/news/movielala-1-4-million-seed-round-hollywood-angel-investors-1201678139/',
    infoTitle: 'MovieLaLa Closes $1.4 Million Seed Round',
  },
  {
    name: 'Myntra',
    icon: 'http://a5.mzstatic.com/us/r30/Purple6/v4/9c/78/df/9c78dfa6-0061-1af2-5026-3e1d5a073c94/icon350x350.png',
    linkAppStore: 'https://itunes.apple.com/in/app/myntra-fashion-shopping-app/id907394059',
    infoLink: 'https://techcrunch.com/2014/05/22/flipkart-myntra-acqusition/',
    infoTitle: 'Flipkart Buys Fashion E-tailer Myntra To Fight Amazon',
  },
  {
    name: 'SoundCloud Pulse',
    icon: 'https://i1.sndcdn.com/artworks-000149203716-k5je96-original.jpg',
    linkAppStore: 'https://itunes.apple.com/us/app/soundcloud-pulse-for-creators/id1074278256?mt=8',
    infoLink: 'https://blog.soundcloud.com/2016/02/23/soundcloud-pulse-now-on-iphone/',
    infoTitle: 'SoundCloud Pulse: now on iPhone',
  },
  {
    name: 'Start',
    icon: 'http://a1.mzstatic.com/us/r30/Purple49/v4/de/9b/6f/de9b6fe8-84ea-7a12-ba2c-0a6d6c7b10b0/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/start-medication-manager-for/id1012099928?mt=8',
    infoLink: 'http://www.nytimes.com/2014/09/24/technology/to-gather-drug-information-a-health-start-up-turns-to-consumers.html?_r=0',
    infoTitle: 'NYT: A Health Startup Turns to Consumers',
  },
  {
    name: 'Taxfyle',
    icon: 'https://s3.amazonaws.com/taxfyle-public/images/taxfyle-icon-1024px.png',
    linkAppStore: 'https://itunes.apple.com/us/app/taxfyle/id1058033104?mt=8',
    infoLink: 'http://www.techinsider.io/taxfyle-wants-to-be-the-uber-for-taxes-2016-4',
    infoTitle: 'Taxfyle: the Uber for filing taxes',
  },
  {
    name: 'This AM',
    icon: 'http://s3.r29static.com//bin/public/efe/x/1542038/image.png',
    linkAppStore: 'https://itunes.apple.com/us/app/refinery29-this-am-top-breaking/id988472315?mt=8',
    infoLink: 'https://techcrunch.com/2016/02/01/refinery29-debuts-its-first-app-a-morning-news-round-up-called-refinery29-am/',
    infoTitle: 'Refinery29 debuts its first app',
  },
  {
    name: 'TRED',
    icon: 'http://a1.mzstatic.com/us/r30/Purple20/v4/b0/0c/07/b00c07d2-a057-06bc-6044-9fdab97f370f/icon175x175.jpeg',
    linkAppStore:  'https://itunes.apple.com/us/app/tred-sell-my-car-for-more!/id1070071394?mt=8',
    linkPlayStore:  'https://play.google.com/store/apps/details?id=com.tredmobile&hl=en',
    infoLink: 'http://www.geekwire.com/2015/mobile-dealership-tred-raises-another-1m-to-help-used-car-owners-make-more-money/',
    infoTitle: 'Sell your car for thousands more than Craigslist or the dealer with TRED',
  },
  {
    name: 'Bitt Wallet',
    icon: 'http://a4.mzstatic.com/us/r30/Purple69/v4/5b/00/34/5b003497-cc85-a0d0-0d3e-4fb3bc6f95cd/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/bitt-wallet/id1081954916?mt=8',
    infoLink: 'https://bitcoinmagazine.com/articles/overstock-invests-in-bitt-to-launch-official-digital-currencies-in-the-caribbean-islands-1459961581',
    infoTitle: 'Overstock invests in Bitt to launch digital currencies',
  },
  {
    name: 'CBS Sports Franchise Football',
    icon: 'http://a2.mzstatic.com/us/r30/Purple69/v4/7b/0c/a0/7b0ca007-885a-7cfc-9fa2-2ec4394c2ecc/icon175x175.png',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.cbssports.fantasy.franchisefootball2015',
    infoLink: 'http://www.cbssports.com/fantasy/football/games/franchise/2015',
    infoTitle: 'The award winning Fantasy Football league manager.',
  },
  {
    name: 'Coiney (窓口)',
    icon: 'http://a4.mzstatic.com/us/r30/Purple69/v4/c9/bc/3a/c9bc3a29-9c11-868f-b960-ca46d5fcd509/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/jp/app/coiney-chuang-kou/id1069271336?mt=8',
    infoLink: 'https://www.techinasia.com/japan-startup-coiney-aims-for-ipo',
    infoTitle: 'Japanese startup Coiney aims for IPO',
  },
  {
    name: 'Convoy Driver',
    icon: 'http://a1.mzstatic.com/us/r30/Purple30/v4/5a/74/56/5a74567d-4491-a298-65cd-722c8a7211ac/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/convoy-driver/id1045368390?mt=8',
    infoLink: 'http://www.theverge.com/2015/10/27/9620352/convoy-uber-for-trucking',
    infoTitle: 'Convoy, a Seattle-based "Uber for trucking"',
  },
  {
    name: 'Fixt',
    icon: 'http://a5.mzstatic.com/us/r30/Purple62/v4/7f/b3/66/7fb366c4-79fd-34e1-3037-ffc02d8a93f7/icon350x350.png',
    linkAppStore:  'https://itunes.apple.com/us/app/dropbot-phone-replacement/id1000855694?mt=8',
    linkPlayStore:  'https://play.google.com/store/apps/details?id=co.fixt',
    infoLink: 'http://www.phonearena.com/news/Fixt-is-an-app-that-promises-a-hassle-free-smartphone-repairy-service_id81069',
    infoTitle: 'A hassle-free smartphone repair service',
  },
  {
    name: 'Leanpub',
    icon: 'http://a2.mzstatic.com/us/r30/Purple6/v4/9f/4a/6f/9f4a6f8c-8951-ed89-4083-74ace23df9ef/icon350x350.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/leanpub/id913517110?ls=1&mt=8',
    infoLink: 'http://techland.time.com/2011/06/23/how-to-turn-your-blog-into-an-instant-e-book/',
    infoTitle: 'Leanpub: How to Turn Your Blog into an Instant E-Book',
  },
  {
    name: 'Lugg',
    icon: 'https://lh3.googleusercontent.com/EV9z7kRRME2KPMBRNHnje7bBNEl_Why2CFq-MfKzBC88uSFJTYr1HO3-nPt-JuVJwKFb=w300',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.lugg',
    infoLink: 'https://techcrunch.com/2015/08/26/lugg-an-app-for-on-demand-short-distance-moves-raises-3-8-million/',
    infoTitle: 'Lugg, An App for Short-Distance Moves, Raises $3.8 Million',
  },
  {
    name: 'Pimmr',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple69/v4/99/da/0e/99da0ee6-bc87-e1a6-1d95-7027c78f50e1/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/nl/app/pimmr/id1023343303?mt=8',
    infoLink: 'https://www.crunchbase.com/organization/pimmr#/entity',
    infoTitle: 'Pimmr helps you find the needle in the haystack',
  },
  {
    name: 'Project September',
    icon: 'http://a4.mzstatic.com/us/r30/Purple30/v4/95/51/b7/9551b72a-d80a-5b1c-5c6d-7fc77d745d31/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/project-september/id1074075331?ls=1&mt=8&_branch_match_id=273849075056044546',
    infoLink: 'http://fortune.com/2016/04/14/project-september-alexis-maybank/',
    infoTitle: 'Former Gilt CEO Launches New Mobile App',
  },
  {
    name: 'Samanage',
    icon: 'http://a3.mzstatic.com/us/r30/Purple69/v4/ed/e9/ff/ede9ff34-a9f6-5eb6-2a23-fcb014b326f2/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/us/app/samanage/id1033018362',
    infoLink: 'https://techcrunch.com/2015/05/20/samanage-raises-16m-as-asset-management-business-grows/',
    infoTitle: 'Samanage raises $16M as Asset Management Expands',
  },
  {
    name: 'ShareWis',
    icon: 'https://s3-ap-northeast-1.amazonaws.com/sw-misc/sharewis3_app.png',
    linkAppStore: 'https://itunes.apple.com/jp/app/id585517208',
    infoLink: 'https://www.crunchbase.com/organization/sharewis#/entity',
    infoTitle: 'The concept is to turn learning into an adventure',
  },
  {
    name: 'sneat',
    icon: 'http://a3.mzstatic.com/eu/r30/Purple49/v4/71/71/df/7171df47-6e03-8619-19a8-07f52186b0ed/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/fr/app/sneat-reservez-les-meilleurs/id1062510079?l=en&mt=8',
    infoLink: 'http://www.internetsansfrontieres.com/sneat-application-mobile-reserver-restaurant/',
    infoTitle: 'Application mobile pour réserver un restaurant',
  },
  {
    name: 'Ticketea',
    icon: 'http://f.cl.ly/items/0n3g3x2t0W0a0d0b1F0C/tkt-icon.png',
    linkAppStore: 'https://itunes.apple.com/es/app/entradas-teatro-y-conciertos/id1060067658?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.ticketea.geminis',
    infoLink: 'https://techcrunch.com/2013/05/27/ticket-to-ride/',
    infoTitle: 'Ticketea raises $4 Million to Beat Ticketmaster',
  },
  {
    name: 'uSwitch',
    icon: 'https://lh3.googleusercontent.com/NpkGlwFWdj7VsK2ueVwlgdrrBrNJ-yN-4TkEHjjSjDUu7NpMcfyAp10p97f0zci0CSFQ=w300',
    linkAppStore: 'https://itunes.apple.com/gb/app/uswitch-compare-switch-save/id935325621?mt=8&ct=react',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.uswitchmobileapp',
    infoLink: 'https://en.wikipedia.org/wiki/USwitch',
    infoTitle: 'uSwitch: a UK-based price comparison service',
  },
  {
    name: 'WEARVR',
    icon: 'http://a2.mzstatic.com/eu/r30/Purple69/v4/4f/5a/28/4f5a2876-9530-ef83-e399-c5ef5b2dab80/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/gb/app/wearvr/id1066288171?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.wearvr.app',
    infoLink: 'http://venturebeat.com/2015/04/07/virtual-reality-app-store-wear-vr-secures-1-5m-in-funding/',
    infoTitle: 'Wear VR secures $1.5M in funding',
  },
  {
    name: 'Wego Concerts',
    icon: 'http://a5.mzstatic.com/us/r30/Purple69/v4/03/91/2d/03912daa-fae7-6a25-5f11-e6b19290b3f4/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/wego-concerts-follow-friends/id869478093?mt=8',
    infoLink: 'http://www.nydailynews.com/life-style/wego-concerts-app-links-music-fans-article-1.2066776',
    infoTitle: 'Wego Concerts: Like the love child of Tinder and StubHub',
  },
  {
    name: 'Bdsdiet',
    icon: 'http://s3.ap-northeast-2.amazonaws.com/bdsdiet-bucket/media/store-icon.png',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.bdsdiet_app',
    infoLink: 'https://www.crunchbase.com/organization/bds-diet#/entity',
    infoTitle: 'Bdsdiet provides real estate brokerage services through web and live agents in Korea.',
  },
  {
    name: 'Crowdsource (蜂鸟众包)',
    icon: 'http://img.wdjimg.com/mms/icon/v1/e/6e/687b129606504cd52632a8cc4ca816ee_256_256.png',
    linkPlayStore: 'http://www.wandoujia.com/apps/me.ele.crowdsource',
    linkAppStore: 'https://itunes.apple.com/cn/app/feng-niao-zhong-bao-jian-zhi/id1061034377?mt=8',
    infoLink: 'https://elelogistics.github.io/about/Crowdsource-App-Write-In-React-Native.html',
    infoTitle: 'Fengniao Crowdsource is the largest crowdsourced logistics platform in China.',
  },
  {
    name: '昨日热推',
    icon: 'https://frontbin.com/images/apple-touch-icon.png',
    linkAppStore: 'https://itunes.apple.com/cn/app/zuo-ri-re-tui/id1137163693?l=en&mt=8',
    infoLink: 'https://www.zfanw.com/blog/developing-react-native-image-viewer-library.html',
    infoTitle: 'Developing the react-native-image-viewer library',
  },
  {
    name: 'Artsy',
    icon: 'https://raw.githubusercontent.com/artsy/eigen/master/Artsy/Resources/Images.xcassets/AppIcon.appiconset/AppIcon167.png',
    linkAppStore: 'https://itunes.apple.com/us/app/artsy-collect-bid-on-fine/id703796080?mt=8',
    infoLink: 'https://artsy.github.io/series/react-native-at-artsy/',
    infoTitle: 'React Native at Artsy',
  },
  {
    name: 'Huiseoul (惠首尔)',
    icon: 'https://cdn.huiseoul.com/icon.png',
    linkAppStore: 'https://itunes.apple.com/us/app/hui-shou-er-ni-si-ren-mei/id1127150360?ls=1&mt=8',
    infoLink: 'https://engineering.huiseoul.com/building-a-conversational-e-commerce-app-in-6-weeks-with-react-native-c35d46637e07',
    infoTitle: 'Building a conversational E-commerce app in 6 weeks with React Native',
  },
  {
    name: 'PlaceAVote',
    icon: 'https://s12.postimg.org/nr79mplq5/pav_Icon.png',
    linkAppStore: 'https://itunes.apple.com/us/app/placeavote/id1120628991?ls=1&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.placeavote.androidapp&hl=en',
    infoLink: 'https://techcrunch.com/2016/05/10/placeavote-wants-to-give-voters-a-say-in-congress/',
    infoTitle: 'PlaceAVote wants to give voters a say in Congress',
  },
  {
    name: 'Robin Rooms',
    icon: 'http://robinpowered.s3.amazonaws.com/rooms/appicon.png',
    linkAppStore: 'https://itunes.apple.com/us/app/robin-rooms/id947566115',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.robinpowered.rooms',
    infoLink: 'https://techcrunch.com/2016/05/31/robin-makes-the-office-smarter-with-7-million-in-new-funding/',
    infoTitle: 'Robin Rooms manages and mounts outside your conference rooms'
  },
  {
    name: 'Sleeperbot',
    icon: 'https://blitzchat.net/uploads/c8425332190a4f4b852d7770ad32e602/original.png',
    linkAppStore: 'https://itunes.apple.com/us/app/sleeperbot-fantasy-football/id987367543?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.sleeperbot&hl=en',
    infoLink: 'https://medium.com/sleeperbot-hq/switching-to-react-native-in-production-on-ios-and-android-e6b675402712#.cug6h6qhn',
    infoTitle: 'Switching to React Native in Production on iOS and Android',
  },
  {
    name: 'JD（手机京东）',
    icon: 'https://lh3.googleusercontent.com/AIIAZsqyEG0KmCFruh1Ec374-2l7n1rfv_LG5RWjdAZOzUBCu-5MRqdLbzJfBnOdSFg=w300-rw',
    linkAppStore: 'https://itunes.apple.com/cn/app/shou-ji-jing-dong-xin-ren/id414245413?mt=8',
    linkPlayStore: 'https://app.jd.com/android.html',
    infoLink: 'http://ir.jd.com/phoenix.zhtml?c=253315&p=irol-homeProfile',
    infoTitle: 'JD.com is China’s largest ecommerce company by revenue and a member of the Fortune Global 500.',
  },
  {
    name: 'Chop',
    icon: 'https://pbs.twimg.com/profile_images/656536498951446529/6zU6BvgB.png',
    linkAppStore: 'http://apple.co/2dfkYH9',
    infoLink: 'https://blog.getchop.io/how-we-built-chop-bae3d8acd131#.7y8buamrq',
    infoTitle: 'How we built Chop',
  },
  {
    name: 'Bloomberg',
    icon: 'http://is1.mzstatic.com/image/thumb/Purple71/v4/31/24/72/312472df-3d53-0acf-fc31-8a25682e528f/source/175x175bb.jpg',
    linkAppStore: 'https://itunes.apple.com/us/app/bloomberg/id281941097?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.bloomberg.android.plus&hl=en',
    infoLink: 'https://www.techatbloomberg.com/blog/bloomberg-used-react-native-develop-new-consumer-app/',
    infoTitle: 'How Bloomberg Used React Native to Develop its new Consumer App',
  },
	{
		name: 'Blink',
		icon: 'https://lh3.googleusercontent.com/QaId7rFtOjAT-2tHVkKB4lebX_w4ujWiO7ZIDe3Hd99TfBmPmiZySbLbVJV65qs0ViM=w300-rw',
		linkPlayStore: 'https://play.google.com/store/apps/details?id=com.witapp',
		infoLink: 'https://hashnode.com/post/what-we-learned-after-using-react-native-for-a-year-civdr8zv6058l3853wqud7hqp',
		infoTitle: 'What we learned after using React Native for a year',
	}
];

/*
If you want your app to be featured in the showcase, add them to the featured
hash above this line. The pinned list is reserved for a small list of hand-picked apps.
*/
var pinned = [
  {
    name: 'Facebook',
    icon: 'https://lh3.googleusercontent.com/ZZPdzvlpK9r_Df9C3M7j1rNRi7hhHRvPhlklJ3lfi5jk86Jd1s0Y5wcQ1QgbVaAP5Q=w300',
    linkAppStore: 'https://itunes.apple.com/app/facebook/id284882215',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.facebook.katana&hl=en',
    infoLink: 'https://code.facebook.com/posts/895897210527114/dive-into-react-native-performance/',
    infoTitle: 'Using React Native in the Facebook App',
    defaultLink: 'https://itunes.apple.com/app/facebook/id284882215',
  },
  {
    name: 'Facebook Ads Manager',
    icon: 'http://is5.mzstatic.com/image/pf/us/r30/Purple5/v4/9e/16/86/9e1686ef-cc55-805a-c977-538ddb5e6832/mzl.gqbhwitj.png',
    linkAppStore: 'https://itunes.apple.com/us/app/facebook-ads-manager/id964397083?mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.facebook.adsmanager',
    infoLink: 'https://code.facebook.com/posts/1189117404435352/react-native-for-android-how-we-built-the-first-cross-platform-react-native-app/',
    infoTitle: 'How We Built the First Cross-Platform React Native App',
    defaultLink: 'https://itunes.apple.com/us/app/facebook-ads-manager/id964397083?mt=8',
  },
  {
    name: 'Facebook Groups',
    icon: 'http://is4.mzstatic.com/image/pf/us/r30/Purple69/v4/57/f8/4c/57f84c0c-793d-5f9a-95ee-c212d0369e37/mzl.ugjwfhzx.png',
    linkAppStore: 'https://itunes.apple.com/us/app/facebook-groups/id931735837?mt=8',
    infoLink: 'https://code.facebook.com/posts/1014532261909640/react-native-bringing-modern-web-techniques-to-mobile/',
    infoTitle: 'React Native: Bringing Modern Web Techniques to Mobile',
    defaultLink: 'https://itunes.apple.com/us/app/facebook-groups/id931735837?mt=8',
  },
  {
    name: 'Instagram',
    icon: 'http://a4.mzstatic.com/us/r30/Purple62/v4/1f/8d/f9/1f8df910-8ec7-3b8e-0104-d44e869f4d65/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/app/instagram/id389801252?pt=428156&ct=igweb.unifiedHome.badge&mt=8',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.instagram.android&referrer=utm_source%3Dinstagramweb%26utm_campaign%3DunifiedHome%26utm_medium%3Dbadge',
    infoLink: '',
    infoTitle: '',
    defaultLink: 'https://www.instagram.com/',
  },
  {
    name: 'Airbnb',
    icon: 'https://a2.muscache.com/airbnb/static/icons/apple-touch-icon-180x180-bcbe0e3960cd084eb8eaf1353cf3c730.png',
    linkAppStore: 'https://itunes.apple.com/us/app/airbnb/id401626263?mt=8&bev=1472279725_4ITWKWGX6KrmU6pT&utm_medium=web&utm_source=airbnb&_branch_match_id=307510898795870823',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=com.airbnb.android&hl=en&referrer=bev%3D1472279725_4ITWKWGX6KrmU6pT%26utm_medium%3Dweb%26utm_source%3Dairbnb',
    infoLink: 'https://www.youtube.com/watch?v=tUfgQtmG3R0',
    infoTitle: 'Hybrid React Native Apps at Airbnb',
    defaultLink: 'https://www.airbnb.com/mobile',
  },
  {
    name: 'Baidu(手机百度)',
    icon: 'http://a3.mzstatic.com/us/r30/Purple62/v4/90/7c/9b/907c9b4e-556d-1a45-45d4-0ea801719abd/icon175x175.png',
    linkPlayStore: 'http://shouji.baidu.com/software/9896302.html',
    linkAppStore: 'https://itunes.apple.com/en/app/shou-ji-bai-du-hai-liang-xin/id382201985?l=en&mt=8',
    infoLink: 'http://baike.baidu.com/link?url=TW8YhcVN4tO_Jz5VqMclCjGhf12EEqMD_TeVC6efe2REZlx80r6T0dX96hdmNl36XogLyExXzrvFU9rFeqxg_K',
    infoTitle: 'Baidu is a search engine that has 600 million users.',
    defaultLink: 'http://baike.baidu.com/link?url=TW8YhcVN4tO_Jz5VqMclCjGhf12EEqMD_TeVC6efe2REZlx80r6T0dX96hdmNl36XogLyExXzrvFU9rFeqxg_K',
  },
  {
    name: 'Discord',
    icon: 'http://a5.mzstatic.com/us/r30/Purple5/v4/c1/2f/4c/c12f4cba-1d9a-f6bf-2240-04085d3470ec/icon175x175.jpeg',
    linkAppStore:  'https://itunes.apple.com/us/app/discord-chat-for-gamers/id985746746?mt=8',
    infoLink: 'https://discord.engineering/react-native-deep-dive-91fd5e949933#.5jnqftgof',
    infoTitle: 'Using React Native: One Year Later',
    defaultLink: 'https://itunes.apple.com/us/app/discord-chat-for-gamers/id985746746?mt=8',
  },
  {
    name: 'Gyroscope',
    icon: 'https://media.gyrosco.pe/images/magneto/180x180.png',
    linkAppStore: 'https://itunes.apple.com/app/apple-store/id1104085053?pt=117927205&ct=website&mt=8',
    infoLink: 'https://blog.gyrosco.pe/building-the-app-1dac1a97d253',
    infoTitle: 'Building a visualization experience with React Native',
    defaultLink: 'https://itunes.apple.com/app/apple-store/id1104085053?pt=117927205&ct=website&mt=8',
  },
  {
    name: 'li.st',
    icon: 'https://lh3.googleusercontent.com/tXt0HgJ7dCgOnuQ-lQr1P7E57mnOYfwXhRsV9lGcPwHPVvrDAN6YmpLVFgy88qKrkFI=w300',
    linkPlayStore: 'https://play.google.com/store/apps/details?id=st.li.listapp',
    infoLink: 'https://www.youtube.com/watch?v=cI9bDvDEsYE',
    infoTitle: 'Building li.st for Android with React Native',
    defaultLink: 'https://play.google.com/store/apps/details?id=st.li.listapp',
  },
  {
    name: 'QQ',
    icon: 'http://pp.myapp.com/ma_icon/0/icon_6633_1461768893/96',
    linkPlayStore: 'http://android.myapp.com/myapp/detail.htm?apkName=com.tencent.mobileqq',
    infoLink: 'https://en.wikipedia.org/wiki/Tencent_QQ',
    infoTitle: 'QQ is a Chinese messaging service with 829 million active accounts',
    defaultLink: 'http://android.myapp.com/myapp/detail.htm?apkName=com.tencent.mobileqq',
  },
  {
    name: 'Townske',
    icon: 'http://a3.mzstatic.com/us/r30/Purple69/v4/8b/42/20/8b4220af-5165-91fd-0f05-014332df73ef/icon175x175.png',
    linkAppStore: 'https://itunes.apple.com/us/app/townske-stunning-city-guides/id1018136179?ls=1&mt=8',
    infoLink: 'https://hackernoon.com/townske-app-in-react-native-6ad557de7a7c',
    infoTitle: '"I would recommend React Native in a heartbeat."',
    defaultLink: 'https://itunes.apple.com/us/app/townske-stunning-city-guides/id1018136179?ls=1&mt=8',
  },
  {
    name: 'Vogue',
    icon: 'http://a2.mzstatic.com/us/r30/Purple30/v4/06/24/92/0624927f-a389-746c-27f9-e2466d59e55b/icon175x175.jpeg',
    linkAppStore: 'https://itunes.apple.com/app/apple-store/id1087973225?pt=45076&ct=site-promo&mt=8',
    infoLink: 'http://www.vogue.com/app',
    infoTitle: '',
    defaultLink: 'https://itunes.apple.com/app/apple-store/id1087973225?pt=45076&ct=site-promo&mt=8',
  }
];

featured.sort(function(a, b) {
  return a.name.localeCompare(b.name);
});
var apps = pinned.concat(featured);

var AppList = React.createClass({

  render: function() {
    return (
      <div>
        {this.props.apps.map(this._renderApp)}
      </div>
    );
  },

  _renderApp: function(app, i) {
    var inner = (
      <div>
        {this._renderIcon(app)}
        {this._renderTitle(app)}
        {this._renderLinks(app)}
        {this._renderInfo(app)}
      </div>
    );

    if (app.linkAppStore && app.linkPlayStore) {
      return (<div className="showcase" key={i}>{inner}</div>);
    }

    return (
      <div className="showcase" key={i}>
        {inner}
      </div>
    );
  },

  _renderIcon: function(app) {
    var icon = (
      <img src={app.icon} alt={app.name} />
    );

    return (
      {icon}
    );
  },

  _renderTitle: function(app) {
    var title = (
      <h3>{app.name}</h3>
    );

    return (
      {title}
    );
  },

  _renderInfo: function(app) {
    if (!app.infoLink) {
      return;
    }

    return (
      <p><a href={app.infoLink} target="_blank">{app.infoTitle}</a></p>
    );
  },

  _renderLinks: function(app) {
    if (!app.linkAppStore && !app.linkPlayStore) {
      return;
    }

    var linkAppStore = app.linkAppStore ? <a href={app.linkAppStore} target="_blank">iOS</a> : '';
    var linkPlayStore = app.linkPlayStore ? <a href={app.linkPlayStore} target="_blank">Android</a> : '';

    return (
      <p>
        {linkAppStore}
        {linkAppStore && linkPlayStore ? ' · ' : ''}
        {linkPlayStore}
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
            <h1 style={{textAlign: 'center'}}>Who's using React Native?</h1>
            <div className="subHeader" />
            <p>Thousands of apps are using React Native, from established Fortune 500 companies to hot new startups. If you're curious to see what can be accomplished with React Native, check out these apps!</p>

            <div className="inner-content">
              <AppList apps={apps} />
            </div>

            <div className="inner-content">
              <p>Some of these are hybrid native/React Native apps. If you built a popular application using React Native, we'd love to have your app on this showcase. Check out the <a href="https://github.com/facebook/react-native/blob/master/website/src/react-native/showcase.js">guidelines on GitHub</a> to update this page.</p>
            </div>

            <div className="inner-content">
              <p>Also, <a href="https://github.com/ReactNativeNews/React-Native-Apps">a curated list of open source React Native apps</a> is being kept by React Native News.</p>
            </div>

          </div>

        </section>
      </Site>
    );
  }
});

module.exports = showcase;
