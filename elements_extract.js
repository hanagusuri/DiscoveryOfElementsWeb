// 「合成」ではなく「抽出・精製・分離」のレシピ: 目的の物質は、材料に、もともと含まれていて、それを取り出す操作。
// key: レシピのキー / out: 取り出す物質 / from: もともと含まれている材料 / kind: 操作の種類 / how: 何をしているか
(function (_T, _rowOf, _D) {
  const E = (key, out, from, kind, how) => [key, { out, from, kind, how }];
  _D.EXTRACTS = Object.fromEntries([
    E("lime+sugar_cane+water", "sucrose", "sugar_cane", "精製", "石灰で不純物を沈めて、除き、きれいな汁を煮詰めて、結晶にする。"),
    E("fruit+lead_acetate", "malic_acid", "fruit", "抽出", "汁に含まれるリンゴ酸を、鉛の塩として、沈殿させて、分け取る。"),
    E("fruit+slaked_lime+sulfuric", "citric_acid", "fruit", "抽出", "汁のクエン酸を、石灰で沈殿させ、硫酸で、遊離させて、取り出す。"),
    E("alcohol+milk", "lactose", "milk", "分離", "タンパク質と脂肪を除いた液に、アルコールを加え、溶けにくい乳糖を、結晶にして、分ける。"),
    E("acetic_acid+milk", "casein", "milk", "分離", "酸で、溶けているタンパク質を、凝集させて、固めて、分ける。"),
    E("fat+fire+hcl", "gelatin", "fat", "抽出", "皮や骨のコラーゲンを、酸と熱で、溶かし出す。"),
    E("alcohol+fat+lye", "cholesterol", "fat", "抽出", "油脂を、石鹸にして除き、残る(けん化されない)コレステロールを、アルコールで、取り出す。"),
    E("alcohol+coffee_bean+water", "caffeine", "coffee_bean", "抽出", "豆に含まれるカフェインを、水とアルコールで、溶かし出す。"),
    E("alcohol+lye+tobacco_leaf", "nicotine", "tobacco_leaf", "抽出", "葉に含まれるニコチンを、アルカリで遊離させて、取り出す。"),
    E("alcohol+cinchona_bark+lye", "quinine", "cinchona_bark", "抽出", "樹皮に含まれるキニーネを、アルコールで、溶かし出す。"),
    E("alcohol+ammonia+opium_poppy", "morphine", "opium_poppy", "抽出", "アヘンに含まれるモルヒネを、アンモニアで、遊離させて、沈殿として、取り出す。"),
    E("alcohol+water+wood", "tannin", "wood", "抽出", "樹皮に含まれるタンニンを、水とアルコールで、溶かし出す。"),
    E("alembic+fire+pine_resin", "turpentine", "pine_resin", "蒸留", "松脂の、揮発しやすい成分を、蒸留で、分ける。"),
    E("fruit+hcl+water", "pectin", "fruit", "抽出", "果実の細胞壁に含まれるペクチンを、酸と熱で、溶かし出す。"),
    E("fire+kelp+water", "agar", "kelp", "抽出", "海藻に含まれる多糖類を、熱湯で、溶かし出す。"),
    E("grain+stone+water", "starch", "grain", "分離", "穀物を砕いて、水で洗い、沈む、デンプンの粒を、分ける。"),
    E("alcohol+kelp+water", "glutamic_acid", "kelp", "抽出", "昆布に含まれる、うま味の成分を、水に溶かし、アルコールで、結晶にして、取り出す。"),
    E("alcohol+grain+hcl", "thiamine", "grain", "抽出", "米ぬかに含まれるビタミンを、酸性のアルコールで、溶かし出す。"),
    E("indigo_plant+lye+water", "indigo", "indigo_plant", "抽出", "藍の葉の成分を、溶かし出して、空気に触れさせ、青い色素にする。"),
    E("alcohol+filter+fruit", "glucose", "fruit", "抽出", "果汁に含まれるブドウ糖を、アルコールで、結晶として、分ける。"),
    E("limestone+sulfuric+wine", "tartaric_acid", "wine", "抽出", "ワイン樽に付いた塩から、石灰で沈殿させ、硫酸で遊離させて、酒石酸を、取り出す。"),
    E("fat+hcl+lye", "oleic_acid", "fat", "分離", "油脂を石鹸にしてから、酸で、脂肪酸だけを、遊離させて、分ける。"),
    E("fire+lye+wood", "cellulose", "wood", "分離", "木材から、接着の役目をするリグニンを、アルカリで溶かし、繊維(セルロース)だけを、残す。"),
    E("kelp+sulfuric", "iodine", "kelp", "抽出", "海藻の灰に含まれる、ヨウ化物から、ヨウ素を、遊離させて、取り出す。"),
    E("chlorine+kelp", "iodine", "kelp", "抽出", "海藻の灰に含まれる、ヨウ化物から、塩素で、ヨウ素を、追い出して、取り出す。"),
    E("fire+pottery+seawater", "salt", "seawater", "分離", "海水を煮て、水を蒸発させ、溶けていた食塩を、結晶として、取り出す。"),
    E("ash+water", "lye", "ash", "抽出", "灰に含まれる、炭酸カリウムを、水に溶かし出す。"),
    E("alcohol+cell+hcl", "nucleic", "cell", "抽出", "細胞を壊して、核酸を溶かし出し、アルコールで、沈殿させて、取り出す。"),
  ]);
  _D.EXTRACT_VERB = { 抽出: "取り出した", 精製: "取り出した", 分離: "取り出した", 蒸留: "取り出した" };
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
