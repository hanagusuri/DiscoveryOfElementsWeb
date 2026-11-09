// 英語の辞書: 由来(note)。「1774年 プリーストリー/シェーレ」のような文を、語の辞書+年代の書式で、英語にする。
// 原文(日本語)は、年代の判定(historyui)が使うので、データは書き換えず、表示のときだけ I18N.note() で訳す。
(function () {
  const N = {
    // ---- 時代・出来事の語 ----
    "約1万年前〜": "from ~10,000 years ago", "約1万年前": "~10,000 years ago", "先史時代": "Prehistory", "水の気体状態": "The gaseous state of water", "蒸留の原理の出発点": "Starting point of the principle of distillation",
    "古代の洗剤": "Ancient detergent", "古代から交易品": "Traded since antiquity", "古代アレクサンドリア〜イスラム錬金術": "Ancient Alexandria to Islamic alchemy", "古代アレクサンドリア〜": "From ancient Alexandria on",
    "古代ローマ": "Ancient Rome", "古代メソポタミア": "Ancient Mesopotamia", "古代〜パリ": "Antiquity (Paris)", "古代〜": "From antiquity", "古代": "Antiquity", "中世ヨーロッパ": "Medieval Europe", "中世": "Medieval",
    "反応性の概念": "The concept of reactivity", "ラヴォアジエが元素に分類": "classified as an element by Lavoisier", "ペリゴが単離": "isolated by Péligot", "ハンターが単離": "isolated by Hunter", "ベルセリウスが命名": "named by Berzelius",
    "バイヤーが合成": "synthesized by Baeyer", "ファラデーが命名": "named by Faraday", "20世紀初頭": "early 20th century", "20世紀中盤〜": "from the mid-20th century", "20世紀後半": "late 20th century", "19世紀後半": "late 19th century",
    "比重選鉱の原理": "Principle of gravity separation", "化学分析の基礎": "Foundation of chemical analysis", "希土類・ラジウム分離の基本技術": "Basic technique for separating rare earths and radium", "陶器・銅の製錬": "pottery and copper smelting", "鉄器時代": "the Iron Age",
    "ローマ時代〜中世": "Roman era to the Middle Ages", "ラヴォアジエ以前から観察": "Observed since before Lavoisier", "製錬の本質": "The essence of smelting", "イオン化傾向の原型": "Prototype of the ionization tendency", "漂白に使用": "Used for bleaching",
    "胆礬": "Blue vitriol", "芒硝": "Glauber's salt", "「ルナ・コースティック」": "“Lunar caustic”", "ルナ・コルネア": "Luna cornea", "皓礬": "White vitriol", "実験の心得": "A laboratory habit", "氷室": "ice house", "状態変化": "Change of state",
    "物質の性質": "Properties of matter", "物質の基本": "Basics of matter", "海水の淡水化": "Desalinating seawater", "電源を持つと使える": "Usable once you have a power source", "ネルンスト以前の理解": "Understanding before Nernst", "ボルタ以来の発見": "A discovery since Volta",
    "オランダの化学者たち": "Dutch chemists", "化学工業の基本": "Foundation of the chemical industry", "質量作用の法則": "law of mass action", "電子の発見以降": "After the discovery of the electron", "工業生産": "industrial production", "製品化": "commercialized",
    "遺伝子組換え": "recombinant DNA", "合成": "synthesis", "単離": "isolation", "爆薬": "explosives", "微生物による合成": "synthesis by microbes", "日本": "Japan", "中国": "China", "メソポタミア": "Mesopotamia", "太陽": "the Sun",
    "ゼリンスキー(活性炭)": "Zelinsky (activated charcoal)", "シュヴァイガー(検流計)": "Schweigger (galvanometer)", "ボルタ(沼気)": "Volta (marsh gas)", "ボイル(木精)": "Boyle (wood spirit)", "ホフマン(バイエル)": "Hofmann (Bayer)", "モートンの麻酔": "Morton's anesthesia",
    "ドーマク(プロントジル)": "Domagk (Prontosil)", "ミュラー(ノーベル賞)": "Müller (Nobel Prize)", "プランケット(偶然の発見)": "Plunkett (accidental discovery)", "ケイド(躁うつ病の治療)": "Cade (treatment of manic depression)",
    "シュヴルール(胆石から)": "Chevreul (from gallstones)", "ケンドール": "Kendall", "ヘンチ(ノーベル賞)": "Hench (Nobel Prize)", "ヘッセ(培地)": "Hesse (culture medium)", "ペルジル(Persil)": "Persil", "カオ(ノーベル賞)": "Kao (Nobel Prize)",
    "クロンステット(天然)": "Cronstedt (natural)", "ノストラダムス(安息香から)": "Nostradamus (from benzoin)", "クオレック(デュポン)": "Kwolek (DuPont)", "エジソン(電球)": "Edison (light bulb)", "ガイム": "Geim", "ノボセロフ(ノーベル賞)": "Novoselov (Nobel Prize)",
    "鈴木梅太郎(オリザニン)": "Umetaro Suzuki (oryzanin)", "宮坂(太陽電池)": "Miyasaka (solar cell)", "ヤギー(": "Yaghi (", "ノーベル化学賞)": " Nobel Prize in Chemistry)", "バウェンディ(": "Bawendi (", "ベルトレ(ジャベル水)": "Berthollet (Javel water)",
    "ホンベルク": "Homberg", "ベルトレ": "Berthollet", "蔡倫(伝承)": "Cai Lun (traditional account)", "森田浩介ら(理研)": "Kosuke Morita et al. (RIKEN)", "ヘスト": "Hesse",
    "(追体験で得る)": " (gained through Replay)", "とクリック": " and Crick", "ブラッグ父子": "the Braggs (father and son)", "ペラン・ミリカンら": "Perrin, Millikan et al.", "ノダック夫妻": "the Noddacks", "キュリー夫妻": "the Curies", "エルヤル兄弟": "the Elhuyar brothers",
    "マリンスキー他": "Marinsky et al.", "コルソン他": "Corson et al.", "シーボーグ他": "Seaborg et al.", "ギオルソ他": "Ghiorso et al.", "ミュンツェンベルク他": "Münzenberg et al.", "ホフマン他": "Hofmann et al.", "オークリッジ他": "Oak Ridge et al.", "オガネシアン他": "Oganessian et al.",
    "ドゥブナ": "Dubna", "バークレー": "Berkeley", "リバモア": "Livermore", "ベル研究所": "Bell Labs", "ゼネラル・エレクトリック": "General Electric", "ICI": "ICI", "BASF": "BASF",
    // ---- 人名 ----
    "ジャービル": "Jabir", "ブラント": "Brand", "マルクグラーフ": "Marggraf", "キャベンディッシュ": "Cavendish", "ブラック": "Black", "プリーストリー": "Priestley", "シェーレ": "Scheele", "ラヴォアジエ": "Lavoisier", "ドルトン": "Dalton", "ボルタ": "Volta",
    "ニコルソン": "Nicholson", "カーライル": "Carlisle", "デービー": "Davy", "メンデレーエフ": "Mendeleev", "ヴェーラー": "Wöhler", "レーウェンフック": "Leeuwenhoek", "フック": "Hooke", "ミーシャー": "Miescher", "ベルセリウス": "Berzelius", "ラザフォード": "Rutherford",
    "パスツール": "Pasteur", "フレミング": "Fleming", "ハーバー": "Haber", "J.J.トムソン": "J. J. Thomson", "レントゲン": "Röntgen", "ベクレル": "Becquerel", "ハーン": "Hahn", "シュトラスマン": "Strassmann", "ワトソン": "Watson", "クリック": "Crick", "フランクリン": "Franklin",
    "コーエン": "Cohen", "ボイヤー": "Boyer", "キルビー": "Kilby", "アルベルトゥス・マグヌス": "Albertus Magnus", "バシリウス・ヴァレンティヌス": "Basil Valentine", "ジョフロワ": "Geoffroy", "クルーンステット": "Cronstedt", "ガーン": "Gahn", "ヴォークラン": "Vauquelin",
    "デル・リオ": "del Río", "セフストレーム": "Sefström", "イェルム": "Hjelm", "ミュラー": "Müller", "ウリョア": "Ulloa", "ウォラストン": "Wollaston", "テナント": "Tennant", "クラウス": "Claus", "アルフヴェドソン": "Arfwedson", "ブランド": "Brande", "ゲイ=リュサック": "Gay-Lussac",
    "ビュシー": "Bussy", "エルステッド": "Ørsted", "モアッサン": "Moissan", "クールトワ": "Courtois", "バラール": "Balard", "シュトロマイヤー": "Stromeyer", "ヴィンクラー": "Winkler", "ボアボードラン": "Lecoq de Boisbaudran", "ライヒ": "Reich", "リヒター": "Richter", "クルックス": "Crookes",
    "ブンゼン": "Bunsen", "キルヒホフ": "Kirchhoff", "ニルソン": "Nilson", "ガドリン": "Gadolin", "モサンダー": "Mosander", "ヒージンガー": "Hisinger", "ヴェルスバッハ": "Welsbach", "ドマルセー": "Demarçay", "マリニャック": "Marignac", "ソレー": "Soret", "クレーベ": "Cleve",
    "ユルバン": "Urbain", "ハチェット": "Hatchett", "エーケベリ": "Ekeberg", "コスター": "Coster", "ヘヴェシー": "Hevesy", "ラムゼー": "Ramsay", "レイリー": "Rayleigh", "トラバース": "Travers", "ドビエルヌ": "Debierne", "ドルン": "Dorn", "ペレー": "Perey", "マイトナー": "Meitner",
    "ペリエ": "Perrier", "セグレ": "Segrè", "マクミラン": "McMillan", "アベルソン": "Abelson", "リンデ": "Linde", "ローレンス": "Lawrence", "ヘイルズ": "Hales", "パパン": "Papin", "ゲーリケ": "Guericke", "ガイスラー": "Geissler", "ファーレンハイト": "Fahrenheit", "ド・ラバル": "de Laval",
    "ゴルトシュミット": "Goldschmidt", "ルブラン": "Leblanc", "ソルベー": "Solvay", "グラウバー": "Glauber", "ティロリエ": "Tilorier", "ル・ベル": "Le Bel", "ヘニンジェ": "Hennig", "ハウスブランド": "Hausbrand", "ダニエル": "Daniell", "スタージャン": "Sturgeon", "ワット": "Watt",
    "ファラデー": "Faraday", "ジーメンス": "Siemens", "エルキントン": "Elkington", "ブルニャテッリ": "Brugnatelli", "ルクランシェ": "Leclanché", "プランテ": "Planté", "ベルテロ": "Berthelot", "フランクランド": "Frankland", "ブトレロフ": "Butlerov", "デュマ": "Dumas", "ペリゴ": "Péligot",
    "ショルレマー": "Schorlemmer", "リバウ": "Libavius", "ケクレ": "Kekulé", "ペルティエ": "Pelletier", "ペルーズ": "Pelouze", "デュブランフォー": "Dubrunfaut", "ケストナー": "Kestner", "シュバイツァー": "Schweizer", "アチソン": "Acheson", "クロトー": "Kroto", "スモーリー": "Smalley", "カール": "Curl",
    "シェーンバイン": "Schönbein", "シュレッター": "Schrötter", "コッセル": "Kossel", "ルイス": "Lewis", "ポーリング": "Pauling", "ドルーデ": "Drude", "ラティマー": "Latimer", "ロデブッシュ": "Rodebush", "ウェルナー": "Werner", "ファン・デル・ワールス": "van der Waals", "ファント・ホッフ": "van 't Hoff",
    "ヴィスリツェヌス": "Wislicenus", "アルナルドゥス": "Arnaldus", "バイヤー": "Baeyer", "ミッチャーリヒ": "Mitscherlich", "テナール": "Thénard", "ゼーレンセン": "Sørensen", "クレーマー": "Krämer", "ラプラス": "Laplace", "アヴォガドロ": "Avogadro", "カニッツァーロ": "Cannizzaro",
    "オストワルト": "Ostwald", "アレニウス": "Arrhenius", "ボイル": "Boyle", "ジュール": "Joule", "マイヤー": "Mayer", "ヘルムホルツ": "Helmholtz", "ヘス": "Hess", "ヘンリー": "Henry", "ネルンスト": "Nernst", "ベルトロ": "Berthelot", "サン=ジル": "Saint-Gilles", "グルベルグ": "Guldberg",
    "ヴォーゲ": "Waage", "ル・シャトリエ": "Le Chatelier", "ウィルヘルミー": "Wilhelmy", "ボッシュ": "Bosch", "ブラ": "Bura", "アスプディン": "Aspdin", "フックス": "Fuchs", "ランペディウス": "Lampadius", "ディースバッハ": "Diesbach", "シュヴルール": "Chevreul", "ソブレロ": "Sobrero",
    "ノーベル": "Nobel", "ウィルブラント": "Wilbrand", "パヤン": "Payen", "ルンゲ": "Runge", "ウンフェルドルベン": "Unverdorben", "パーキン": "Perkin", "ピリア": "Piria", "カヴァントゥ": "Caventou", "ゼルチュルナー": "Sertürner", "ゲスリー": "Guthrie", "ソベイラン": "Soubeiran", "リービッヒ": "Liebig",
    "コルドゥス": "Cordus", "ホフマン": "Hofmann", "ベークランド": "Baekeland", "ナッタ": "Natta", "ルニョー": "Regnault", "クラッテ": "Klatte", "カロザース": "Carothers", "ヴュルツ": "Wurtz", "ウィンフィールド": "Winfield", "ディクソン": "Dickson", "グッドイヤー": "Goodyear", "ノルマン": "Normann",
    "ブラコノ": "Braconnot", "シュトレッカー": "Strecker", "池田菊苗": "Kikunae Ikeda", "バンティング": "Banting", "ハース": "Haworth", "セント=ジェルジ": "Szent-Györgyi", "ポゼルト": "Posselt", "ライマン": "Reimann", "ワクスマン": "Waksman", "シャッツ": "Schatz", "ミジリー": "Midgley",
    "ハイアット": "Hyatt", "クロス": "Cross", "ビーバン": "Bevan", "シモン": "Simon", "プランケット": "Plunkett", "ロコウ": "Rochow", "ベッセマー": "Bessemer", "ブレアリー": "Brearley", "ウィルム": "Wilm", "シュレーター": "Schröter", "佐川眞人": "Masato Sagawa", "ショット": "Schott",
    "レイブンズクロフト": "Ravenscroft", "ローゼンバーグ": "Rosenberg", "グッドイナフ": "Goodenough", "ゴールドシュミット": "Goldschmidt", "エプソム": "Epsom", "シュッツェンベルガー": "Schützenberger", "ウー": "Wu", "チュー": "Chu", "ライニッツァー": "Reinitzer", "レーマン": "Lehmann",
    "モンサント": "Monsanto", "ジアニン": "Zhanin", "カステン": "Kasten", "進藤昭男": "Akio Shindo", "ゴブレ": "Gobley", "ガイシック": "Geisick", "マレー・ラネー": "Murray Raney", "ローゼ": "Rose", "エキモフ": "Ekimov", "ハワード": "Howard", "ウルフ": "Woulfe", "グリース": "Griess",
    "ブラウン": "Brown", "ペラン": "Perrin", "ミリカン": "Millikan", "ベルナール": "Bernard", "ブラッグ": "Bragg", "モーズリー": "Moseley", "ミラー": "Miller", "サンガー": "Sanger", "ワトソン": "Watson", "ドーマク": "Domagk", "ヤギー": "Yaghi", "バウェンディ": "Bawendi",
  };
  const keys = Object.keys(N).sort((a, b) => b.length - a.length);
  const ORD = (n) => n + "th";
  I18N.note = function (s) {
    if (!s || I18N.lang !== "en") return s;
    let t = s, hit = [];
    // 語を、いったん目印に置き換えて、年代の書式の変換に巻き込まれないようにする
    keys.forEach((k) => { if (t.includes(k)) { const id = "\u0001" + hit.length + "\u0002"; hit.push(N[k]); t = t.split(k).join(id); } });
    t = t.replace(/(\d+)世紀〜/g, (m, a) => "from the " + ORD(a) + " century").replace(/(\d+)世紀頃/g, (m, a) => "c. " + ORD(a) + " century").replace(/約(\d+)世紀/g, (m, a) => "c. " + ORD(a) + " century").replace(/約(\d+)年前/g, "~$1 years ago")
      .replace(/(\d+)〜(\d+)世紀/g, (m, a, b) => ORD(a) + "–" + ORD(b) + " century")
      .replace(/(\d+)世紀(初頭|後半|中盤)?/g, (m, a, w) => ({ 初頭: "early ", 後半: "late ", 中盤: "mid-" }[w] || "") + ORD(a) + " century")
      .replace(/(\d+)〜(\d+)年代/g, "$1s–$2s").replace(/(\d+)年代/g, "$1s").replace(/(\d+)年頃/g, "c. $1").replace(/(\d+)〜(\d+)年/g, "$1–$2")
      .replace(/(\d+)年発見、/g, "$1 discovered, ").replace(/(\d+)年(?=\s|\/|$|\u0001|、)/g, "$1").replace(/(\d+)年/g, "$1")
      .replace(/(years ago|century)\s+(?=\u0001|\S)/g, "$1, ").replace(/(\d)\s+(?=\u0001|[A-Z])/g, "$1, ").replace(/\s*\/\s*/g, " / ").replace(/、/g, ", ");
    t = t.replace(/\u0001(\d+)\u0002/g, (m, i) => hit[+i]);
    return t.replace(/\s+/g, " ").replace(/\s+([,)])/g, "$1").trim();
  };
})();
