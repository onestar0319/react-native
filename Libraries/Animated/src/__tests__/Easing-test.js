/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

var Easing = require('Easing');
describe('Easing', () => {
  it('should work with linear', () => {
    var easing = Easing.linear;

    expect(easing(0)).toBe(0);
    expect(easing(0.5)).toBe(0.5);
    expect(easing(0.8)).toBe(0.8);
    expect(easing(1)).toBe(1);
  });

  it('should work with ease in linear', () => {
    var easing = Easing.in(Easing.linear);
    expect(easing(0)).toBe(0);
    expect(easing(0.5)).toBe(0.5);
    expect(easing(0.8)).toBe(0.8);
    expect(easing(1)).toBe(1);
  });

  it('should work with easy out linear', () => {
    var easing = Easing.out(Easing.linear);
    expect(easing(0)).toBe(0);
    expect(easing(0.5)).toBe(0.5);
    expect(easing(0.6)).toBe(0.6);
    expect(easing(1)).toBe(1);
  });

  it('should work with ease in quad', () => {
    function easeInQuad(t) {
      return t * t;
    }
    var easing = Easing.in(Easing.quad);
    for (var t = -0.5; t < 1.5; t += 0.1) {
      expect(easing(t)).toBe(easeInQuad(t));
    }
  });

  it('should work with ease out quad', () => {
    function easeOutQuad(t) {
      return -t * (t - 2);
    }
    var easing = Easing.out(Easing.quad);
    for (var t = 0; t <= 1; t += 0.1) {
      expect(easing(1)).toBe(easeOutQuad(1));
    }
  });

  it('should work with ease in-out quad', () => {
    function easeInOutQuad(t) {
      t = t * 2;
      if (t < 1) {
        return 0.5 * t * t;
      }
      return -((t - 1) * (t - 3) - 1) / 2;
    }
    var easing = Easing.inOut(Easing.quad);
    for (var t = -0.5; t < 1.5; t += 0.1) {
      expect(easing(t)).toBeCloseTo(easeInOutQuad(t), 4);
    }
  });

  it('should satisfy boundary conditions with elastic', () => {
    for (var b = 0; b < 4; b += 0.3) {
      var easing = Easing.elastic(b);
      expect(easing(0)).toBe(0);
      expect(easing(1)).toBe(1);
    }
  });

  function sampleEasingFunction(easing) {
    var DURATION = 300;
    var tickCount = Math.round(DURATION * 60 / 1000);
    var samples = [];
    for (var i = 0; i <= tickCount; i++) {
      samples.push(easing(i / tickCount));
    }
    return samples;
  }

  var Samples = {
    in_quad: [0,0.0030864197530864196,0.012345679012345678,0.027777777777777776,0.04938271604938271,0.0771604938271605,0.1111111111111111,0.15123456790123457,0.19753086419753085,0.25,0.308641975308642,0.37345679012345684,0.4444444444444444,0.5216049382716049,0.6049382716049383,0.6944444444444445,0.7901234567901234,0.8919753086419753,1],
    out_quad: [0,0.10802469135802469,0.20987654320987653,0.3055555555555555,0.3950617283950617,0.47839506172839513,0.5555555555555556,0.6265432098765432,0.691358024691358,0.75,0.8024691358024691,0.8487654320987654,0.888888888888889,0.9228395061728394,0.9506172839506174,0.9722222222222221,0.9876543209876543,0.9969135802469136,1],
    inOut_quad: [0,0.006172839506172839,0.024691358024691357,0.05555555555555555,0.09876543209876543,0.154320987654321,0.2222222222222222,0.30246913580246915,0.3950617283950617,0.5,0.6049382716049383,0.697530864197531,0.7777777777777777,0.845679012345679,0.9012345679012346,0.9444444444444444,0.9753086419753086,0.9938271604938271,1],
    in_cubic: [0,0.00017146776406035664,0.0013717421124828531,0.004629629629629629,0.010973936899862825,0.021433470507544586,0.037037037037037035,0.05881344307270234,0.0877914951989026,0.125,0.1714677640603567,0.22822359396433475,0.2962962962962963,0.37671467764060357,0.4705075445816187,0.5787037037037038,0.7023319615912208,0.8424211248285322,1],
    out_cubic: [0,0.15757887517146785,0.2976680384087792,0.42129629629629617,0.5294924554183813,0.6232853223593964,0.7037037037037036,0.7717764060356652,0.8285322359396433,0.875,0.9122085048010974,0.9411865569272977,0.9629629629629629,0.9785665294924554,0.9890260631001372,0.9953703703703703,0.9986282578875172,0.9998285322359396,1],
    inOut_cubic: [0,0.0006858710562414266,0.0054869684499314125,0.018518518518518517,0.0438957475994513,0.08573388203017834,0.14814814814814814,0.23525377229080935,0.3511659807956104,0.5,0.6488340192043895,0.7647462277091908,0.8518518518518519,0.9142661179698217,0.9561042524005487,0.9814814814814815,0.9945130315500685,0.9993141289437586,1],
    in_sin: [0,0.003805301908254455,0.01519224698779198,0.03407417371093169,0.06030737921409157,0.09369221296335006,0.1339745962155613,0.1808479557110082,0.233955556881022,0.2928932188134524,0.35721239031346064,0.42642356364895384,0.4999999999999999,0.5773817382593005,0.6579798566743311,0.7411809548974793,0.8263518223330696,0.9128442572523416,0.9999999999999999],
    out_sin: [0,0.08715574274765817,0.17364817766693033,0.25881904510252074,0.3420201433256687,0.42261826174069944,0.49999999999999994,0.573576436351046,0.6427876096865393,0.7071067811865475,0.766044443118978,0.8191520442889918,0.8660254037844386,0.9063077870366499,0.9396926207859083,0.9659258262890683,0.984807753012208,0.9961946980917455,1],
    inOut_sin: [0,0.00759612349389599,0.030153689607045786,0.06698729810778065,0.116977778440511,0.17860619515673032,0.24999999999999994,0.32898992833716556,0.4131759111665348,0.49999999999999994,0.5868240888334652,0.6710100716628343,0.7499999999999999,0.8213938048432696,0.883022221559489,0.9330127018922194,0.9698463103929542,0.9924038765061041,1],
    in_exp: [0,0.0014352875901128893,0.002109491677524035,0.0031003926796253885,0.004556754060844206,0.006697218616039631,0.009843133202303688,0.014466792379488908,0.021262343752724643,0.03125,0.045929202883612456,0.06750373368076916,0.09921256574801243,0.1458161299470146,0.2143109957132682,0.31498026247371835,0.46293735614364506,0.6803950000871883,1],
    out_exp: [0,0.31960499991281155,0.5370626438563548,0.6850197375262816,0.7856890042867318,0.8541838700529854,0.9007874342519875,0.9324962663192309,0.9540707971163875,0.96875,0.9787376562472754,0.9855332076205111,0.9901568667976963,0.9933027813839603,0.9954432459391558,0.9968996073203746,0.9978905083224759,0.9985647124098871,1],
    inOut_exp: [0,0.0010547458387620175,0.002278377030422103,0.004921566601151844,0.010631171876362321,0.022964601441806228,0.049606282874006216,0.1071554978566341,0.23146867807182253,0.5,0.7685313219281775,0.892844502143366,0.9503937171259937,0.9770353985581938,0.9893688281236377,0.9950784333988482,0.9977216229695779,0.998945254161238,1],
    in_circle: [0,0.0015444024660317135,0.006192010000093506,0.013986702816730645,0.025003956956430873,0.03935464078941209,0.057190958417936644,0.07871533601238889,0.10419358352238339,0.1339745962155614,0.1685205807169019,0.20845517506805522,0.2546440075000701,0.3083389112228482,0.37146063894529113,0.4472292016074334,0.5418771527091488,0.6713289009389102,1],
    out_circle: [0,0.3286710990610898,0.45812284729085123,0.5527707983925666,0.6285393610547089,0.6916610887771518,0.7453559924999298,0.7915448249319448,0.8314794192830981,0.8660254037844386,0.8958064164776166,0.9212846639876111,0.9428090415820634,0.9606453592105879,0.9749960430435691,0.9860132971832694,0.9938079899999065,0.9984555975339683,1],
    inOut_circle: [0,0.003096005000046753,0.012501978478215436,0.028595479208968322,0.052096791761191696,0.08426029035845095,0.12732200375003505,0.18573031947264557,0.2709385763545744,0.5,0.7290614236454256,0.8142696805273546,0.8726779962499649,0.915739709641549,0.9479032082388084,0.9714045207910317,0.9874980215217846,0.9969039949999532,1],
    in_back_: [0,-0.004788556241426612,-0.017301289437585736,-0.0347587962962963,-0.05438167352537723,-0.07339051783264748,-0.08900592592592595,-0.09844849451303156,-0.0989388203017833,-0.08769750000000004,-0.06194513031550073,-0.018902307956104283,0.044210370370370254,0.13017230795610413,0.2417629080932785,0.3817615740740742,0.5529477091906719,0.7581007167352535,0.9999999999999998],
    out_back_: [2.220446049250313e-16,0.24189928326474652,0.44705229080932807,0.6182384259259258,0.7582370919067215,0.8698276920438959,0.9557896296296297,1.0189023079561044,1.0619451303155008,1.0876975,1.0989388203017834,1.0984484945130315,1.089005925925926,1.0733905178326475,1.0543816735253773,1.0347587962962963,1.0173012894375857,1.0047885562414267,1],
  };

  Object.keys(Samples).forEach(function(type) {
    it('should ease ' + type, function() {
      var [modeName, easingName, isFunction] = type.split('_');
      var easing = Easing[easingName];
      if (isFunction !== undefined) {
        easing = easing();
      }
      var computed = sampleEasingFunction(Easing[modeName](easing));
      var samples = Samples[type];

      computed.forEach((value, key) => {
        expect(value).toBeCloseTo(samples[key], 2);
      });
    });
  });
});
