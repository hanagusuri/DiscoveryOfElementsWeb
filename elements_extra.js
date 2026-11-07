// 追加元素・鉱石・道具・レシピ・技術 (data.js のデータに合流させる)
// ブラウザ: data.js → elements.js → elements_extra.js → game.js の順に読み込む
const _isNode = typeof module !== "undefined";
const _D = _isNode ? require("./data.js") : DATA;
const _P = _isNode ? require("./elements.js") : { PERIODIC, periodicCat };
const _T = (lo, hi, sealed) => { const c = { t: [lo, hi] }; if (sealed !== undefined) c.sealed = sealed; return c; };
const _EMOJI = { alkali: "🧊", alkaline: "🪨", trans: "🔩", post: "🔗", metalloid: "💠", nonmetal: "🫧", halogen: "🧪", noble: "🎈", lanth: "💎", actin: "☢️" };

// [記号, id, 時代, 説明, 由来メモ, 絵文字(省略可)]
const ELEMENT_DEFS = [
  ["Pb","lead",2,"柔らかく重い金属。水道管や顔料に使われた。","古代","🔗"],
  ["Ag","silver",2,"古代から貴ばれた白く輝く金属。","古代","🥈"],
  ["As","arsenic",2,"毒としても名高い灰色の半金属。","1250年頃 アルベルトゥス・マグヌス"],
  ["Sb","antimony",2,"錬金術師に愛された、輝く脆い半金属。","15世紀 バシリウス・ヴァレンティヌス"],
  ["Bi","bismuth",3,"鉛と区別されずにいた、虹色の結晶を作る金属。","1753年 ジョフロワ"],
  ["Co","cobalt",3,"青いガラスの顔料になる金属。","1735年 ブラント"],
  ["Ni","nickel",3,"銅に似た鉱石から見つかった硬い金属。","1751年 クルーンステット"],
  ["Mn","manganese",3,"鋼に粘りを与える金属。","1774年 ガーン"],
  ["Cr","chromium",3,"鮮やかな色の化合物をつくる硬い金属。","1797年 ヴォークラン"],
  ["V","vanadium",3,"鋼を強くする金属。多彩な色の化合物をつくる。","1801年 デル・リオ/1830年 セフストレーム"],
  ["Mo","molybdenum",3,"鉛と間違えられていた鉱石から見つかった金属。","1781年 イェルム"],
  ["W","tungsten",3,"最も融点の高い金属。電球のフィラメントになる。","1783年 エルヤル兄弟"],
  ["Te","tellurium",3,"金の鉱石に潜んでいた銀白色の半金属。","1782年 ミュラー"],
  ["Se","selenium",3,"月にちなんで名づけられた元素。","1817年 ベルセリウス"],
  ["Pt","platinum",3,"王水にしか溶けない重い貴金属。","1748年 ウリョア/1803年 ウォラストン","⚪"],
  ["Pd","palladium",3,"小惑星パラスにちなむ白金族の金属。","1803年 ウォラストン"],
  ["Rh","rhodium",3,"薔薇色の塩をつくる白金族の金属。","1803年 ウォラストン"],
  ["Os","osmium",3,"最も密度の高い元素のひとつ。","1803年 テナント"],
  ["Ir","iridium",3,"虹色の塩をつくる極めて硬い金属。","1803年 テナント"],
  ["Ru","ruthenium",3,"白金鉱石の残渣から見つかった金属。","1844年 クラウス"],
  ["Mg","magnesium",3,"白い閃光を放って燃える軽い金属。","1808年 デービー","🎇"],
  ["Sr","strontium",3,"炎に赤い色を与える金属。","1808年 デービー"],
  ["Ba","barium",3,"重い石(重晶石)から見つかった金属。","1808年 デービー"],
  ["Li","lithium",3,"最も軽い金属。","1817年 アルフヴェドソン/1818年 ブランド"],
  ["B","boron",3,"ホウ砂から取り出した黒褐色の元素。","1808年 ゲイ=リュサック/デービー"],
  ["Be","beryllium",3,"軽くて硬い、宝石エメラルドの成分。","1828年 ヴェーラー/ビュシー"],
  ["Al","aluminium",3,"かつて金より貴重だった、軽く錆びにくい金属。","1825〜27年 エルステッド/ヴェーラー","🥫"],
  ["Zr","zirconium",3,"耐熱・耐腐食性の高い金属。","1824年 ベルセリウス"],
  ["Ti","titanium",4,"軽くて強く錆びない金属。","1791年発見、1910年 ハンターが単離"],
  ["F","fluorine",3,"最も反応性が高い黄緑色の気体。","1886年 モアッサン"],
  ["I","iodine",3,"加熱すると紫色の蒸気になる。","1811年 クールトワ","🟣"],
  ["Br","bromine",3,"常温で液体の赤褐色の非金属。","1826年 バラール"],
  ["Cd","cadmium",3,"亜鉛鉱から見つかった柔らかい金属。","1817年 シュトロマイヤー"],
  ["Ge","germanium",3,"予言されたエカケイ素。のちに半導体の主役となる。","1886年 ヴィンクラー"],
  ["Ga","gallium",3,"予言されたエカアルミニウム。手の熱で融ける。","1875年 ボアボードラン"],
  ["In","indium",3,"藍色のスペクトル線で見つかった金属。","1863年 ライヒ/リヒター"],
  ["Tl","thallium",3,"緑のスペクトル線で見つかった、毒性の強い金属。","1861年 クルックス"],
  ["Rb","rubidium",3,"赤いスペクトル線で見つかった金属。","1861年 ブンゼン/キルヒホフ"],
  ["Cs","caesium",3,"青いスペクトル線で見つかった、反応性の高い金属。","1860年 ブンゼン/キルヒホフ"],
  ["Sc","scandium",3,"予言されたエカホウ素。","1879年 ニルソン"],
  ["Y","yttrium",3,"スウェーデンの村イッテルビーの鉱石から見つかった。","1794年 ガドリン/1843年 モサンダー"],
  ["La","lanthanum",3,"「隠れていたもの」。セリウム鉱石に潜んでいた。","1839年 モサンダー"],
  ["Ce","cerium",3,"小惑星セレスにちなむ希土類元素。","1803年 ベルセリウス/ヒージンガー"],
  ["Pr","praseodymium",3,"緑色の双子。ネオジムと分離された。","1885年 ヴェルスバッハ"],
  ["Nd","neodymium",3,"新しい双子。現代の強力磁石の材料。","1885年 ヴェルスバッハ"],
  ["Sm","samarium",3,"鉱物サマルスキー石から見つかった。","1879年 ボアボードラン"],
  ["Eu","europium",3,"ヨーロッパにちなむ蛍光体の元素。","1901年 ドマルセー"],
  ["Gd","gadolinium",3,"フィンランドの化学者ガドリンにちなむ。","1880年 マリニャック"],
  ["Tb","terbium",3,"イッテルビーの村にちなむ四兄弟のひとつ。","1843年 モサンダー"],
  ["Er","erbium",3,"イッテルビーの村にちなむ四兄弟のひとつ。","1843年 モサンダー"],
  ["Dy","dysprosium",3,"「得がたいもの」。分離が極めて難しかった。","1886年 ボアボードラン"],
  ["Ho","holmium",3,"ストックホルムにちなむ希土類。","1878年 ソレー/クレーベ"],
  ["Tm","thulium",3,"北の果てトゥーレにちなむ希土類。","1879年 クレーベ"],
  ["Yb","ytterbium",3,"イッテルビーの村にちなむ希土類。","1878年 マリニャック"],
  ["Lu","lutetium",4,"パリの古名にちなむ最後の天然希土類。","1907年 ユルバン"],
  ["Nb","niobium",3,"タンタルとよく似て、分離に半世紀かかった。","1801年 ハチェット/1866年 マリニャック"],
  ["Ta","tantalum",3,"酸にも溶けない、神話の罰にちなむ金属。","1802年 エーケベリ"],
  ["Hf","hafnium",4,"X線スペクトルで存在を確認した元素。","1923年 コスター/ヘヴェシー"],
  ["Re","rhenium",4,"最後に見つかった安定な天然元素。","1925年 ノダック夫妻"],
  ["Th","thorium",3,"北欧神話の雷神にちなむ放射性元素。","1828年 ベルセリウス"],
  ["He","helium",3,"太陽のスペクトルで先に見つかった、最も軽い貴ガス。","1868年 太陽/1895年 ラムゼー"],
  ["Ar","argon",3,"空気の約1%を占める『怠け者』の気体。","1894年 レイリー/ラムゼー"],
  ["Ne","neon",3,"液体空気から分離した、赤く光る貴ガス。","1898年 ラムゼー/トラバース"],
  ["Kr","krypton",3,"「隠されたもの」という名の貴ガス。","1898年 ラムゼー/トラバース"],
  ["Xe","xenon",3,"「見知らぬもの」という名の貴ガス。","1898年 ラムゼー/トラバース"],
  ["Po","polonium",4,"キュリー夫妻が祖国ポーランドにちなんで名づけた。","1898年 キュリー夫妻"],
  ["Ra","radium",4,"暗闇で青白く光る強い放射性元素。","1898年 キュリー夫妻"],
  ["Ac","actinium",4,"放射能を持つ「光線」の元素。","1899年 ドビエルヌ"],
  ["Rn","radon",4,"ラジウムから生じる放射性の貴ガス。","1900年 ドルン"],
  ["Fr","francium",4,"天然で最後に見つかった元素。極めて不安定。","1939年 ペレー"],
  ["Pa","protactinium",4,"アクチニウムの前の元素。","1917年 ハーン/マイトナー"],
  ["Tc","technetium",4,"人類が最初に人工的につくった元素。","1937年 ペリエ/セグレ"],
  ["Pm","promethium",4,"天然にはほぼ存在しない希土類。","1945年 マリンスキー他"],
  ["At","astatine",4,"最も希少な元素のひとつ。","1940年 コルソン他"],
  ["Np","neptunium",4,"ウランの先に初めて作られた超ウラン元素。","1940年 マクミラン/アベルソン"],
  ["Pu","plutonium",4,"核兵器と原子炉に使われる人工元素。","1940年 シーボーグ他"],
  ["Am","americium",4,"煙感知器に使われる人工元素。","1944年 シーボーグ他"],
  ["Cm","curium",4,"キュリー夫妻にちなむ人工元素。","1944年 シーボーグ他"],
  ["Bk","berkelium",4,"カリフォルニア大学バークレー校で作られた。","1949年 シーボーグ他"],
  ["Cf","californium",4,"カリフォルニアにちなむ人工元素。","1950年 シーボーグ他"],
  ["Es","einsteinium",4,"水爆実験の残骸から見つかった。","1952年 ギオルソ他"],
  ["Fm","fermium",4,"フェルミにちなむ人工元素。","1952年 ギオルソ他"],
  ["Md","mendelevium",4,"周期表の父メンデレーエフにちなむ。","1955年 ギオルソ他"],
  ["No","nobelium",4,"ノーベルにちなむ人工元素。","1958年 ギオルソ他"],
  ["Lr","lawrencium",4,"サイクロトロンの発明者ローレンスにちなむ。","1961年 ギオルソ他"],
  ["Rf","rutherfordium",4,"超重元素の最初の元素。","1964〜69年 ドゥブナ/バークレー"],
  ["Db","dubnium",4,"ロシアの研究都市ドゥブナにちなむ。","1967〜70年"],
  ["Sg","seaborgium",4,"存命中の人物にちなんで名づけられた元素。","1974年 ギオルソ他"],
  ["Bh","bohrium",4,"ボーアにちなむ人工元素。","1981年 ミュンツェンベルク他"],
  ["Hs","hassium",4,"ドイツ・ヘッセン州にちなむ。","1984年 ミュンツェンベルク他"],
  ["Mt","meitnerium",4,"核分裂を解き明かしたマイトナーにちなむ。","1982年 ミュンツェンベルク他"],
  ["Ds","darmstadtium",4,"ドイツの都市ダルムシュタットにちなむ。","1994年 ホフマン他"],
  ["Rg","roentgenium",4,"X線を発見したレントゲンにちなむ。","1994年 ホフマン他"],
  ["Cn","copernicium",4,"地動説のコペルニクスにちなむ。","1996年 ホフマン他"],
  ["Nh","nihonium",4,"日本の理化学研究所が発見した、アジア初の新元素。","2004年 森田浩介ら(理研)"],
  ["Fl","flerovium",4,"ロシアのフレロフ核反応研究所にちなむ。","1998年 ドゥブナ"],
  ["Mc","moscovium",4,"モスクワ州にちなむ人工元素。","2003年 ドゥブナ/リバモア"],
  ["Lv","livermorium",4,"ローレンス・リバモア国立研究所にちなむ。","2000年 ドゥブナ/リバモア"],
  ["Ts","tennessine",4,"テネシー州にちなむ、ハロゲン族の人工元素。","2010年 ドゥブナ/オークリッジ他"],
  ["Og","oganesson",4,"周期表の最後(118番)の元素。","2002年 オガネシアン他"],
];

