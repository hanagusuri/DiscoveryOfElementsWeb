// 蒸留: 沸点の差で混合物の成分を順に取り出す
(function (_T, _rowOf, _D) {
  // 旧来の「蒸留器に入れるだけ」のレシピを、温度管理による蒸留に置き換える
  const drop = (inp) => { const r = _rowOf(inp); _D.RECIPE_ROWS.splice(_D.RECIPE_ROWS.indexOf(r), 1); };
  drop(["wine", "alembic", "fire"]);
  drop(["petroleum", "alembic", "fire"]);
  drop(["liquid_air", "alembic", "fire"]);

  _D.ITEM_ROWS.push(
    ["distilled_water", "蒸留水", "💧", "compound", 2, "蒸留で得た、塩や不純物を含まない純粋な水。試薬の調製に欠かせない。", "古代 海水の淡水化"],
    ["heavy_oil", "重油", "🛢️", "material", 3, "石油を蒸留して得る、粘り気のある重い油。船や発電の燃料になる。", "19世紀"],
    ["asphalt", "アスファルト", "⬛", "material", 3, "石油を蒸留しても残る、黒くて粘りの強い残渣。道路や防水に使う。", "古代〜"],
    ["fractionating_column", "分留管", "🧪", "tool", 3, "ガラス玉を詰めた管。蒸気が何度も凝縮と蒸発を繰り返し、沸点の近い成分を分けられる。", "1874年 ル・ベル/ヘニンジェ"],
    ["rectification_column", "精留塔", "🏗️", "tool", 4, "多数の棚段を持つ塔。極低温でも、沸点がわずか数℃違う成分を分けられる。", "1902年 リンデ/ハウスブランド"],
    ["distillation", "蒸留", "⚗️", "concept", 2, "液体を加熱して蒸気を冷やすと、沸点の低い成分から順に分けて取り出せる。", "古代アレクサンドリア〜"],
    ["fractional_distillation", "分留", "🔬", "concept", 3, "温度を少しずつ上げ、沸点の違う成分を順番に取り分ける。石油精製や液体空気の分離の基本。", "19世紀〜"]
  );
  _D.FORMULAS.distilled_water = "H₂O";
  _D.HAZ_TAGS.heavy_oil = "F";
  _D.PHASE_ID.distilled_water = [0, 100];
  _D.RECIPE_ROWS.push(
    [["alembic", "glass", "glass_flask"], ["fractionating_column"], "蒸留器の首にガラス玉を詰めた管を立てると、蒸気が何度も凝縮と蒸発を繰り返すようになった。"],
    [["fractionating_column", "refrigerator", "iron"], ["rectification_column"], "冷却装置と鉄の棚段をもつ高い塔を組み上げた。極低温でもわずかな沸点差を見分けられる。"]
  );
  _D.SPECIAL_ITEMS.push("distillation", "fractional_distillation");

  // 混合物ごとの成分(沸点の低い順)。res=true は蒸発せず底に残るもの。
  _D.DIST = {
    wine: { start: 20, hint: "酒", comps: [
      { name: "エタノール", bp: 78, out: "alcohol", story: "ゆっくり温めると、水より先に『燃える液体』が蒸気となって上がり、冷やされて滴り落ちた。" },
      { name: "水", bp: 100, out: "distilled_water", story: "燃える液体が出尽くしたあと、温度を上げると、清らかな水が出てきた。" },
    ] },
    seawater: { start: 20, hint: "海水", comps: [
      { name: "水", bp: 100, out: "distilled_water", story: "海水を沸かして蒸気を冷やすと、塩気のない水が滴り落ちた。" },
      { name: "塩", res: true, out: "salt", story: "フラスコの底には、白い塩の結晶が残った。" },
    ] },
    petroleum: { start: 20, hint: "石油", comps: [
      { name: "軽い油(ガソリン)", bp: 110, out: "gasoline", story: "最初に、揮発しやすく、よく燃える軽い液体が出てきた。" },
      { name: "灯油", bp: 215, out: "kerosene", story: "温度を上げると、明かりの燃料になる、少し重い液体が出てきた。" },
      { name: "重油", bp: 300, out: "heavy_oil", story: "さらに熱すると、粘り気のある重い油が出てきた。" },
      { name: "アスファルト", res: true, out: "asphalt", story: "底には、黒くて粘りのある残渣だけが残った。" },
    ] },
    liquid_air: { start: -250, cold: true, hint: "液体空気", comps: [
      { name: "ネオン", bp: -246, out: "neon", story: "液体空気をごくゆっくり温めると、まず最も軽い気体が逃げ出した。管の中で、鮮やかな赤い光を放った。" },
      { name: "窒素", bp: -196, out: "nitrogen", story: "次に、空気の大半を占める、燃えない気体が沸き立った。" },
      { name: "アルゴン", bp: -186, out: "argon", story: "沸点がわずか数℃しか違わない二つを、慎重に分けて、不活性な気体が得られた。" },
      { name: "酸素", bp: -183, out: "oxygen", story: "青みがかった液体が沸いて、物を激しく燃やす気体が得られた。" },
      { name: "クリプトン", bp: -153, out: "krypton", story: "残った液体から、『隠された』気体が出てきた。" },
      { name: "キセノン", bp: -108, out: "xenon", story: "最後に残った重い気体が気化した。『見知らぬもの』だ。" },
    ] },
  };
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
