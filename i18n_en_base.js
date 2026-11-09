// 英語の辞書: 基本データ(時代・温度・元素名・周期表の分類)と、fx.js(音と演出の設定)
I18N.elNames = {
  H: "Hydrogen", He: "Helium", Li: "Lithium", Be: "Beryllium", B: "Boron", C: "Carbon", N: "Nitrogen", O: "Oxygen", F: "Fluorine", Ne: "Neon",
  Na: "Sodium", Mg: "Magnesium", Al: "Aluminum", Si: "Silicon", P: "Phosphorus", S: "Sulfur", Cl: "Chlorine", Ar: "Argon",
  K: "Potassium", Ca: "Calcium", Sc: "Scandium", Ti: "Titanium", V: "Vanadium", Cr: "Chromium", Mn: "Manganese", Fe: "Iron", Co: "Cobalt", Ni: "Nickel", Cu: "Copper", Zn: "Zinc",
  Ga: "Gallium", Ge: "Germanium", As: "Arsenic", Se: "Selenium", Br: "Bromine", Kr: "Krypton",
  Rb: "Rubidium", Sr: "Strontium", Y: "Yttrium", Zr: "Zirconium", Nb: "Niobium", Mo: "Molybdenum", Tc: "Technetium", Ru: "Ruthenium", Rh: "Rhodium", Pd: "Palladium", Ag: "Silver", Cd: "Cadmium", In: "Indium", Sn: "Tin", Sb: "Antimony", Te: "Tellurium", I: "Iodine", Xe: "Xenon",
  Cs: "Cesium", Ba: "Barium", La: "Lanthanum", Ce: "Cerium", Pr: "Praseodymium", Nd: "Neodymium", Pm: "Promethium", Sm: "Samarium", Eu: "Europium", Gd: "Gadolinium", Tb: "Terbium", Dy: "Dysprosium", Ho: "Holmium", Er: "Erbium", Tm: "Thulium", Yb: "Ytterbium", Lu: "Lutetium",
  Hf: "Hafnium", Ta: "Tantalum", W: "Tungsten", Re: "Rhenium", Os: "Osmium", Ir: "Iridium", Pt: "Platinum", Au: "Gold", Hg: "Mercury", Tl: "Thallium", Pb: "Lead", Bi: "Bismuth", Po: "Polonium", At: "Astatine", Rn: "Radon",
  Fr: "Francium", Ra: "Radium", Ac: "Actinium", Th: "Thorium", Pa: "Protactinium", U: "Uranium", Np: "Neptunium", Pu: "Plutonium", Am: "Americium", Cm: "Curium", Bk: "Berkelium", Cf: "Californium", Es: "Einsteinium", Fm: "Fermium", Md: "Mendelevium", No: "Nobelium", Lr: "Lawrencium",
  Rf: "Rutherfordium", Db: "Dubnium", Sg: "Seaborgium", Bh: "Bohrium", Hs: "Hassium", Mt: "Meitnerium", Ds: "Darmstadtium", Rg: "Roentgenium", Cn: "Copernicium", Nh: "Nihonium", Fl: "Flerovium", Mc: "Moscovium", Lv: "Livermorium", Ts: "Tennessine", Og: "Oganesson",
};
I18N.add({
  // ---- 時代 ----
  "古代": "Antiquity", "火と水の発見": "The discovery of fire and water",
  "錬金術の時代": "The Age of Alchemy", "蒸留と酸の探究": "Distillation and the quest for acids",
  "近代化学": "Modern Chemistry", "気体・原子・電気": "Gases, atoms and electricity",
  "現代科学": "Contemporary Science", "生命と物理工学": "Life, physics and engineering",
  // ---- 温度 ----
  "弱火": "Low", "中火": "Medium", "強火": "High", "炉": "Furnace", "電気アーク": "Electric arc",
  "〜100℃": "to 100℃", "〜400℃": "to 400℃", "〜800℃": "to 800℃", "〜1500℃": "to 1500℃", "3000℃〜": "3000℃+",
  // ---- 周期表 ----
  "アルカリ金属": "Alkali metal", "アルカリ土類": "Alkaline earth", "遷移金属": "Transition metal", "ポスト遷移金属": "Post-transition metal", "半金属": "Metalloid",
  "非金属": "Nonmetal", "ハロゲン": "Halogen", "貴ガス": "Noble gas", "ランタノイド": "Lanthanide", "アクチノイド": "Actinide", "性質不明": "Unknown properties",
  "エカホウ素": "eka-boron", "エカアルミニウム": "eka-aluminum", "エカケイ素": "eka-silicon",
  // ---- fx.js ----
  [`<div class="fxbox"><div class="stt">🔊 音と演出</div>`]: `<div class="fxbox"><div class="stt">🔊 Sound & effects</div>`,
  [`<label class="fxrow"><input type="checkbox" id="fxSnd" {0}> 効果音</label>`]: `<label class="fxrow"><input type="checkbox" id="fxSnd" {0}> Sound effects</label>`,
  [`<label class="fxrow"><span>音量</span><input type="range" id="fxVol" min="0" max="1" step="0.05" value="{0}"></label>`]: `<label class="fxrow"><span>Volume</span><input type="range" id="fxVol" min="0" max="1" step="0.05" value="{0}"></label>`,
  [`<label class="fxrow"><input type="checkbox" id="fxVib" {0}> 振動(対応する端末)</label>`]: `<label class="fxrow"><input type="checkbox" id="fxVib" {0}> Vibration (supported devices)</label>`,
  [`<label class="fxrow"><input type="checkbox" id="fxVis" {0}> 演出(紙吹雪・揺れ・フラッシュ)</label>`]: `<label class="fxrow"><input type="checkbox" id="fxVis" {0}> Visual effects (confetti, shaking, flashes)</label>`,
  [`<button id="fxTest" class="mini">テスト音</button></div>`]: `<button id="fxTest" class="mini">Test sound</button></div>`,
  // ---- 産業(追加分) ----
  " ／ 研究 +{0}pt": " / research +{0}pt",
  // ---- 基本の素材(アイテム名。UIの $t("火") などと一致させる) ----
  "火": "Fire", "電気": "Electricity",
});