// [id, 名前, 絵文字, 種類, 時代, 説明, 由来メモ]
const EXTRA_ITEM_ROWS = [
  ["galena","方鉛鉱","🩶","material",2,"銀灰色に輝く重い鉱石。",""],
  ["stibnite","輝安鉱","🗡️","material",2,"針状の結晶が光る鉱石。古代の化粧品にも。",""],
  ["orpiment","雄黄","🟨","material",2,"鮮やかな黄色の鉱物。有毒。",""],
  ["bismuth_ore","蒼鉛鉱","🪻","material",2,"銀白色にピンクがかった鉱石。",""],
  ["cobalt_ore","コバルト鉱","🔵","material",3,"青いガラスの原料になる鉱石。",""],
  ["nickel_ore","ニッケル鉱","🟫","material",3,"銅に似て見えるが銅が取れない「悪魔の銅」。",""],
  ["pyrolusite","軟マンガン鉱","⬛","material",3,"黒くて柔らかい鉱石。",""],
  ["chromite","クロム鉱","🟧","material",3,"赤橙色の鉱石。",""],
  ["platinum_ore","白金鉱","⚪","material",3,"銀に似た重い粒。銀ではなさそうだ。",""],
  ["molybdenite","輝水鉛鉱","🔘","material",3,"黒鉛に似た柔らかい鉱石。",""],
  ["wolframite","鉄マンガン重石","⚫","material",3,"黒褐色の非常に重い鉱石。",""],
  ["tellurium_ore","テルル鉱","🟤","material",3,"金を含む奇妙な鉱石。",""],
  ["vanadinite","褐鉛鉱","🔴","material",3,"鮮やかな赤い結晶。",""],
  ["magnesia","苦土","⬜","material",3,"白い粉。(酸化マグネシウム)",""],
  ["strontianite","ストロンチアン石","🟩","material",3,"スコットランドの村で見つかった鉱石。",""],
  ["baryte","重晶石","🏔️","material",3,"やけに重い白い石。",""],
  ["lithium_ore","ペタル石","🪨","material",3,"白い石。炎に赤い色を与える。",""],
  ["borax","ホウ砂","🫙","material",3,"湖畔で採れる白い結晶。",""],
  ["beryl","緑柱石","💚","material",3,"エメラルドやアクアマリンの原石。",""],
  ["alumina","礬土","🤍","material",3,"明礬から得た白い土。",""],
  ["rutile","金紅石","🟥","material",3,"赤褐色の針状結晶。",""],
  ["zircon","ジルコン","🔶","material",3,"硬くて屈折率の高い宝石質の鉱物。",""],
  ["fluorite","蛍石","🟣","material",3,"熱すると光る、紫色の鉱物。",""],
  ["kelp","海藻","🌿","material",3,"浜辺に打ち上げられた海藻。",""],
  ["cerite","セリウム石","🟠","material",3,"スウェーデンの鉱山から出る赤褐色の石。",""],
  ["gadolinite","ガドリン石","⚫","material",3,"イッテルビーの村で見つかった黒い石。",""],
  ["lepidolite","リチア雲母","🌸","material",3,"薄紅色の雲母。",""],
  ["sphalerite","閃亜鉛鉱","🟡","material",3,"蜂蜜色にも見える亜鉛の鉱石。",""],
  ["argyrodite","硫銀ゲルマニウム鉱","🩵","material",3,"銀鉱山から出た、正体不明の成分を含む鉱石。",""],
  ["columbite","コルンブ石","🟤","material",3,"北米で見つかった黒い鉱石。",""],
  ["thorite","トール石","🟠","material",3,"重くて黒いスカンジナビアの鉱石。",""],
  ["spectroscope","分光器","🌈","tool",3,"炎の光をプリズムで分け、元素ごとの『光の指紋』を見る装置。","1859年 ブンゼン/キルヒホフ"],
  ["refrigerator","冷却器","🧊","tool",4,"気体を圧縮・膨張させて極低温をつくる装置。","1895年 リンデ"],
  ["liquid_air","液体空気","💧","material",4,"空気を冷やして液体にしたもの。成分ごとに沸点が違う。","1895年"],
  ["cyclotron","サイクロトロン","🌀","tool",4,"粒子を加速して原子核にぶつけ、新しい元素をつくる装置。","1932年 ローレンス"],
];

