/* 星盒屋 · 数据层：32 张图鉴卡、稀有度配置、默认愿望券 */
(function () {
  'use strict';

  var TIERS = {
    N:  { key: 'N',   name: '云朵', en: 'CLOUD', rate: 60, dust: 5,   color: '#9FC7E8', order: 0 },
    R:  { key: 'R',   name: '荧光', en: 'NEON',  rate: 28, dust: 15,  color: '#35F2E0', order: 1 },
    SR: { key: 'SR',  name: '电波', en: 'WAVE',  rate: 10, dust: 40,  color: '#C46BFF', order: 2 },
    SSR:{ key: 'SSR', name: '传说', en: 'LEGEND',rate: 2,  dust: 100, color: '#FFC93C', order: 3 }
  };

  var SERIES = [
    { id: 'cloud', name: '云朵朋友', tier: 'N', accent: '#9FC7E8', blurb: '软软的，抱起来会睡着' },
    { id: 'street', name: '街角小怪兽', tier: 'R', accent: '#35F2E0', blurb: '住在街角，有点吵但很可爱' },
    { id: 'wave', name: '电波乐队', tier: 'SR', accent: '#C46BFF', blurb: '一开演唱会，整条街都亮了' },
    { id: 'crown', name: '星冠家族', tier: 'SSR', accent: '#FFC93C', blurb: '他们的皇冠，是用星星做的' }
  ];

  var CARDS = [
    // 云朵朋友 N
    { id: 'n01', no: 1, name: '云团仔', tier: 'N', series: 'cloud', desc: '一生气就下雨，所以很少生气' },
    { id: 'n02', no: 2, name: '棉花糖猫', tier: 'N', series: 'cloud', desc: '走路会掉糖粉' },
    { id: 'n03', no: 3, name: '泡芙熊', tier: 'N', series: 'cloud', desc: '抱着蜂蜜罐不撒手' },
    { id: 'n04', no: 4, name: '呼噜兔', tier: 'N', series: 'cloud', desc: '耳朵垂下来当被子' },
    { id: 'n05', no: 5, name: '布丁狗', tier: 'N', series: 'cloud', desc: '紧张时会抖成布丁' },
    { id: 'n06', no: 6, name: '雪球企鹅', tier: 'N', series: 'cloud', desc: '围巾比身体还长' },
    { id: 'n07', no: 7, name: '麻薯羊', tier: 'N', series: 'cloud', desc: '羊毛可以拉很长' },
    { id: 'n08', no: 8, name: '小云鲸', tier: 'N', series: 'cloud', desc: '在云里游泳的鲸鱼' },
    // 街角小怪兽 R
    { id: 'r01', no: 9,  name: '涂鸦蜥', tier: 'R', series: 'street', desc: '身上每天换新涂鸦' },
    { id: 'r02', no: 10, name: '垃圾桶怪', tier: 'R', series: 'street', desc: '喜欢收集亮晶晶的瓶盖' },
    { id: 'r03', no: 11, name: '滑板龟', tier: 'R', series: 'street', desc: '壳上贴着滑板贴纸' },
    { id: 'r04', no: 12, name: '泡泡章鱼', tier: 'R', series: 'street', desc: '生气时喷泡泡' },
    { id: 'r05', no: 13, name: '电线猫', tier: 'R', series: 'street', desc: '尾巴是插头，充电时会发光' },
    { id: 'r06', no: 14, name: '口香糖怪', tier: 'R', series: 'street', desc: '被踩到会粘住鞋' },
    { id: 'r07', no: 15, name: '耳机刺猬', tier: 'R', series: 'street', desc: '走路自带 BGM' },
    { id: 'r08', no: 16, name: '影子狗', tier: 'R', series: 'street', desc: '只在路灯下出现' },
    // 电波乐队 SR
    { id: 'sr01', no: 17, name: '电吉他狐', tier: 'SR', series: 'wave', desc: '一弹琴尾巴就会放电' },
    { id: 'sr02', no: 18, name: '合成器蛙', tier: 'SR', series: 'wave', desc: '打碟时舌头会打结' },
    { id: 'sr03', no: 19, name: '鼓手浣熊', tier: 'SR', series: 'wave', desc: '用坚果壳当鼓槌' },
    { id: 'sr04', no: 20, name: '主唱星猫', tier: 'SR', series: 'wave', desc: '高音能把星星唱下来' },
    { id: 'sr05', no: 21, name: '贝斯兔', tier: 'SR', series: 'wave', desc: '只弹低音，说话也很低' },
    { id: 'sr06', no: 22, name: '音波水母', tier: 'SR', series: 'wave', desc: '触手是跳动的音轨' },
    { id: 'sr07', no: 23, name: '混音机器人', tier: 'SR', series: 'wave', desc: '头顶有音量旋钮' },
    { id: 'sr08', no: 24, name: '霓虹蝶', tier: 'SR', series: 'wave', desc: '翅膀是两根灯管' },
    // 星冠家族 SSR
    { id: 'ssr01', no: 25, name: '金冠星龙', tier: 'SSR', series: 'crown', desc: '把星星藏在耳朵里' },
    { id: 'ssr02', no: 26, name: '银河独角兽', tier: 'SSR', series: 'crown', desc: '鬃毛里流动着整条银河' },
    { id: 'ssr03', no: 27, name: '星冕狮', tier: 'SSR', series: 'crown', desc: '鬃毛是太阳做的' },
    { id: 'ssr04', no: 28, name: '月食猫头鹰', tier: 'SSR', series: 'crown', desc: '眼睛里有月食' },
    { id: 'ssr05', no: 29, name: '流星鹿', tier: 'SSR', series: 'crown', desc: '鹿角上挂着流星' },
    { id: 'ssr06', no: 30, name: '极光鲸', tier: 'SSR', series: 'crown', desc: '身体是极光做的' },
    { id: 'ssr07', no: 31, name: '日冕凤凰', tier: 'SSR', series: 'crown', desc: '掉一根羽毛就多一个愿望' },
    { id: 'ssr08', no: 32, name: '星王企鹅', tier: 'SSR', series: 'crown', desc: '披着星空斗篷' }
  ];

  var CARD_MAP = {};
  CARDS.forEach(function (c) { CARD_MAP[c.id] = c; });

  var DEFAULT_WISHES = [
    { tier: 'SR',  text: '多听一个睡前故事' },
    { tier: 'SR',  text: '一起烤一盘小饼干' },
    { tier: 'SR',  text: '自己挑一部动画片' },
    { tier: 'SSR', text: '去公园玩一整个下午' },
    { tier: 'SSR', text: '和爸爸妈妈做一次手工' },
    { tier: 'SSR', text: '自己点一顿想吃的饭' }
  ];

  // 皮肤：集齐系列后解锁
  var SKINS = {
    cloud:  { id: 'cloud',  name: '云朵涂装', series: 'cloud' },
    street: { id: 'street', name: '涂鸦涂装', series: 'street' },
    wave:   { id: 'beat',   name: '电波涂装', series: 'wave' },
    crown:  { id: 'star',   name: '星冠涂装', series: 'crown' }
  };

  window.SB = window.SB || {};
  window.SB.TIERS = TIERS;
  window.SB.SERIES = SERIES;
  window.SB.CARDS = CARDS;
  window.SB.CARD_MAP = CARD_MAP;
  window.SB.DEFAULT_WISHES = DEFAULT_WISHES;
  window.SB.SKINS = SKINS;
})();
