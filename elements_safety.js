// 実験の安全管理: 物質の危険性・安全器具・事故の種類
(function (_T, _rowOf, _D) {
  // ---- 物質ごとの危険性タグ ----
  // G:有毒ガス/蒸気 P:毒性(皮膚・経口・粉じん) F:可燃性 C:腐食性 R:激しく反応 X:爆発性 A:放射性 Y:自然発火性
  _D.HAZ_TAGS = {
    mercury: "GP", cinnabar: "P", hgo: "P", calomel: "P", arsenic: "GP", orpiment: "GP", antimony: "P", stibnite: "P",
    lead: "P", lead_oxide: "P", lead_acetate: "P", lead_white: "P", galena: "P", cadmium: "GP", thallium: "P", beryllium: "GP",
    tellurium: "P", selenium: "P", osmium: "G", chlorine: "GC", bromine: "GC", fluorine: "GCR", h2s: "GF", co: "GF", so2: "G",
    ammonia: "G", hcl: "GC", nitric: "GC", aqua_regia: "GC", sulfuric: "C", naoh: "C", koh: "C", lye: "C", slaked_lime: "C",
    lime: "R", silver_nitrate: "C", titanium_chloride: "GC", aluminium_chloride: "C", carbide: "R", acetylene: "FX",
    hydrogen: "F", alcohol: "F", kerosene: "F", gasoline: "F", petroleum: "F", sulfur: "F", phosphorus: "PYF",
    sodium: "RFY", potassium: "RFY", lithium: "RF", calcium: "RF", magnesium: "F", aluminium: "F", rubidium: "RFY", caesium: "RFY",
    strontium: "RF", barium: "RP", gunpowder: "FX", chlorate: "XP", ammonium_nitrate: "X", uranium_ore: "A", uranium: "APY",
    radium: "AP", polonium: "AP", radon: "AG", actinium: "A", francium: "A", thorium: "A", thorite: "A", protactinium: "A",
    technetium: "A", promethium: "A", astatine: "A", neptunium: "A", plutonium: "AP", americium: "A", curium: "A", berkelium: "A",
    californium: "A", einsteinium: "A", fermium: "A", mendelevium: "A", nobelium: "A", lawrencium: "A", rutherfordium: "A",
    dubnium: "A", seaborgium: "A", bohrium: "A", hassium: "A", meitnerium: "A", darmstadtium: "A", roentgenium: "A",
    copernicium: "A", nihonium: "A", flerovium: "A", moscovium: "A", livermorium: "A", tennessine: "A", oganesson: "A",
    titanium: "Y", zirconium: "Y", nitrogen: "", vanadium: "P", ammonium_chloride: "", radioactivity: "",
  };
  _D.EXO_PARTNERS = ["water", "steam", "hcl", "sulfuric", "nitric", "acetic_acid", "aqua_regia", "lye", "naoh", "koh", "soda_ash"];
  _D.ACIDS = ["sulfuric", "hcl", "nitric", "acetic_acid", "aqua_regia"];
  _D.BASES = ["lye", "naoh", "koh", "slaked_lime", "lime", "ammonia", "soda_ash"];
  _D.GAS_OUT = ["hydrogen", "oxygen", "co2", "chlorine", "ammonia", "nitrogen", "h2s", "so2", "acetylene", "co", "steam", "helium", "argon", "neon", "krypton", "xenon", "fluorine", "radon"];
  _D.HAZ_EXTRA = { // 並べ替えたレシピキー → 追加される危険
    "aluminium+fire+iron_ore": ["exo", "fire"], "aluminium+fire+pyrolusite": ["exo", "fire"], "aluminium+chromite+fire": ["exo", "fire"],
    "alembic+fire+wine": ["fire"], "fire+hydrogen+oxygen": ["expl"],
  };
  _D.BREAKABLE = ["glass_flask", "alembic", "pneumatic_trough", "eudiometer", "vacuum_pump", "thermometer", "filter", "mortar", "alcohol_lamp", "centrifuge", "vacuum_tube"];
  _D.SPECIAL_ITEMS = ["safety_first", "lesson_learned"];

  // ---- 危険の種類 ----
  // p: 対策なしで事故になる確率  sev: 重さ(1=軽微 2=中程度 3=重大)
  _D.HAZ_KINDS = {
    gas: { icon: "☠️", name: "有毒ガス", p: 0.6, sev: 2,
      title: "有毒ガスを吸い込んだ", cause: "発生した有毒な気体や蒸気が部屋に広がった。",
      lesson: "窓を開けるか、ドラフトチャンバーの中で実験し、防毒マスクを着けよう。",
      hist: "シェーレは水銀・鉛・ヒ素・フッ化水素などを扱う中で健康を損ない、43歳で亡くなった。有毒物質の気体の危険を知らないまま研究した化学者は数多い。" },
    poison: { icon: "💀", name: "中毒", p: 0.45, sev: 1,
      title: "有毒物質で中毒になった", cause: "素手や粉じんから、毒性のある物質を体に取り込んだ。",
      lesson: "手袋とマスクを着け、換気しながら扱おう。",
      hist: "水銀を使う帽子職人の中毒は『マッド・ハッター』の由来とされ、鉛白を扱う職人や画家も鉛中毒に苦しんだ。" },
    fire: { icon: "🔥", name: "引火・火災", p: 0.5, sev: 2,
      title: "引火して火災になった", cause: "可燃性の気体や蒸気が火に触れて燃え上がった。",
      lesson: "点火する前に空気を追い出し、防火用の砂やバケツを備えておこう。",
      hist: "水素は軽くて燃えやすく、空気と混じると爆鳴気になる。初期の化学者は、小さな火花で何度も実験室を焦がした。" },
    exo: { icon: "💥", name: "激しい発熱・飛散", p: 0.6, sev: 2,
      title: "激しい反応で内容物が飛び散った", cause: "一度に混ぜたため、反応熱で液が沸騰し、飛び散った。",
      lesson: "少しずつ加えて、熱を逃がしながら進めよう。保護眼鏡も忘れずに。",
      hist: "『水に酸を少しずつ加えよ。酸に水を注ぐな』。濃硫酸の希釈や、アルカリ金属と水の反応で、多くの化学者が目や皮膚を傷めた。" },
    expl: { icon: "🧨", name: "爆発", p: 0.55, sev: 3,
      title: "爆発した", cause: "爆発性のある物質が、熱や衝撃で急激に反応した。",
      lesson: "防爆板を置き、少量から、ゆっくり進めよう。",
      hist: "1788年、ベルトレの塩素酸塩火薬の製造所で爆発が起き、犠牲者が出た。ノーベルの弟エミールも、ニトログリセリンの爆発で亡くなった。ブンゼンも爆発で片目の視力を失った。" },
    corr: { icon: "🧪", name: "薬傷(腐食)", p: 0.5, sev: 1,
      title: "薬品で皮膚や目を傷めた", cause: "強い酸やアルカリが、皮膚や目に触れた。",
      lesson: "保護眼鏡と耐薬手袋を着けて扱おう。",
      hist: "デービーは窒素三塩化物の爆発で目を傷めた。ファラデーも同じ実験で負傷した。化学者の手の傷は、勲章でもあり警告でもあった。" },
    rad: { icon: "☢️", name: "被曝", p: 0.5, sev: 2,
      title: "放射線を浴びた", cause: "放射性物質を遮蔽なしで扱った。",
      lesson: "鉛で遮蔽しよう。放射能の危険は、目に見えない。",
      hist: "マリー・キュリーは放射線障害で亡くなったとされる。彼女のノートは今も放射能を帯びており、鉛の箱で保管されている。ラジウム・ガールズの悲劇もあった。" },
    pyro: { icon: "🔆", name: "自然発火", p: 0.55, sev: 2,
      title: "取り出した瞬間に自然発火した", cause: "熱いまま空気に触れさせ、金属などが発火した。",
      lesson: "十分に冷めてから開けよう。",
      hist: "白リンはマッチ工場の職人に壊死(フォッシー・ジョー)をもたらし、自然発火で火災も起こした。アルカリ金属も空気中で燃える。" },
    pressure: { icon: "🛢️", name: "容器の破裂", p: 0.7, sev: 3,
      title: "容器が破裂した", cause: "ガスの出る反応を完全に密閉したため、圧力が上がりすぎた。",
      lesson: "排気管をつけるか、高圧に耐える容器を使おう。",
      hist: "1679年、パパンは圧力鍋に安全弁を付けた。それは、密閉容器の爆発を何度も見た末の発明だった。" },
    thermal: { icon: "🌡️", name: "熱衝撃での破損", p: 0.4, sev: 1,
      title: "急加熱で容器が割れた", cause: "ガラスや陶器を急に高温にしたため、ひびが入って割れた。",
      lesson: "ゆっくり昇温しよう。",
      hist: "ガラス器具は急激な温度変化で割れる。ガラス職人も化学者も、徐冷の技を長い経験から学んだ。" },
    vacuum: { icon: "🫧", name: "真空管の内破", p: 0.35, sev: 2,
      title: "ガラス管が内破した", cause: "真空にしたガラス管が外圧で砕け、破片が飛び散った。",
      lesson: "保護眼鏡を着け、防爆板の陰で作業しよう。",
      hist: "真空装置は、外から大気圧に押される。ガラスの内破で目を負傷した実験者は少なくない。" },
  };

  // ---- 安全器具と概念 ----
  _D.ITEM_ROWS.push(
    ["goggles", "保護眼鏡", "🥽", "tool", 3, "飛び散った薬品や破片から目を守る。", "19世紀〜"],
    ["gloves", "耐薬手袋", "🧤", "tool", 2, "鞣した革の手袋。薬品や熱から手を守る。", "古代〜"],
    ["respirator", "防毒マスク", "😷", "tool", 4, "炭のフィルターで有毒ガスを吸い取る。", "1915年 ゼリンスキー(活性炭)"],
    ["fume_hood", "ドラフトチャンバー", "🌀", "tool", 3, "有毒ガスを外へ吸い出す、ガラス張りの囲い。", "19世紀"],
    ["blast_shield", "防爆板", "🛡️", "tool", 3, "爆発や破片から身を守る厚い板。", "19世紀"],
    ["lead_shield", "鉛遮蔽", "🧱", "tool", 4, "放射線を遮る鉛の壁と容器。", "1900年代"],
    ["fire_bucket", "防火バケツ", "🪣", "tool", 2, "砂と水を備えた消火用具。小さな火は、広がる前に消す。", "古代〜"],
    ["safety_first", "安全第一", "⛑️", "concept", 3, "危険な実験を、正しい手順と装備で無事に成功させた。安全は、発見の前提だ。", "実験の心得"],
    ["lesson_learned", "失敗の教訓", "📓", "concept", 3, "事故の原因を書き留め、同じ失敗を繰り返さない。実験ノートの習慣が生まれた。", "実験の心得"]
  );
  _D.RECIPE_ROWS.push(
    [["glass", "fat"], ["goggles"], "ガラスを革の枠にはめて、目を覆う道具を作った。"],
    [["fat", "ash", "water"], ["gloves"], "獣皮を灰汁につけて鞣すと、柔らかく丈夫な革になった。手を覆う袋にした。"],
    [["charcoal", "filter", "fat"], ["respirator"], "革の面に、細かい炭を詰めたろ過層を付けると、刺激臭が和らいだ。"],
    [["glass", "iron", "bellows"], ["fume_hood"], "ガラス張りの囲いの中に、ふいごで煙を吸い出す仕掛けを作った。"],
    [["iron", "glass", "stone"], ["blast_shield"], "鉄枠に厚いガラスを嵌め、石の台に立てた。破片を防げそうだ。"],
    [["lead", "iron"], ["lead_shield"], "鉄の箱に鉛を貼ると、中の物質から出る危険な光線が弱まった。"],
    [["sand", "pottery", "water"], ["fire_bucket"], "砂と水を壺に用意すると、いざというとき消火できる。"]
  );
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