// [入力, 出力, 文章, 条件?]
const EXTRA_RECIPE_ROWS = [
  [["lens","glass","fire"],["spectroscope"],"炎の光をプリズムに通すと、元素ごとに決まった色の線に分かれた。",_T(2,3)],
  [["galena","charcoal","fire"],["lead"],"銀灰色の石を炭と焼くと、柔らかく重い金属が得られた。",_T(3,5)],
  [["lead","ash","fire"],["silver"],"鉛を灰の皿で熱すると、鉛が灰に染み込み、白く輝く銀だけが残った。",_T(3,5)],
  [["stibnite","iron","fire"],["antimony"],"鉄を加えて熱すると、輝く脆い金属が分離した。",_T(3,5)],
  [["orpiment","charcoal","fire"],["arsenic"],"空気を断って熱すると、黒い光沢のある物質が昇華した。毒に注意。",_T(2,4,true)],
  [["bismuth_ore","charcoal","fire"],["bismuth"],"低めの火で、鉛とは違う赤みがかった金属が得られた。",_T(2,3)],
  [["cobalt_ore","charcoal","fire"],["cobalt"],"鉱石から、鉄に似て磁石に引かれる新しい金属が得られた。",_T(4,5)],
  [["nickel_ore","charcoal","fire"],["nickel"],"銅が取れるはずの鉱石から、白っぽい別の金属が得られた。",_T(4,5)],
  [["pyrolusite","charcoal","fire"],["manganese"],"黒い鉱石から、硬くて脆い金属が得られた。",_T(4,5)],
  [["chromite","charcoal","fire"],["chromium"],"赤い鉱石から、光沢のある硬い金属が得られた。",_T(4,5)],
  [["molybdenite","charcoal","fire"],["molybdenum"],"鉛ではなかった。新しい金属が得られた。",_T(4,5)],
  [["wolframite","charcoal","fire"],["tungsten"],"最高の火力でしか融けない、非常に重い金属が得られた。",_T(5,5)],
  [["vanadinite","hydrogen","fire"],["vanadium"],"水素で還元すると、銀白色の金属が得られた。",_T(4,5)],
  [["tellurium_ore","charcoal","fire"],["tellurium"],"金鉱石に潜んでいた、銀白色の脆い物質が得られた。",_T(3,4)],
  [["platinum_ore","aqua_regia"],["platinum"],"王水に溶かして精製すると、展性のある白い貴金属が得られた。"],
  [["platinum_ore","aqua_regia","ammonia"],["palladium","rhodium"],"溶液を処理すると、二つの新しい金属が分かれた。薔薇色の塩が美しい。"],
  [["platinum_ore","aqua_regia","fire"],["osmium","iridium"],"王水に溶けずに残った黒い粉から、二つの金属が見つかった。"],
  [["platinum_ore","aqua_regia","potassium"],["ruthenium"],"残渣をさらに処理すると、もう一つの白金族金属が現れた。"],
  [["magnesia","battery","fire"],["magnesium"],"苦土に電気を通すと、白い軽い金属が現れた。",_T(3,5)],
  [["strontianite","battery","fire"],["strontium"],"電気で分解すると、炎を赤く染める金属が得られた。",_T(3,5)],
  [["baryte","battery","fire"],["barium"],"重い石が電気で分解され、金属が現れた。",_T(3,5)],
  [["lithium_ore","battery","fire"],["lithium"],"電気分解で、水に浮くほど軽い金属が得られた。",_T(3,5)],
  [["borax","potassium"],["boron"],"カリウムでホウ砂を還元すると、黒褐色の粉が残った。"],
  [["beryl","potassium"],["beryllium"],"カリウムで還元して、軽くて硬い金属を得た。"],
  [["alumina","potassium"],["aluminium"],"カリウムで還元すると、銀色の軽い金属の粒ができた。金より貴重だった。"],
  [["zircon","potassium"],["zirconium"],"宝石の石から、新しい金属が取り出された。"],
  [["zircon","xray"],["hafnium"],"X線スペクトルに、まだ見ぬ元素の線が現れた。"],
  [["rutile","sodium"],["titanium"],"ナトリウムで強く還元し、軽くて強い金属を得た。",_T(4,5,true)],
  [["fluorite","sulfuric","battery"],["fluorine"],"強烈な酸を電気分解して、危険な黄緑色の気体を得た。",_T(5,5)],
  [["kelp","sulfuric"],["iodine"],"海藻の灰に酸を加えたら、紫色の蒸気が立ち上った。"],
  [["seawater","chlorine"],["bromine"],"塩素を海水に通すと、赤褐色の液体が分離した。"],
  [["sulfuric","sulfur","fire"],["selenium"],"酸の製造所の沈殿物から、赤い物質が見つかった。",_T(3,4)],
  [["zinc_ore","sulfur","hcl"],["cadmium"],"亜鉛鉱の溶液に硫黄を作用させると、黄色い沈殿ができた。"],
  [["air","magnesium","fire"],["argon"],"空気から酸素や窒素を除いても、わずかに残る気体があった。",_T(3,5,true)],
  [["uranium_ore","sulfuric"],["helium"],"鉱石を酸で処理すると、太陽の光にしか見えなかった元素が地上で見つかった。"],
  [["air","refrigerator"],["liquid_air"],"空気を冷やし続けると、淡青色の液体になった。"],
  [["liquid_air","alembic","fire"],["neon","krypton","xenon"],"液体空気をゆっくり蒸発させると、沸点の違いで三つの新しい気体に分かれた。",_T(1,1)],
  [["cerite","sulfuric"],["cerium","lanthanum"],"赤褐色の石を酸で処理すると、二つの元素が分かれた。"],
  [["cerite","spectroscope"],["praseodymium","neodymium","samarium","europium","gadolinium"],"光の指紋を頼りに分離を繰り返すと、希土類が次々と現れた。"],
  [["gadolinite","sulfuric"],["yttrium","erbium","terbium"],"黒い石を酸で処理すると、三つの『土』に分かれた。"],
  [["gadolinite","spectroscope"],["holmium","thulium","dysprosium","ytterbium","lutetium","scandium"],"分光器で調べると、まだ知られていないスペクトル線が何本も現れた。"],
  [["lepidolite","spectroscope"],["rubidium","caesium"],"炎に赤い線と青い線が現れた。新しい金属の光だ。"],
  [["sphalerite","spectroscope"],["gallium","indium"],"亜鉛鉱の炎に、藍色と紫の未知の線が現れた。"],
  [["argyrodite","hydrogen","fire"],["germanium"],"予言されていた元素が、現実の鉱石から現れた。",_T(3,5)],
  [["columbite","hcl"],["niobium","tantalum"],"よく似た二つの金属が、長い分離の末に分かれた。"],
  [["columbite","xray"],["rhenium"],"X線スペクトルに、空いたままだった周期表の席の線が現れた。"],
  [["galena","sulfuric","spectroscope"],["thallium"],"酸の沈殿物のスペクトルに、鮮やかな緑の線が現れた。"],
  [["thorite","potassium"],["thorium"],"黒い石から、重い灰色の金属が得られた。"],
  [["uranium_ore","radioactivity","hcl"],["polonium","radium"],"ウラン鉱の残渣のほうが、ウランよりはるかに強く放射していた。二つの新元素が潜んでいた。"],
  [["uranium_ore","radioactivity","sulfuric"],["actinium"],"残渣から、さらに別の放射性の元素が見つかった。"],
  [["radium","air"],["radon"],"ラジウムから、重い放射性の気体が生じていた。"],
  [["actinium","radioactivity"],["francium"],"アクチニウムが崩壊する際、ごくわずかな新元素が生じた。"],
  [["thorium","radioactivity"],["protactinium"],"放射性崩壊系列の失われた環が見つかった。"],
  [["molybdenum","cyclotron"],["technetium"],"モリブデンに粒子を当てると、自然界にない元素ができた。"],
  [["neodymium","cyclotron"],["promethium"],"天然に存在しなかった希土類が、人の手で作られた。"],
  [["bismuth","cyclotron"],["astatine"],"ビスマスにヘリウム原子核を当てて、極めて希少な元素をつくった。"],
  [["uranium","cyclotron"],["neptunium","plutonium"],"ウランに粒子を当てると、ウランより重い元素が現れた。"],
  [["plutonium","cyclotron"],["americium","curium"],"さらに重い人工元素が二つ生まれた。"],
  [["curium","cyclotron"],["berkelium","californium"],"重い元素の合成は、新たな研究都市の名を刻んだ。"],
  [["californium","cyclotron"],["einsteinium","fermium"],"極限の核反応が、さらに重い二つの元素を生んだ。"],
  [["einsteinium","cyclotron"],["mendelevium","nobelium","lawrencium"],"わずか数個の原子を検出するのが精一杯の、重い元素たち。"],
  [["lawrencium","cyclotron"],["rutherfordium","dubnium","seaborgium","bohrium"],"重イオンの衝突が、超重元素の領域を切り拓いた。"],
  [["bohrium","cyclotron"],["hassium","meitnerium","darmstadtium","roentgenium","copernicium"],"数原子の寿命は1秒にも満たないが、確かにそこに存在した。"],
  [["copernicium","cyclotron"],["nihonium","flerovium","moscovium","livermorium","tennessine","oganesson"],"周期表の最後の空欄が埋まった。人類は118元素すべてに到達した。"],
];

