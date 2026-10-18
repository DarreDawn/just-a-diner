const plate = '<ellipse cx="160" cy="166" rx="127" ry="29" fill="#b03925" opacity=".12"/><ellipse cx="160" cy="153" rx="130" ry="40" fill="#fffdf2" stroke="#ab3026" stroke-width="2.5"/><ellipse cx="160" cy="151" rx="106" ry="27" fill="none" stroke="#ab3026" stroke-width="1.5"/>';
const eyes = '<g fill="none" stroke="#332c24" stroke-width="3" stroke-linecap="round"><path d="M145 113v6m28-6v6m-25 15h19"/></g>';
const doodles = {
 pudding:'<path d="M114 76h92l17 72q-62 27-124 0Z" fill="#d5d1bb" stroke="#493e31" stroke-width="2.5"/><ellipse cx="160" cy="76" rx="46" ry="15" fill="#b5b9a7" stroke="#493e31" stroke-width="2.5"/><path d="m135 82 10 18-7 20 13 26m30-58-8 14 5 13" fill="none" stroke="#858c77" stroke-width="2"/><path d="M155 62q-12-23 4-28m0 0q18 9 15 25" fill="none" stroke="#aa3428" stroke-width="3"/>',
 cake:'<path d="m105 84 61-40 62 47v58l-123 12Z" fill="#b68b67" stroke="#493e31" stroke-width="2.5"/><path d="m105 101 123 8v17l-123-7Z" fill="#fff1b6" stroke="#493e31" stroke-width="2"/><path d="m105 84 61-40 62 47-65 18Z" fill="#fff3cb" stroke="#493e31" stroke-width="2.5"/><path d="m134 69 31-18 39 29" stroke="#9c5945" stroke-width="5" stroke-dasharray="3 4" fill="none"/>',
 egg:'<path d="M95 145q-1-57 65-64 61 3 66 65Z" fill="#f2dab0" stroke="#493e31" stroke-width="2.5"/><path d="M111 115q-24-29 10-36-4-31 29-21 26-24 43 8 40-3 32 29 20 23-15 30-24 18-43 1-35 13-56-11Z" fill="#fffef0" stroke="#493e31" stroke-width="2.5"/><ellipse cx="163" cy="86" rx="25" ry="20" fill="#efad32" stroke="#493e31" stroke-width="2"/><path d="m108 140 8-3m75 0 9 4m-74-3 5 7" stroke="#a88e61" stroke-width="2"/>',
 noodles:'<path d="M90 112q70 102 140 0Z" fill="#c6422e" stroke="#493e31" stroke-width="2.5"/><ellipse cx="160" cy="112" rx="70" ry="20" fill="#f5d28c" stroke="#493e31" stroke-width="2.5"/><path d="M110 108q12-25 27-4t28-5 26 0 20 8m-91 7q13-26 28-2t30-6 29 5m-67-6q-19-54 11-66m-1 66q-19-48 10-63" fill="none" stroke="#b58231" stroke-width="4" stroke-linecap="round"/><path d="m125 51 101-26m-95 34 103-22" stroke="#493e31" stroke-width="4"/>',
 jelly:'<path d="M113 83q47-26 94 0l19 65q-66 24-132 0Z" fill="#b8c6a3" stroke="#493e31" stroke-width="2.5"/><ellipse cx="160" cy="83" rx="47" ry="15" fill="#d2dfbf" stroke="#493e31" stroke-width="2.5"/><path d="m121 102-7 29m82-26 6 28" stroke="#eaf0d9" stroke-width="6" stroke-linecap="round"/><path d="M149 60q17-28 32-18-5 17-27 22" fill="#779360" stroke="#493e31" stroke-width="2"/>',
 soup:'<path d="M87 104q10 68 73 68t73-68" fill="#e9b54f" stroke="#493e31" stroke-width="2.5"/><ellipse cx="160" cy="104" rx="73" ry="24" fill="#c27748" stroke="#493e31" stroke-width="2.5"/><path d="M111 102q14-10 29 0t32 0 34 0" fill="none" stroke="#f5d9a2" stroke-width="3"/><path d="M121 78q-15-15 0-30m35 26q-15-15 0-30m38 36q-15-15 0-30" fill="none" stroke="#aaa18a" stroke-width="2.5" stroke-linecap="round"/>'
};
export const menu = [
 {name:'水泥布丁',en:'CONCRETE PUDDING',type:'pudding',desc:'口感扎实。建议用挖掘机食用。',tag:'建筑系甜品'},
 {name:'失忆提拉米苏',en:'AMNESIA TIRAMISU',type:'cake',desc:'吃过的人都说：我吃过吗？',tag:'主厨忘了推荐'},
 {name:'星期八煎蛋饭',en:'EIGHTH-DAY EGG RICE',type:'egg',desc:'只在星期八供应。今天破例。',tag:'日历外限定'},
 {name:'薛定谔的意面',en:'SCHRÖDINGER’S PASTA',type:'noodles',desc:'打开锅盖前，它也可能是耳机线。',tag:'量子后厨出品'},
 {name:'薄荷味盆栽冻',en:'POTTED MINT JELLY',type:'jelly',desc:'可以吃。不用浇水。也不用跟它聊天。',tag:'园艺部外借'},
 {name:'外星人洗澡汤',en:'ALIEN BATH SOUP',type:'soup',desc:'外星人已捞出。请放心想象。',tag:'银河系微辣'},
 {name:'礼貌拒绝舒芙蕾',en:'NO-THANK-YOU SOUFFLÉ',type:'cake',desc:'它膨胀了，但没有接受你的邀请。',tag:'社交能量为零'},
 {name:'穿袜子的荷包蛋',en:'EGG IN SOCKS',type:'egg',desc:'两只袜子都不配对。蛋本人不在乎。',tag:'早餐界怪人'},
 {name:'周一浓缩布丁',en:'MONDAY CONCENTRATE',type:'pudding',desc:'把五个周一压成一小块。很难下咽。',tag:'苦味不另收费'},
 {name:'迷路的乌冬面',en:'LOST UDON',type:'noodles',desc:'本来要去隔壁。来都来了。',tag:'导航信号弱'},
 {name:'透明西兰花冻',en:'INVISIBLE BROCCOLI',type:'jelly',desc:'西兰花已隐身，营养也没承诺在场。',tag:'蔬菜伪装术'},
 {name:'一碗问号浓汤',en:'QUESTION-MARK SOUP',type:'soup',desc:'配料：嗯？啊？以及少许什么东西。',tag:'配方保密，主厨也不懂'}
];
export class DishPicker {
 constructor(random = Math.random){this.random=random;this.recent=[];}
 next(){const available=menu.filter(d=>!this.recent.includes(d.name));const dish=available[Math.floor(this.random()*available.length)];this.recent.push(dish.name);if(this.recent.length>4)this.recent.shift();return dish;}
}
export function dishSvg(dish){return `<svg viewBox="0 0 320 205" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${plate}${doodles[dish.type]}${eyes}<g fill="none" stroke="#ac392a" stroke-width="2"><path d="M58 64v12m-6-6h12m193-22v10m-5-5h10"/><path d="m256 100 8 3-5 6"/></g></svg>`;}
