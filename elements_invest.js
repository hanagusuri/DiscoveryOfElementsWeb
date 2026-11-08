// 資金・知識の使い道: 研究所の拡張、産業技術(工程の改良の研究)、特許。ゲーム・管理画面・検証で共有する。
(function (_T, _rowOf, _D) {
  // 研究所の段階(資金と知識ポイントで、拡張する)
  _D.LAB_LV = [null,
    { name: "実験室", gold: 0, pt: 0, era: 1, ptm: 0, staff: 0, patents: 3, desc: "小さな実験室。助手が、数人働ける。" },
    { name: "研究棟", gold: 300, pt: 10, era: 2, ptm: 3, staff: 1, patents: 5, desc: "専用の建物と、書庫。毎月の研究で、知識+3。人員の上限+1。" },
    { name: "研究所", gold: 1500, pt: 30, era: 3, ptm: 8, staff: 2, patents: 7, desc: "分析室・図書室・工房を備える。毎月、知識+8。人員の上限+2。" },
    { name: "総合研究所", gold: 8000, pt: 80, era: 4, ptm: 16, staff: 3, patents: 9, desc: "多くの部門を持つ、企業の研究所。毎月、知識+16。人員の上限+3。" },
    { name: "先端研究センター", gold: 40000, pt: 200, era: 4, ptm: 30, staff: 5, patents: 12, desc: "最先端の設備と、大勢の研究者。毎月、知識+30。人員の上限+5。" },
  ];
  // 産業技術: 工場の効率を、全体として高める研究 (cap=生産量, cost=原料費の削減, yadd=歩留まり, price=売値, ovh=管理費の削減, dem=需要)
  _D.IND_TECHS = [
    { id: "parts", name: "規格化と分業", era: 1, gold: 60, pt: 4, fx: { cap: 0.10 }, desc: "道具や部品の規格を揃え、作業を分担する。生産量+10%。" },
    { id: "waterpower", name: "水車・風車の動力", era: 1, gold: 100, pt: 6, fx: { cost: 0.05 }, desc: "人力を、水と風の力で置き換える。原料・燃料費−5%。" },
    { id: "bookkeeping", name: "複式簿記", era: 2, gold: 150, pt: 8, fx: { ovh: 0.20 }, desc: "お金の流れを、正確に記録する。管理費−20%。" },
    { id: "guild", name: "同業組合と品質の保証", era: 2, gold: 250, pt: 12, fx: { price: 0.05 }, req: ["parts"], desc: "品質を保証して、信用を得る。売値+5%。" },
    { id: "steampower", name: "蒸気動力の工場", era: 3, gold: 800, pt: 25, fx: { cap: 0.20 }, req: ["waterpower"], desc: "蒸気機関で、工場の機械を動かす。生産量+20%。" },
    { id: "analysis", name: "分析化学による品質管理", era: 3, gold: 900, pt: 25, fx: { yadd: 0.03 }, desc: "製品を分析して、不良を減らす。歩留まり+3%。" },
    { id: "process", name: "連続プロセスと計測", era: 3, gold: 1500, pt: 35, fx: { cost: 0.08, yadd: 0.02 }, req: ["analysis"], desc: "温度や圧力を測りながら、連続で生産する。原料費−8%、歩留まり+2%。" },
    { id: "recycle", name: "副産物・未反応原料の再利用", era: 4, gold: 4000, pt: 60, fx: { cost: 0.10 }, req: ["process"], desc: "捨てていたものを、原料に使う。原料費−10%。" },
    { id: "automation", name: "自動制御とコンピュータ", era: 4, gold: 9000, pt: 90, fx: { cap: 0.25, ovh: 0.30 }, req: ["steampower", "process"], desc: "機械が、機械を制御する。生産量+25%、管理費−30%。" },
    { id: "global", name: "国際市場と広告", era: 4, gold: 12000, pt: 80, fx: { price: 0.08, dem: 0.20 }, req: ["guild"], desc: "世界に売る。売値+8%、需要+20%。" },
  ];
  // 特許: 製法の権利。毎月のライセンス収入と、自社工場の売値の上乗せ
  _D.PATENT = { royalty: 0.10, bonus: 0.15, payback: 12, desc: "毎月、需要×単価の10%のライセンス収入。自社の売値も+15%。取得費は、収入の約1年分。" };
  // 工程の改良(品目ごと): 最大3段階。原料費−8%/段階、歩留まり+3%/段階
  _D.IMPROVE = { max: 3, goldMul: 0.6, ptMul: 4 };
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