const EXTRA_TECHS = [
  { id: "t_deepmine", name: "深い鉱脈の開発", era: 2, cost: 14, req: ["alembic", "iron"], grants: ["galena", "stibnite", "orpiment", "bismuth_ore"], desc: "より深い坑道から、重く光る鉱石や有毒な鉱物を掘り出す。" },
  { id: "t_newmetal", name: "新金属の探索", era: 3, cost: 20, req: ["sulfuric", "iron"], grants: ["cobalt_ore", "nickel_ore", "pyrolusite", "chromite", "platinum_ore", "molybdenite", "wolframite", "tellurium_ore", "vanadinite"], desc: "正体不明の鉱石を各地から集めて分析する。" },
  { id: "t_earths", name: "「土」の探索", era: 3, cost: 22, req: ["electrolysis"], grants: ["magnesia", "strontianite", "baryte", "lithium_ore", "borax", "beryl", "alumina", "rutile", "zircon", "fluorite"], desc: "酸にも火にも強い『土』の正体を、電気で暴く。" },
  { id: "t_kelp", name: "海藻の採集", era: 3, cost: 10, req: ["sulfuric"], grants: ["kelp"], desc: "浜辺の海藻を集め、灰にして研究する。" },
  { id: "t_rare", name: "希少鉱物の収集", era: 3, cost: 30, req: ["spectroscope"], grants: ["cerite", "gadolinite", "lepidolite", "sphalerite", "argyrodite", "columbite", "thorite"], desc: "光の指紋(スペクトル)で調べる価値のある鉱物を集める。" },
  { id: "t_cryo", name: "極低温技術", era: 4, cost: 25, req: ["argon"], grants: ["refrigerator"], desc: "気体を液化する冷却装置を開発する。" },
  { id: "t_accel", name: "粒子加速器の建設", era: 4, cost: 35, req: ["electron", "radioactivity"], grants: ["cyclotron"], desc: "粒子を加速し、原子核を人工的に変換する。" },
];

