// 研究所のメンバー(専門分野)と、災害・不況への備え(保険・備蓄・予備費)。ゲーム・管理画面・検証で共有する。
(function (_T, _rowOf, _D) {
  // ---- 研究所のメンバー: 1人ずつ、専門分野と固有の能力を持つ ----
  // fx: sp{業界:売値+x} sc{業界:原料費-x} cap(生産量) yadd(歩留まり) ovh(管理費-x) ptm(毎月の知識) safety(事故の確率-x) disc(発見の謝礼+x) pdisc(特許費-x) imp(工程改良費-x) disaster(災害の被害-x) premium(保険料-x)
  _D.MEMBER_SLOTS = [0, 2, 3, 4, 6, 8]; // 研究所の段階ごとの、メンバーの枠
  _D.MEMBERS = [
    { id: "m_smith", name: "冶金の親方", emoji: "⚒️", field: "冶金", era: 1, gold: 80, pt: 3, salary: 12, fx: { sc: { metal: 0.10 }, sp: { metal: 0.08 } }, desc: "金属の扱いに長けた職人頭。建設・金属の原料費−10%、売値+8%。" },
    { id: "m_potter", name: "窯業の名工", emoji: "🏺", field: "窯業", era: 1, gold: 80, pt: 3, salary: 12, fx: { sc: { ceram: 0.10 }, sp: { ceram: 0.10 } }, desc: "窯の火加減を知り尽くした名工。窯業・ガラスの原料費−10%、売値+10%。" },
    { id: "m_alchemist", name: "錬金術師", emoji: "⚗️", field: "錬金術", era: 2, gold: 150, pt: 6, salary: 20, fx: { disc: 0.5, ptm: 1 }, desc: "何でも試してみる実験家。発見の謝礼+50%、毎月の知識+1。" },
    { id: "m_pharma", name: "薬学者", emoji: "💊", field: "薬学", era: 2, gold: 200, pt: 8, salary: 28, fx: { sp: { med: 0.12 }, sc: { med: 0.10 } }, desc: "薬草と薬の専門家。医薬・衛生の売値+12%、原料費−10%。" },
    { id: "m_inorg", name: "無機化学者", emoji: "🧂", field: "無機化学", era: 3, gold: 500, pt: 15, salary: 55, fx: { sc: { chem: 0.08 }, yadd: 0.01 }, desc: "酸・塩基・塩の専門家。化学工業の原料費−8%、歩留まり+1%。" },
    { id: "m_organic", name: "有機化学者", emoji: "🧬", field: "有機化学", era: 3, gold: 600, pt: 18, salary: 65, fx: { sp: { chem: 0.08, agri: 0.05 }, pdisc: 0.20 }, desc: "炭素化合物の専門家。化学工業の売値+8%、農業・食品+5%、特許の取得費−20%。" },
    { id: "m_analyst", name: "分析化学者", emoji: "🔬", field: "分析化学", era: 3, gold: 500, pt: 15, salary: 55, fx: { yadd: 0.02, safety: 0.25, ptm: 2 }, desc: "成分を、正確に量る専門家。歩留まり+2%、事故の確率−25%、毎月の知識+2。" },
    { id: "m_electro", name: "電気化学者", emoji: "🔋", field: "電気化学", era: 3, gold: 600, pt: 18, salary: 65, fx: { sp: { elec: 0.12 }, sc: { elec: 0.08, fuel: 0.08 } }, desc: "電池・電気分解の専門家。電子・精密の売値+12%、原料費−8%、燃料も−8%。" },
    { id: "m_safety", name: "安全衛生の専門家", emoji: "⛑️", field: "安全管理", era: 3, gold: 450, pt: 12, salary: 50, fx: { safety: 0.40, disaster: 0.20 }, desc: "事故を未然に防ぐ。事故の確率−40%、災害の被害−20%。" },
    { id: "m_actuary", name: "経営・保険数理の専門家", emoji: "📊", field: "経営", era: 3, gold: 500, pt: 12, salary: 60, fx: { premium: 0.25, ovh: 0.10 }, desc: "リスクを数字で測る。保険料−25%、管理費−10%。" },
    { id: "m_catalyst", name: "触媒化学者", emoji: "🧲", field: "触媒", era: 4, need: "catalyst", gold: 1500, pt: 40, salary: 130, fx: { yadd: 0.03, imp: 0.30 }, desc: "触媒の専門家。歩留まり+3%、工程の改良費−30%。" },
    { id: "m_chemeng", name: "化学工学者", emoji: "🏗️", field: "化学工学", era: 4, gold: 1800, pt: 45, salary: 150, fx: { cap: 0.10, ovh: 0.10 }, desc: "大規模な装置の設計者。生産量+10%、管理費−10%。" },
    { id: "m_materials", name: "材料科学者", emoji: "💎", field: "材料科学", era: 4, gold: 2000, pt: 50, salary: 160, fx: { sp: { elec: 0.08, metal: 0.08, ceram: 0.08 } }, desc: "新素材の専門家。電子・金属・窯業の売値+8%。" },
    { id: "m_nuclear", name: "原子物理学者", emoji: "☢️", field: "原子核物理", era: 4, need: "radioactivity", gold: 2500, pt: 60, salary: 200, fx: { sp: { fuel: 0.15, med: 0.08 }, ptm: 3 }, desc: "原子核の専門家。燃料・エネルギーの売値+15%、医薬+8%、毎月の知識+3。" },
    { id: "m_biochem", name: "生化学者", emoji: "🧫", field: "生化学", era: 4, gold: 2200, pt: 55, salary: 180, fx: { sp: { med: 0.10, agri: 0.10 } }, desc: "生命の分子の専門家。医薬の売値+10%、農業・食品+10%。" },
  ];
  // ---- 災害・不況のイベント(毎月、確率で起こる) ----
  // type: disaster(工場の被害) / effect(数か月続く、売値・需要・原料費・生産量の変化)。 sev=被害の割合 scope=被害を受ける工場の割合
  _D.EVENTS = [
    { id: "quake", name: "大地震", emoji: "🌋", p: 0.006, era: 1, type: "disaster", sev: 0.35, scope: 1, desc: "揺れで、すべての工場が、被害を受けた。" },
    { id: "flood", name: "洪水", emoji: "🌊", p: 0.010, era: 1, type: "disaster", sev: 0.40, scope: 0.4, desc: "川が氾濫し、一部の工場が、水に浸かった。" },
    { id: "fire", name: "工場火災", emoji: "🔥", p: 0.014, era: 1, type: "disaster", sev: 0.55, scope: "one", desc: "1つの工場から、火が出て、焼けた。" },
    { id: "shortage", name: "原料の高騰", emoji: "📈", p: 0.020, era: 1, type: "effect", months: 3, fx: { cost: 0.30 }, desc: "原料が不足して、値上がりしている(原料費+30%)。備蓄があると、抑えられる。" },
    { id: "boom", name: "好景気", emoji: "🎉", p: 0.020, era: 2, type: "effect", months: 4, fx: { price: 0.12 }, desc: "景気がよく、よく売れる(売値+12%)。" },
    { id: "recession", name: "不況", emoji: "📉", p: 0.015, era: 2, type: "effect", months: 4, fx: { price: -0.20, dem: -0.15 }, desc: "景気が冷え込み、売れ行きが落ちた(売値−20%、需要−15%)。" },
    { id: "war", name: "戦争", emoji: "⚔️", p: 0.008, era: 2, type: "effect", months: 8, fx: { sp: { mil: 0.50, metal: 0.25, fuel: 0.20, med: 0.15 }, price: -0.08 }, desc: "戦争が始まり、軍需・金属・燃料の需要が急増したが、ほかは落ち込んだ。" },
    { id: "strike", name: "労働争議", emoji: "✊", p: 0.008, era: 3, type: "effect", months: 2, fx: { cap: -0.30 }, desc: "工場で、労働争議が起こり、生産が落ちた(生産量−30%)。" },
    { id: "regulation", name: "環境規制の強化", emoji: "🌱", p: 0.010, era: 3, type: "effect", months: 12, fx: { sc: { chem: -0.15, fuel: -0.15 } }, desc: "公害対策が義務づけられ、化学工業・燃料の費用が増えた(原料費+15%)。" },
    { id: "panic", name: "金融恐慌", emoji: "💥", p: 0.004, era: 3, type: "effect", months: 6, fx: { dem: -0.35, price: -0.10 }, desc: "恐慌で、世界中の取引が冷え込んだ(需要−35%、売値−10%)。" },
  ];
  // ---- 備え ----
  // 保険: 災害・事故の損失の一部を、補償する。保険料は、工場の建設費の合計に対する割合(毎月)
  _D.INSURANCE = [{ name: "未加入", cover: 0, rate: 0 }, { name: "火災保険", cover: 0.40, rate: 0.0012, era: 1, gold: 0 }, { name: "総合保険", cover: 0.70, rate: 0.0025, era: 2, gold: 0 }, { name: "全災害保険", cover: 0.90, rate: 0.0042, era: 3, gold: 0 }];
  // 備蓄: 原料の備蓄。原料の高騰の影響を、減らす(一度の費用+毎月の保管費)
  _D.STOCK = [{ name: "なし", mit: 0, gold: 0, up: 0 }, { name: "小さな倉庫", mit: 0.40, gold: 200, up: 8, era: 1 }, { name: "大きな倉庫", mit: 0.70, gold: 900, up: 25, era: 2 }, { name: "戦略備蓄", mit: 0.90, gold: 4000, up: 80, era: 3 }];
  // 予備費: 黒字の一定割合を、積み立てる。赤字の月に、使う
  _D.RESERVE = [0, 0.10, 0.20, 0.35];
  // 防災・リスク管理の産業技術
  _D.IND_TECHS.push(
    { id: "firebreak", name: "耐火・耐震の設計", era: 2, gold: 300, pt: 10, fx: { disaster: 0.30 }, desc: "石造り・防火壁・免震。災害の被害−30%。" },
    { id: "actuarial", name: "保険数理とリスク管理", era: 3, gold: 1000, pt: 25, fx: { premium: 0.30 }, req: ["bookkeeping"], desc: "確率で、危険を測る。保険料−30%。" },
    { id: "inventory", name: "在庫・調達の管理", era: 3, gold: 1200, pt: 25, fx: { stock: 0.30 }, req: ["bookkeeping"], desc: "原料を、複数の産地から、買い付ける。原料高騰の影響−30%。" },
    { id: "ergonomics", name: "安全工学", era: 4, gold: 3500, pt: 50, fx: { safety: 0.30, disaster: 0.15 }, req: ["firebreak"], desc: "設計の段階から、事故を防ぐ。事故の確率−30%、災害の被害−15%。" }
  );
})(...(typeof module !== "undefined" ? (() => { const h = require("./elements_extra.js"); return [h._T, h._rowOf, h._D]; })() : [_T, _rowOf, _D]));