// ---- 合流 ----
for (const [sym, id, era, desc, note, emoji] of ELEMENT_DEFS) {
  const e = _P.PERIODIC.find((x) => x[1] === sym);
  if (!e) throw new Error("PERIODIC に無い記号 " + sym);
  _D.ITEM_ROWS.push([id, e[2], emoji || _EMOJI[_P.periodicCat(e[0])], "element", era, desc, note, sym]);
}
_D.ITEM_ROWS.push(...EXTRA_ITEM_ROWS);
_D.RECIPE_ROWS.push(...EXTRA_RECIPE_ROWS);
_D.TECHS.push(...EXTRA_TECHS);

// =====================================================================
// 鉱石の前処理: 粉砕(条件 fine)・焙焼・洗鉱
// =====================================================================
_D.ITEM_ROWS.push(
  ["mortar", "乳鉢", "🥣", "tool", 1, "石と器で作る、すり潰すための道具。鉱石を粉末にできる。", "先史時代"],
  ["washing", "洗鉱", "🪣", "concept", 1, "重い鉱物は水の流れの中で沈む。比重の差で目的の鉱物を選り分けられる。", "比重選鉱の原理"],
  ["tin_concentrate", "錫精鉱", "⚪", "material", 1, "水で洗って不要な砂を流した、錫分の濃い黒い砂。", ""],
  ["roasting", "焙焼", "🔥", "concept", 2, "硫化物の鉱石は、空気中で焼くと酸化物に変わる。製錬の前段階として欠かせない。", "古代〜"],
  ["lead_oxide", "酸化鉛", "🟨", "material", 2, "方鉛鉱を空気中で焼くと得られる黄色い粉(密陀僧)。", ""],
  ["bismuth_oxide", "酸化ビスマス", "🟡", "material", 2, "蒼鉛鉱を焼いて得た黄色い粉。", ""],
  ["zinc_oxide", "酸化亜鉛", "⬜", "material", 3, "亜鉛鉱を焼いて得た白い粉(亜鉛華)。", ""],
  ["molybdenum_oxide", "酸化モリブデン", "🟦", "material", 3, "輝水鉛鉱を焼いて得た白〜青みの粉。", ""],
  ["cobalt_oxide", "酸化コバルト", "🔵", "material", 3, "コバルト鉱を焼いて得た黒青色の粉。", ""],
  ["nickel_oxide", "酸化ニッケル", "🟢", "material", 3, "ニッケル鉱を焼いて得た緑色の粉。", ""]
);
const _ROAST = { fine: true, sealed: false, t: [2, 3] };
_D.RECIPE_ROWS.push(
  [["stone", "pottery"], ["mortar"], "器の中で石を使えば、物を細かくすり潰せる。"],
  [["tin_ore", "water"], ["tin_concentrate", "washing"], "砕いた石を水で洗うと、軽い砂は流れ、重い黒い粒だけが底に残った。", undefined],
  [["galena", "air", "fire"], ["lead_oxide", "roasting"], "粉にした鉱石を空気に触れさせながら焼くと、刺激臭のある煙とともに黄色い粉に変わった。", _ROAST],
  [["bismuth_ore", "air", "fire"], ["bismuth_oxide", "roasting"], "粉にして空気中で焼くと、黄色い粉になった。", _ROAST],
  [["zinc_ore", "air", "fire"], ["zinc_oxide", "roasting"], "粉の鉱石を焼くと、白い軽い粉(亜鉛華)になった。", _ROAST],
  [["molybdenite", "air", "fire"], ["molybdenum_oxide", "roasting"], "柔らかい黒い鉱石を粉にして焼くと、白い粉に変わった。", _ROAST],
  [["cobalt_ore", "air", "fire"], ["cobalt_oxide", "roasting"], "粉にして空気中で焼くと、毒の煙とともに黒青色の粉が残った。", _ROAST],
  [["nickel_ore", "air", "fire"], ["nickel_oxide", "roasting"], "粉にして空気中で焼くと、緑色の粉が残った。", _ROAST]
);
const _rowOf = (inp) => { const k = [...inp].sort().join("+"); const r = _D.RECIPE_ROWS.find((x) => [...x[0]].sort().join("+") === k); if (!r) throw new Error("レシピなし " + k); return r; };
const _swap = (oldInp, newInp, text) => { const r = _rowOf(oldInp); r[0] = newInp; if (text) r[2] = text; };
const _fine = (inp) => { const r = _rowOf(inp); r[3] = { t: [1, 5], ...(r[3] || {}), fine: true }; };
// 焼いて酸化物にしてから炭で還元する、本来の手順に変更
_swap(["tin_ore", "charcoal", "fire"], ["tin_concentrate", "charcoal", "fire"], "洗って選り分けた黒い砂を炭と焼くと、柔らかな銀色の金属が得られた。");
_swap(["galena", "charcoal", "fire"], ["lead_oxide", "charcoal", "fire"], "黄色い粉を炭で還元すると、柔らかく重い金属が得られた。");
_swap(["bismuth_ore", "charcoal", "fire"], ["bismuth_oxide", "charcoal", "fire"], "黄色い粉を低めの火で還元すると、赤みがかった金属が得られた。");
_swap(["zinc_ore", "charcoal", "fire"], ["zinc_oxide", "charcoal", "fire"], "白い粉を炭と強熱すると、青白い金属の蒸気が出て、冷えると固まった。");
_swap(["molybdenite", "charcoal", "fire"], ["molybdenum_oxide", "charcoal", "fire"], "白い粉を還元すると、鉛とは違う金属が得られた。");
_swap(["cobalt_ore", "charcoal", "fire"], ["cobalt_oxide", "charcoal", "fire"], "黒青色の粉を還元すると、磁石に引かれる新しい金属が得られた。");
_swap(["nickel_ore", "charcoal", "fire"], ["nickel_oxide", "charcoal", "fire"], "緑色の粉を還元すると、白っぽい別の金属が得られた。");
// 硬い鉱石は粉にしないと反応しない
[["wolframite", "charcoal", "fire"], ["chromite", "charcoal", "fire"], ["pyrolusite", "charcoal", "fire"], ["vanadinite", "hydrogen", "fire"], ["tellurium_ore", "charcoal", "fire"]].forEach(_fine);

// =====================================================================
// 試薬による分離(沈殿・ろ過): ウォラストン/テナントの白金族分離
// =====================================================================
_D.ITEM_ROWS.push(
  ["filter", "ろ過器", "🫗", "tool", 2, "砂の層に液体を通し、固体の粒だけを濾し取る道具。", "古代〜"],
  ["precipitation", "沈殿", "🌫️", "concept", 2, "溶けている物質に試薬を加えると、別の物質が固体として析出する。分離の基本技術。", "化学分析の基礎"],
  ["filtration", "ろ過", "🧪", "concept", 2, "沈殿は濁った液から、ろ過で分け取れる。固体(残渣)と液体(ろ液)に分離できる。", "化学分析の基礎"],
  ["pgm_solution", "白金鉱の王水溶液", "🟠", "material", 3, "白金鉱を王水に溶かした橙赤色の液。何が溶けているのだろう。", "1803年 ウォラストン"],
  ["pgm_residue", "不溶残渣", "⬛", "material", 3, "王水に溶けずに残った黒い粉。ただの黒鉛ではないらしい。", "1803年 テナント"],
  ["pt_salt", "白金の黄色沈殿", "🟡", "material", 3, "アンモニアを加えると生じる黄色い沈殿(塩化白金酸アンモニウム)。", "1800年代"],
  ["pgm_filtrate", "ろ液", "🟤", "material", 3, "白金を沈殿させたあとの、まだ色のついた液。別の金属が残っている。", ""],
  ["pd_precipitate", "パラジウムの沈殿", "⚪", "material", 3, "水銀の試薬を加えて生じた淡黄色の沈殿。", "1803年 ウォラストン"],
  ["rh_solution", "薔薇色の液", "🌸", "material", 3, "パラジウムを取り除いたあとに残る、赤みを帯びた液。", ""],
  ["rh_salt", "薔薇色の塩", "🌹", "material", 3, "液を蒸発させると現れる薔薇色の結晶。ロドン(薔薇)の名の由来。", "1803年 ウォラストン"]
);
_D.RECIPE_ROWS.push(
  [["sand", "pottery"], ["filter"], "壺の底に砂を敷き詰めると、液体だけを通す仕掛けができた。"],
  [["pd_precipitate", "fire"], ["palladium"], "沈殿を強く熱すると、銀白色の金属が残った。", { t: [3, 5] }],
  [["rh_solution", "salt", "fire"], ["rh_salt"], "塩を加えてゆるやかに蒸発させると、薔薇色の結晶が現れた。", { t: [1, 2] }],
  [["rh_salt", "hydrogen", "fire"], ["rhodium"], "薔薇色の塩を水素で還元すると、硬い白い金属が得られた。", { t: [3, 5] }],
  [["pt_salt", "fire"], ["platinum"], "黄色い沈殿を強熱すると、灰色のスポンジ状の金属が残った。叩いて固めると白い貴金属になる。", { t: [3, 5] }]
);
// 白金族の分離手順に再編 (以前の「白金鉱＋王水＋〇〇」から変更)
{
  const dissolve = _rowOf(["platinum_ore", "aqua_regia"]);
  dissolve[1] = ["pgm_solution", "pgm_residue"];
  dissolve[2] = "白金鉱は王水にほとんど溶けた。だが黒い粉が溶け残った。溶液と残渣、二つに分けて調べよう。";
  const ppt = _rowOf(["platinum_ore", "aqua_regia", "ammonia"]);
  ppt[0] = ["pgm_solution", "ammonia", "filter"];
  ppt[1] = ["pt_salt", "pgm_filtrate", "precipitation", "filtration"];
  ppt[2] = "アンモニアを加えると黄色い沈殿が生じた。ろ過すると、沈殿とまだ色のついたろ液に分かれた。";
  ppt[5] = "溶液に試薬を加えると、黄色い沈殿が生じて濁った。だが濁ったままでは、沈殿と液は分けられない。";
  const os = _rowOf(["platinum_ore", "aqua_regia", "fire"]);
  os[0] = ["pgm_residue", "lye", "fire"];
  os[2] = "黒い残渣をアルカリと共に熱して酸で処理すると、鼻をつく臭いの揮発物(オスミウム)と、色とりどりの塩(イリジウム)が得られた。";
  os[3] = { t: [3, 5] };
  const ru = _rowOf(["platinum_ore", "aqua_regia", "potassium"]);
  ru[0] = ["pgm_residue", "saltpeter", "fire"];
  ru[2] = "残渣を硝石と共に融かして処理すると、さらに別の金属が現れた。";
  ru[3] = { t: [3, 5] };
  // ろ液からパラジウムとロジウムを分ける
  _D.RECIPE_ROWS.push([["pgm_filtrate", "mercury", "filter"], ["pd_precipitate", "rh_solution"], "水銀の試薬を加えると淡黄色の沈殿が生じた。ろ過すると、沈殿と薔薇色を帯びた液に分かれた。", undefined, undefined,
    "試薬を加えると沈殿が生じて濁った。やはり、分け取る道具がないと先へ進めない。"]);
}

// =====================================================================
// 分別結晶(繰り返し分離): キュリー夫妻のラジウム・ポロニウム / 希土類 / ニオブ・タンタル
//   repeat=N のレシピは、同じ条件で N 回繰り返して初めて成功する。
// =====================================================================
_D.ITEM_ROWS.push(
  ["fractional", "分別結晶", "💠", "concept", 3, "性質のよく似た物質は、溶解度のわずかな差を利用して、結晶化を何度も繰り返して少しずつ分ける。", "希土類・ラジウム分離の基本技術"],
  ["pitch_solution", "ウラン鉱の酸溶液", "🟫", "material", 4, "ウラン鉱を酸に溶かした液。放射能は残渣のほうに強く残っている。", "1898年 キュリー夫妻"],
  ["pitch_residue", "ウラン鉱の残渣", "⬛", "material", 4, "ウランを取り除いた後の残りかす。なぜかウランより強く放射している。", "1898年 キュリー夫妻"],
  ["bi_fraction", "ビスマス分画", "🟤", "material", 4, "硫黄試薬で沈殿させた、ビスマスに似た成分の強い放射性沈殿。", "1898年 キュリー夫妻"],
  ["ba_ra_sulfate", "バリウム分画", "⚪", "material", 4, "残渣から硫酸で沈殿させた白い塩。バリウムに混じって、別の放射性元素が潜んでいる。", "1898年 キュリー夫妻"],
  ["ce_mix", "セリウム族の混合塩", "🟠", "material", 3, "セリウム石を酸で処理して得た、複数の希土類が混ざった塩。", "1803年 ベルセリウス"],
  ["didymium", "ジジム", "🟣", "material", 3, "「双子」と名づけられた紫がかった混合物。実は二つの元素の混合物らしい。", "1841年 モサンダー"],
  ["y_mix", "イットリウム族の混合塩", "⚫", "material", 3, "ガドリン石を酸で処理して得た、複数の希土類が混ざった塩。", "1794年 ガドリン"],
  ["nb_ta_mix", "ニオブ・タンタル混合物", "🟤", "material", 3, "コルンブ石から得た、性質がそっくりな二種の酸化物の混合物。", "1801〜1866年"]
);
const _drop = (inp) => { const r = _rowOf(inp); _D.RECIPE_ROWS.splice(_D.RECIPE_ROWS.indexOf(r), 1); };
const _CR = { t: [1, 2] }; // 結晶化は穏やかな加熱で
{
  // --- キュリー夫妻 ---
  const a = _rowOf(["uranium_ore", "radioactivity", "hcl"]);
  a[1] = ["pitch_solution", "pitch_residue"];
  a[2] = "ウラン鉱を酸に溶かすと、溶液と残渣に分かれた。測ると、ウラン含有量から予想されるより残渣のほうが遥かに強く放射していた。";
  const act = _rowOf(["uranium_ore", "radioactivity", "sulfuric"]);
  act[0] = ["pitch_residue", "radioactivity", "sulfuric"];
  act[2] = "残渣を酸で処理した部分から、さらに別の放射性の元素が現れた。";
  _D.RECIPE_ROWS.push(
    [["pitch_solution", "sulfur", "filter"], ["bi_fraction", "precipitation", "filtration"], "硫黄の試薬を加えると黒い沈殿が生じた。ろ過すると、強く放射する沈殿だけが分け取れた。", undefined, undefined,
      "試薬を加えると黒い沈殿が生じて濁った。分け取る道具が必要だ。"],
    [["bi_fraction", "vacuum_tube", "fire"], ["polonium"], "沈殿を真空管の中で熱すると、真っ先に昇華する成分が管の冷たい部分に付着した。祖国ポーランドにちなんで名づけよう。", { t: [3, 4] }],
    [["pitch_residue", "sulfuric", "filter"], ["ba_ra_sulfate"], "残渣を処理して硫酸で沈殿させると、白い塩が得られた。放射能はこの白い塩に濃縮された。", undefined, undefined,
      "硫酸を加えると白い沈殿が生じて濁った。分け取る道具が必要だ。"],
    [["ba_ra_sulfate", "hcl", "fire"], ["radium", "fractional"], "塩化物にして結晶化させ、結晶と母液を分けては再び結晶化させる…。何千回もの作業の末、暗闇で青白く光る新元素が現れた。", _CR, undefined, undefined, 6]
  );
  // --- 希土類 ---
  const ce = _rowOf(["cerite", "sulfuric"]);
  ce[1] = ["ce_mix"];
  ce[2] = "セリウム石を酸で処理すると、複数の『土』が混ざった塩が得られた。まだ混合物のようだ。";
  _drop(["cerite", "spectroscope"]);
  const gd = _rowOf(["gadolinite", "sulfuric"]);
  gd[1] = ["y_mix"];
  gd[2] = "ガドリン石を酸で処理すると、複数の『土』が混ざった塩が得られた。";
  _drop(["gadolinite", "spectroscope"]);
  _D.RECIPE_ROWS.push(
    [["ce_mix", "nitric", "fire"], ["cerium", "lanthanum", "didymium"], "硝酸塩を部分的に分解すると、分解しやすい成分と、残る成分に分かれた。三つ目の成分は紫がかっている。", { t: [2, 3] }],
    [["didymium", "nitric", "ammonia"], ["praseodymium", "neodymium", "fractional"], "複塩の結晶化を何十回も繰り返すと、緑の塩と紫の塩、二つの『双子』に分かれた。", _CR, undefined, undefined, 5],
    [["didymium", "spectroscope"], ["samarium"], "分光器で見ると、ジジムのスペクトルには未知の吸収線が混じっていた。", undefined],
    [["samarium", "spectroscope", "nitric"], ["europium", "gadolinium"], "結晶化と分光を繰り返すと、サマリウムからさらに二つの元素が分かれた。", _CR, undefined, undefined, 5],
    [["y_mix", "ammonia", "filter"], ["yttrium", "erbium", "terbium"], "アンモニアで少しずつ沈殿させ、ろ過で段階的に分けると、三つの『土』に分かれた。", undefined, undefined, "アンモニアで沈殿が生じて濁った。分け取る道具が必要だ。", 3],
    [["erbium", "nitric", "fire"], ["ytterbium", "scandium"], "エルビウムの硝酸塩を分解を繰り返すと、さらに二つの新しい元素が分かれた。", _CR, undefined, undefined, 5],
    [["erbium", "spectroscope", "ammonia"], ["holmium", "thulium"], "エルビウム土のスペクトルに未知の線が現れ、分別沈殿で二つの元素が分かれた。", undefined, undefined, undefined, 5],
    [["holmium", "ammonia", "filter"], ["dysprosium"], "三十回以上の沈殿とろ過の末に、ようやく得がたい元素が現れた。", undefined, undefined, "アンモニアで沈殿が生じて濁った。分け取る道具が必要だ。", 8],
    [["ytterbium", "nitric", "fire"], ["lutetium"], "八百回もの結晶化の果てに、イッテルビウムから最後の天然希土類が分かれた。", _CR, undefined, undefined, 8]
  );
  // --- ニオブとタンタル ---
  const nb = _rowOf(["columbite", "hcl"]);
  nb[1] = ["nb_ta_mix"];
  nb[2] = "鉱石を酸で処理すると、性質のそっくりな二つの酸化物の混合物が得られた。";
  _D.RECIPE_ROWS.push([["nb_ta_mix", "fluorite", "fire"], ["niobium", "tantalum"], "フッ化物の溶解度の違いを利用して結晶化を繰り返すと、ようやく二つの金属に分かれた。", _CR, undefined, undefined, 5]);
}

// =====================================================================
// 機材の発展史: 加熱設備・容器・気体の取り扱い・圧力/真空
//   レシピの equip(必要設備)を満たさないと、反応は進まない。
// =====================================================================
_D.ITEM_ROWS.push(
  ["kiln", "窯", "🏭", "tool", 1, "土器を積んで囲い、木炭を焚く。焚き火より高温(約800℃)を保てる。", "約6000年前 陶器・銅の製錬"],
  ["bellows", "ふいご", "🌬️", "tool", 1, "革袋で空気を送り込み、炭火を勢いよく燃やす。", "約5000年前"],
  ["furnace", "溶鉱炉", "🔥", "tool", 1, "窯にふいごを組み合わせた高炉。約1500℃に達し、鉄を扱えるようになる。", "約3500年前 鉄器時代"],
  ["glass_flask", "ガラス器具", "🧪", "tool", 2, "透明で、強い酸にも侵されにくい容器。中の反応が目で見える。", "ローマ時代〜中世"],
  ["pneumatic_trough", "水槽(気体捕集)", "🛁", "tool", 3, "水を満たした容器で気体を泡として捕まえる。気体が『別の物質』として扱えるようになった。", "1727年 ヘイルズ/1770年代 プリーストリー"],
  ["eudiometer", "ユーディオメーター", "📏", "tool", 3, "気体の体積を測りながら、中で電気火花を飛ばせる装置。気体どうしの化合を定量できる。", "1777年 ボルタ"],
  ["pressure_vessel", "高圧容器", "🛢️", "tool", 3, "蒸気や気体の圧力に耐える頑丈な密閉容器。", "1679年 パパン/1909年 ハーバー"],
  ["vacuum_pump", "真空ポンプ", "🪈", "tool", 3, "水銀を使って容器内の空気を抜く装置。", "1650年 ゲーリケ/1855年 ガイスラー"],
  ["arc_furnace", "電気アーク炉", "⚡", "tool", 3, "電気の火花で3000℃以上に達する炉。燃焼では届かない温度が使える。", "1800年 デービー/1892年 モアッサン"]
);
_D.RECIPE_ROWS.push(
  [["pottery", "stone", "charcoal"], ["kiln"], "土器と石で囲いを作り、炭を焚くと、焚き火とは比べものにならない高温が保てた。"],
  [["wood", "fat"], ["bellows"], "革袋を木で挟み、押し引きして炭火に風を送ると、炎が激しく燃え上がった。"],
  [["kiln", "bellows", "bronze"], ["furnace"], "窯にふいごを青銅の管でつなぐと、鉄すら融かす高温が得られた。"],
  [["glass", "fire"], ["glass_flask"], "ガラスを再び熱して吹くと、透明な容器になった。", { t: [3, 5] }],
  [["pottery", "water", "glass_flask"], ["pneumatic_trough"], "水槽に逆さのガラス瓶を沈め、気体を泡で送り込むと、気体を瓶に溜められた。"],
  [["glass_flask", "battery", "copper"], ["eudiometer"], "ガラス管に電極を封じると、気体の量を測りながら火花を飛ばせた。"],
  [["iron", "steam", "bronze"], ["pressure_vessel"], "鉄の密閉容器に蒸気を閉じ込めると、中の圧力は驚くほど高まった。"],
  [["glass_flask", "mercury", "iron"], ["vacuum_pump"], "水銀を落として管内の空気を追い出すと、中が空っぽになった。"],
  [["battery", "copper", "charcoal"], ["arc_furnace"], "炭素の電極に電気を流すと、まばゆい火花の弧が生じた。燃焼では届かない温度だ。"]
);
// 温度段階の解放条件を「機材」に置き換え
_D.TEMPS[3].need = "kiln";
_D.TEMPS[4].need = "furnace";
_D.TEMPS[5].need = "arc_furnace";

// 必要設備(スロットには入れないが、手元になければ反応が進まない)
const _EQUIP_WHY = {
  glass_flask: "強い酸は、素焼きや金属の器を侵してしまう。もっと酸に耐える、中の見える容器が欲しい。",
  pneumatic_trough: "発生した気体が空中へ逃げて、捕まえられない。気体を泡として溜められる仕掛けが要りそうだ。",
  eudiometer: "気体の量を正確に測りながら、中で火花を飛ばせる装置がなければ、化合の様子が分からない。",
  pressure_vessel: "容器が圧力に耐えられず、反応が進まない。もっと頑丈な密閉容器が要りそうだ。",
  vacuum_pump: "管の中の空気を抜けない。空気を追い出す装置がなければ、真空にできない。",
};
_D.EQUIP_WHY = _EQUIP_WHY;
const _equip = (inp, ids) => { _rowOf(inp)[7] = ids; };
_equip(["vitriol", "alembic", "fire"], ["glass_flask"]);
_equip(["salt", "sulfuric"], ["glass_flask"]);
_equip(["saltpeter", "sulfuric", "alembic"], ["glass_flask"]);
_equip(["nitric", "hcl"], ["glass_flask"]);
_equip(["zinc", "sulfuric"], ["pneumatic_trough"]);
_equip(["limestone", "fire"], ["pneumatic_trough"]);
_equip(["charcoal", "air", "fire"], ["pneumatic_trough"]);
_equip(["hgo", "fire"], ["pneumatic_trough"]);
_equip(["battery", "water"], ["pneumatic_trough"]);
_equip(["urine", "lye"], ["pneumatic_trough"]);
_equip(["hydrogen", "oxygen", "fire"], ["eudiometer"]);
_equip(["hydrogen", "air", "iron"], ["pressure_vessel"]);
_equip(["air", "refrigerator"], ["pressure_vessel"]);
_equip(["glass", "copper", "battery"], ["vacuum_pump"]);

// 設備の系譜(技術タブで表示): [系統名, 基礎設備の説明, [設備ID...]]
_D.EQUIP_LINES = [
  ["🔥 加熱", "焚き火(〜400℃)", ["kiln", "furnace", "arc_furnace"]],
  ["🧪 容器・気体", "土器", ["glass_flask", "pneumatic_trough", "eudiometer"]],
  ["🗜️ 圧力・真空", "", ["pressure_vessel", "vacuum_pump"]],
  ["⚗️ 蒸留・分離", "", ["alembic", "filter", "refrigerator"]],
  ["🔬 計測・観測", "", ["mortar", "balance", "spectroscope", "microscope", "cyclotron"]],
];

// =====================================================================
// 設備の性能: 熱の安定度(温度精度) と 分離効率(収量)
// =====================================================================
_D.ITEM_ROWS.push(
  ["alcohol_lamp", "アルコールランプ", "🪔", "tool", 3, "芯に酒精を含ませて燃やす。煤の出ない静かな炎で、火力が安定する。", "18世紀"],
  ["thermometer", "温度計", "🌡️", "tool", 3, "細いガラス管の水銀の高さで温度を読む。『火加減』を数字で扱えるようになった。", "1714年 ファーレンハイト"],
  ["bunsen", "ブンゼンバーナー", "🔥", "tool", 3, "空気を混ぜて燃やす、煤の出ない高温で安定した炎。化学実験室の標準装備になった。", "1855年 ブンゼン"],
  ["centrifuge", "遠心分離機", "🌀", "tool", 4, "高速で回して、重い成分と軽い成分を一瞬で分ける。ろ過や沈殿の手間が大幅に減る。", "1883年 ド・ラバル"]
);
_D.RECIPE_ROWS.push(
  [["alcohol", "glass_flask"], ["alcohol_lamp"], "酒精を満たした瓶に芯を通して火を灯すと、煤の出ない静かな炎が長く保てた。"],
  [["mercury", "glass_flask"], ["thermometer"], "細いガラス管に水銀を封じると、熱するほどに銀の柱が伸びた。火加減が目で分かる。"],
  [["copper", "alcohol_lamp", "air"], ["bunsen"], "管に空気穴を開けて燃料と混ぜると、青く澄んだ高温の炎ができた。"],
  [["iron", "battery", "glass_flask"], ["centrifuge"], "電気で瓶を高速で回すと、重い粒が底に一瞬で集まった。"]
);
_D.DRIFT_BASE = 0.30; // 何の設備もないときの、火力が揺らぐ確率
_D.EQUIP_STAB = { kiln: 0.05, furnace: 0.05, alcohol_lamp: 0.04, thermometer: 0.08, bunsen: 0.08, arc_furnace: 0.04 }; // 揺らぎを減らす
_D.EQUIP_EFF = { balance: 0.25, microscope: 0.25, spectroscope: 0.25, centrifuge: 0.5 }; // 分離の1回あたりの進みを増やす
_D.EQUIP_LINES[0][2] = ["kiln", "furnace", "alcohol_lamp", "thermometer", "bunsen", "arc_furnace"];
_D.EQUIP_LINES[3][2] = ["alembic", "filter", "centrifuge", "refrigerator"];
_D.EQUIP_LINES[4][2] = ["mortar", "balance", "microscope", "spectroscope", "cyclotron"];

if (_isNode) module.exports = { _T, _rowOf, _D };
