(function (root) {
  'use strict';
  const VERSION = '1.3.1';
  const TRIGRAMS = [null,
    {id:1,name:'乾',image:'天',element:'金',lines:[1,1,1]},
    {id:2,name:'兌',image:'澤',element:'金',lines:[1,1,0]},
    {id:3,name:'離',image:'火',element:'火',lines:[1,0,1]},
    {id:4,name:'震',image:'雷',element:'木',lines:[1,0,0]},
    {id:5,name:'巽',image:'風',element:'木',lines:[0,1,1]},
    {id:6,name:'坎',image:'水',element:'水',lines:[0,1,0]},
    {id:7,name:'艮',image:'山',element:'土',lines:[0,0,1]},
    {id:8,name:'坤',image:'地',element:'土',lines:[0,0,0]}
  ];
  const MATRIX = [
    [1,10,13,25,44,6,33,12], [43,58,49,17,28,47,31,45],
    [14,38,30,21,50,64,56,35], [34,54,55,51,32,40,62,16],
    [9,61,37,42,57,59,53,20], [5,60,63,3,48,29,39,8],
    [26,41,22,27,18,4,52,23], [11,19,36,24,46,7,15,2]
  ];
  // 卦意與觀察問題是本工具的白話整理，不冒充經文或個案預測。
  const HEX = [null,
    ['乾','主動與持續','誰正在推動這件事？行動是否有明確方向？'],
    ['坤','承接與配合','目前需要承接什麼？配合的範圍是否清楚？'],
    ['屯','開端與阻滯','起步卡在哪一個具體環節？需要哪些支援？'],
    ['蒙','探索與釐清','哪些資訊還不清楚？誰能提供可核對的答案？'],
    ['需','等待與準備','正在等待什麼條件？等待期間能先準備什麼？'],
    ['訟','分歧與爭議','雙方對哪些條件的理解不同？有沒有明確文字？'],
    ['師','組織與紀律','誰負責決策、誰負責執行？安排是否一致？'],
    ['比','親近與結合','共同的需求是什麼？合作是否有實際行動？'],
    ['小畜','小幅累積','哪些小進展正在累積？哪個關鍵仍未到位？'],
    ['履','分寸與步驟','互動中有哪些界線？下一步是否合乎程序？'],
    ['泰','交流與相通','溝通是否順暢？雙方是否能回應彼此的需要？'],
    ['否','隔閡與停滯','訊息在哪裡中斷？是否存在尚未說出的分歧？'],
    ['同人','共識與連結','雙方在哪些事情上有共同立場？共識能否落實？'],
    ['大有','資源與承擔','可運用的資源有哪些？責任是否跟得上？'],
    ['謙','分寸與調整','是否能清楚表達需求，同時保留協商空間？'],
    ['豫','準備與動員','期待是否已有準備支撐？大家的步調是否一致？'],
    ['隨','回應與調適','正在跟隨誰的節奏？調整後是否仍符合原意？'],
    ['蠱','整頓與修復','哪些舊問題需要先處理？責任與修復方式是否清楚？'],
    ['臨','接近與接觸','雙方是否更靠近核心問題？接觸是否帶來新資訊？'],
    ['觀','觀察與理解','目前看見哪些事實？哪些仍只是自己的推測？'],
    ['噬嗑','處理阻礙','最需要處理的障礙是什麼？是否有清楚的解法？'],
    ['賁','呈現與實質','外在呈現是否反映實際內容？有什麼需要核對？'],
    ['剝','減損與鬆動','哪些條件正在鬆動？核心部分是否仍穩定？'],
    ['復','回返與重啟','是否出現重新聯絡或再次嘗試？與之前有何不同？'],
    ['無妄','真實與自然','是否依據已知事實行動？有沒有額外的期待投射？'],
    ['大畜','積累與節制','目前累積了什麼？是否具備進一步行動的條件？'],
    ['頤','供給與言語','彼此真正需要什麼？言語是否有實際內容支撐？'],
    ['大過','負荷與失衡','是否有人承擔過多？哪一部分最需要調整？'],
    ['坎','重複的難處','同樣的障礙是否反覆出現？有哪些尚未釐清的風險？'],
    ['離','明晰與依附','哪些資訊更清楚了？事情依賴什麼條件維持？'],
    ['咸','感應與互動','雙方是否互有回應？回應停在感受還是已有行動？'],
    ['恆','持續與穩定','言行是否前後一致？是否願意持續投入？'],
    ['遯','保留與退讓','是否出現保留、暫緩或退一步的說法？原因是什麼？'],
    ['大壯','力量與分寸','推進的力道是否合適？有沒有超出對方可接受的範圍？'],
    ['晉','進展與顯現','是否出現可核對的進展？下一步是否變得清楚？'],
    ['明夷','收斂與保護','哪些想法尚未表達？目前需要保留什麼空間？'],
    ['家人','角色與內部共識','參與者如何分工？內部意見是否已取得一致？'],
    ['睽','差異與分歧','彼此重視的事情有何不同？有沒有交集？'],
    ['蹇','阻礙與求助','目前的難處在哪裡？是否需要換方法或尋求協助？'],
    ['解','鬆動與化解','哪個障礙正在解除？後續是否有相應行動？'],
    ['損','取捨與減量','各方願意放下什麼？取捨是否對等且明確？'],
    ['益','增益與互助','是否出現實際支持？資源或條件有沒有改善？'],
    ['夬','決斷與表明','哪些事情需要說清楚？決定是否已有依據？'],
    ['姤','相遇與新因素','接觸帶來哪些新資訊？有沒有預期之外的條件？'],
    ['萃','聚合與協調','參與者是否聚焦同一目標？還需要誰加入討論？'],
    ['升','漸進與累積','事情是否逐步推進？每一步是否有實際承接？'],
    ['困','受限與耐心','是資源、時間還是溝通受限？限制有沒有改變？'],
    ['井','根本與供給','核心需求是否得到滿足？長期可用的條件是什麼？'],
    ['革','改變與重訂','哪些條件需要重新約定？改變是否得到認同？'],
    ['鼎','整合與更新','現有資源如何重新組合？新的安排是否可行？'],
    ['震','觸動與反應','是否出現突然的消息或變動？各方如何回應？'],
    ['艮','暫停與界線','哪一部分需要暫停確認？停止與繼續的條件是什麼？'],
    ['漸','循序與成熟','進展是否依序展開？是否給足確認與準備的時間？'],
    ['歸妹','次序與配合','角色、次序或期待是否不一致？哪些條件尚未齊備？'],
    ['豐','資訊與盛況','資訊是否足夠且清楚？熱絡之中有沒有遺漏細節？'],
    ['旅','暫時與適應','這段互動是暫時接觸還是長期安排？界線是否清楚？'],
    ['巽','漸入與溝通','訊息是否逐步傳達？對方有沒有真正理解？'],
    ['兌','交流與表達','對話是否坦誠？愉快的互動是否形成具體共識？'],
    ['渙','分散與疏通','分散的意見能否重新聚焦？哪些阻隔開始鬆開？'],
    ['節','規範與限度','預算、時間與範圍是否明確？限制是否可以共同接受？'],
    ['中孚','信任與一致','承諾與行動是否一致？信任有什麼具體依據？'],
    ['小過','細節與適度','細節是否影響進展？是否需要小幅而非大幅調整？'],
    ['既濟','完成與維持','哪些部分已完成？是否仍有收尾或確認事項？'],
    ['未濟','未完與銜接','距離完成還差哪一步？前後環節是否接得上？']
  ];
  // 《周易》經文：依 sources/zhouyi-lines.json 整理，按卦序與自下而上爻位索引。
  const LINE_TEXTS = [null,
    ["潛龍勿用。", "見龍在田，利見大人。", "君子終日乾乾，夕惕若；厲，无咎。", "或躍在淵，无咎。", "飛龍在天，利見大人。", "亢龍，有悔。"], // 1 乾
    ["履霜，堅冰至。", "直方大，不習无不利。", "含章，可貞。或從王事，无成有終。", "括囊，无咎无譽。", "黃裳，元吉。", "龍戰于野，其血玄黃。"], // 2 坤
    ["磐桓，利居貞，利建侯。", "屯如邅如，乘馬班如，匪寇婚媾，女子貞不字，十年乃字。", "即鹿无虞，惟入于林中，君子幾不如舍，往吝。", "乘馬班如，求婚媾，往，吉无不利。", "屯其膏；小貞吉，大貞凶。", "乘馬班如，泣血漣如。"], // 3 屯
    ["發蒙，利用刑人，用說桎梏，以往吝。", "包蒙吉，納婦吉，子克家。", "勿用取女，見金夫，不有躬，无攸利。", "困蒙，吝。", "童蒙，吉。", "擊蒙，不利為寇，利禦寇。"], // 4 蒙
    ["需于郊，利用恆，无咎。", "需于沙，小有言，終吉。", "需于泥，致寇至。", "需于血，出自穴。", "需于酒食，貞吉。", "入于穴，有不速之客三人來，敬之終吉。"], // 5 需
    ["不永所事，小有言，終吉。", "不克訟，歸而逋，其邑人三百戶无眚。", "食舊德，貞厲，終吉。或從王事，无成。", "不克訟，復即命渝，安貞吉。", "訟，元吉。", "或錫之鞶帶，終朝三褫之。"], // 6 訟
    ["師出以律，否臧，凶。", "在師中吉，无咎；王三錫命。", "師或輿尸，凶。", "師左次，无咎。", "田有禽，利執言，无咎。長子帥師，弟子輿尸，貞凶。", "大君有命，開國承家，小人勿用。"], // 7 師
    ["有孚，比之，无咎。有孚盈缶，終來有它，吉。", "比之自內，貞吉。", "比之匪人。", "外比之，貞吉。", "顯比。王用三驅，失前禽，邑人不誡，吉。", "比之无首，凶。"], // 8 比
    ["復自道，何其咎，吉。", "牽復，吉。", "輿說輻，夫妻反目。", "有孚，血去惕出，无咎。", "有孚攣如，富以其鄰。", "既雨既處，尚德載，婦貞厲，月幾望，君子征凶。"], // 9 小畜
    ["素履，往无咎。", "履道坦坦，幽人貞吉。", "眇能視，跛能履，履虎尾，咥人，凶。武人為于大君。", "履虎尾，愬愬終吉。", "夬履，貞厲。", "視履考祥，其旋元吉。"], // 10 履
    ["拔茅茹以其彙，征吉。", "包荒。用馮河，不遐遺；朋亡。得尚于中行。", "无平不陂，无往不復，艱貞无咎。勿恤其孚，于食有福。", "翩翩，不富以其鄰；不戒以孚。", "帝乙歸妹，以祉，元吉。", "城復于隍，勿用師，自邑告命，貞吝。"], // 11 泰
    ["拔茅茹以其彙，貞吉。亨。", "包承，小人吉，大人否。亨。", "包羞。", "有命，无咎，疇離祉。", "休否，大人吉。其亡其亡，繫于苞桑。", "傾否，先否後喜。"], // 12 否
    ["同人于門，無咎。", "同人于宗，吝。", "伏戎于莽，升其高陵，三歲不興。", "乘其墉，弗克，攻吉。", "同人，先號啕而后笑。大師克相遇。", "同人于郊，無悔。"], // 13 同人
    ["无交害，匪咎，艱則无咎。", "大車以載，有攸往，无咎。", "公用亨于天子，小人弗克。", "匪其彭，无咎。", "厥孚交如，威如；吉。", "自天佑之，吉无不利。"], // 14 大有
    ["謙謙君子，用涉大川，吉。", "鳴謙，貞吉。", "勞謙君子，有終吉。", "无不利，撝謙。", "不富，以其鄰，利用侵伐，无不利。", "鳴謙，利用行師，征邑國。"], // 15 謙
    ["鳴豫，凶。", "介于石，不終日，貞吉。", "盱豫，悔。遲有悔。", "由豫，大有得。勿疑。朋盍簪。", "貞疾，恆不死。", "冥豫，成有渝，无咎。"], // 16 豫
    ["官有渝，貞吉。出門交有功。", "系小子，失丈夫。", "系丈夫，失小子。隨，有求得利，居貞。", "隨有獲，貞凶。有孚在道，以明，何咎。", "孚于嘉，吉。", "拘系之，乃從維之。王用亨于西山。"], // 17 隨
    ["幹父之蠱，有子考，无咎，厲終吉。", "幹母之蠱，不可貞。", "幹父之蠱，小有悔，无大咎。", "裕父之蠱，往見吝。", "幹父之蠱，用譽。", "不事王侯，高尚其事。"], // 18 蠱
    ["咸臨，貞吉。", "咸臨，吉无不利。", "甘臨，无攸利。既憂之，无咎。", "至臨，无咎。", "知臨，大君之宜，吉。", "敦臨，吉无咎。"], // 19 臨
    ["童觀，小人无咎，君子吝。", "窺觀，利女貞。", "觀我生，進退。", "觀國之光，利用賓于王。", "觀我生，君子无咎。", "觀其生，君子无咎。"], // 20 觀
    ["屨校滅趾，无咎。", "噬膚滅鼻，无咎。", "噬臘肉，遇毒；小吝，无咎。", "噬乾胏，得金矢，利艱貞，吉。", "噬乾肉，得黃金，貞厲，无咎。", "何校滅耳，凶。"], // 21 噬嗑
    ["賁其趾，舍車而徒。", "賁其須。", "賁如濡如，永貞吉。", "賁如皤如，白馬翰如，匪寇婚媾。", "賁於丘園，束帛戔戔，吝，終吉。", "白賁，无咎。"], // 22 賁
    ["剝牀以足，蔑貞凶。", "剝牀以辨，蔑貞凶。", "剝之，无咎。", "剝牀以膚，凶。", "貫魚，以宮人寵，无不利。", "碩果不食，君子得輿，小人剝廬。"], // 23 剝
    ["不復遠，无袛悔，元吉。", "休復，吉。", "頻復，厲无咎。", "中行獨復。", "敦復，无悔。", "迷復，凶，有災眚。用行師，終有大敗，以其國君，凶；至于十年，不克征。"], // 24 復
    ["无妄，往吉。", "不耕穫，不菑畬，則利有攸往。", "无妄之災，或系之牛，行人之得，邑人之災。", "可貞，无咎。", "无妄之疾，勿藥有喜。", "无妄，行有眚，无攸利。"], // 25 无妄
    ["有厲利已。", "輿說輹。", "良馬逐，利艱貞。曰閑輿衛，利有攸往。", "童牛之牿，元吉。", "豶豕之牙，吉。", "何天之衢，亨。"], // 26 大畜
    ["舍爾靈龜，觀我朵頤，凶。", "顛頤，拂經，于丘頤，征凶。", "拂頤，貞凶，十年勿用，无攸利。", "顛頤吉，虎視眈眈，其欲逐逐，无咎。", "拂經，居貞吉，不可涉大川。", "由頤，厲吉，利涉大川。"], // 27 頤
    ["藉用白茅，无咎。", "枯楊生稊，老夫得其女妻，无不利。", "棟橈，凶。", "棟隆，吉。有它吝。", "枯楊生華，老婦得其士夫，无咎无譽。", "過涉滅頂，凶，无咎。"], // 28 大過
    ["習坎，入于坎窞，凶。", "坎有險，求小得。", "來之坎坎，險且枕，入于坎窞，勿用。", "樽酒簋貳，用缶，納約自牖，終无咎。", "坎不盈，祗既平，无咎。", "係用徽纆，寘于叢棘，三歲不得，凶。"], // 29 坎
    ["履錯然，敬之无咎。", "黃離，元吉。", "日昃之離，不鼓缶而歌，則大耋之嗟，凶。", "突如其來如，焚如，死如，棄如。", "出涕沱若，戚嗟若，吉。", "王用出征，有嘉折首，獲匪其醜，无咎。"], // 30 離
    ["咸其拇。", "咸其腓，凶，居吉。", "咸其股，執其隨，往吝。", "貞吉悔亡，憧憧往來，朋從爾思。", "咸其脢，无悔。", "咸其輔，頰，舌。"], // 31 咸
    ["浚恆，貞凶，无攸利。", "悔亡。", "不恆其德，或承之羞，貞吝。", "田无禽。", "恆其德，貞，婦人吉，夫子凶。", "振恆，凶。"], // 32 恒
    ["遯尾，厲，勿用有攸往。", "執之用黃牛之革，莫之勝說。", "系遯，有疾厲，畜臣妾吉。", "好遯君子吉，小人否。", "嘉遯，貞吉。", "肥遯，无不利。"], // 33 遯
    ["壯于趾，征凶，有孚。", "貞吉。", "小人用壯，君子用罔，貞厲。羝羊觸藩，羸其角。", "貞吉悔亡，藩決不羸，壯于大輿之輹。", "喪羊于易，无悔。", "羝羊觸藩，不能退，不能遂，无攸利，艱則吉。"], // 34 大壯
    ["晉如，摧如，貞吉。罔孚，裕无咎。", "晉如，愁如，貞吉。受茲介福，于其王母。", "眾允，悔亡。", "晉如鼫鼠，貞厲。", "悔亡，失得勿恤，往吉无不利。", "晉其角，維用伐邑，厲吉无咎，貞吝。"], // 35 晉
    ["明夷于飛，垂其翼。君子于行，三日不食，有攸往，主人有言。", "明夷，夷于左股，用拯馬壯，吉。", "明夷于南狩，得其大首，不可疾貞。", "入于左腹，獲明夷之心，于出門庭。", "箕子之明夷，利貞。", "不明晦，初登于天，后入于地。"], // 36 明夷
    ["閑有家，悔亡。", "无攸遂，在中饋，貞吉。", "家人嗃嗃，悔厲吉；婦子嘻嘻，終吝。", "富家，大吉。", "王假有家，勿恤。吉。", "有孚威如，終吉。"], // 37 家人
    ["悔亡，喪馬勿逐，自復；見惡人无咎。", "遇主于巷，无咎。", "見輿曳，其牛掣，其人天且劓，无初有終。", "睽孤，遇元夫，交孚，厲无咎。", "悔亡，厥宗噬膚，往何咎。", "睽孤， 見豕負涂，載鬼一車， 先張之弧，后說之弧，匪寇婚媾，往遇雨則吉。"], // 38 睽
    ["往蹇，來譽。", "王臣蹇蹇，匪躬之故。", "往蹇來反。", "往蹇來連。", "大蹇朋來。", "往蹇來碩，吉；利見大人。"], // 39 蹇
    ["无咎。", "田獲三狐，得黃矢，貞吉。", "負且乘，致寇至，貞吝。", "解而拇，朋至斯孚。", "君子維有解，吉；有孚于小人。", "公用射隼，于高墉之上，獲之，无不利。"], // 40 解
    ["已事遄往，无咎，酌損之。", "利貞，征凶，弗損益之。", "三人行，則損一人；一人行，則得其友。", "損其疾，使遄有喜，无咎。", "或益之，十朋之龜弗克違，元吉。", "弗損益之，无咎，貞吉，利有攸往，得臣无家。"], // 41 損
    ["利用為大作，元吉，无咎。", "或益之，十朋之龜弗克違，永貞吉。王用享于帝，吉。", "益之用凶事，无咎。有孚中行，告公用圭。", "中行，告公從。利用為依遷國。", "有孚惠心，勿問元吉。有孚惠我德。", "莫益之，或擊之，立心勿恆，凶。"], // 42 益
    ["壯于前趾，往不勝為咎。", "惕號，莫夜有戎，勿恤。", "壯于頄，有凶。君子夬夬，獨行遇雨，若濡有慍，无咎。", "臀无膚，其行次且。牽羊悔亡，聞言不信。", "莧陸夬夬，中行无咎。", "无號，終有凶。"], // 43 夬
    ["系于金柅，貞吉，有攸往，見凶，羸豕孚踟躅。", "包有魚，无咎，不利賓。", "臀无膚，其行次且，厲，无大咎。", "包无魚，起凶。", "以杞包瓜，含章，有隕自天。", "姤其角，吝，无咎。"], // 44 姤
    ["有孚不終，乃亂乃萃，若號一握為笑，勿恤，往无咎。", "引吉，无咎，孚乃利用禴。", "萃如，嗟如，无攸利，往无咎，小吝。", "大吉，无咎。", "萃有位，无咎。匪孚，元永貞，悔亡。", "齎咨涕洟，无咎。"], // 45 萃
    ["允升，大吉。", "孚乃利用禴，无咎。", "升虛邑。", "王用亨于岐山，吉无咎。", "貞吉，升階。", "冥升，利于不息之貞。"], // 46 升
    ["臀困于株木，入于幽谷，三歲不覿。", "困于酒食，朱紱方來，利用亨祀，征凶，无咎。", "困于石，據于蒺藜，入于其宮，不見其妻，凶。", "來徐徐，困于金車，吝，有終。", "劓刖，困于赤紱，乃徐有說，利用祭祀。", "困于葛藟，于臲卼，曰動悔。有悔，征吉。"], // 47 困
    ["井泥不食，舊井无禽。", "井谷射鮒，瓮敝漏。", "井渫不食，為我心惻，可用汲，王明，并受其福。", "井甃，无咎。", "井冽，寒泉食。", "井收勿幕，有孚元吉。"], // 48 井
    ["鞏用黃牛之革。", "巳日乃革之，征吉，无咎。", "征凶，貞厲，革言三就，有孚。", "悔亡，有孚改命，吉。", "大人虎變，未占有孚。", "君子豹變，小人革面，征凶，居貞吉。"], // 49 革
    ["鼎顛趾，利出否，得妾以其子，无咎。", "鼎有實，我仇有疾，不我能即，吉。", "鼎耳革，其行塞，雉膏不食，方雨虧悔，終吉。", "鼎折足，覆公餗，其形渥，凶。", "鼎黃耳金鉉，利貞。", "鼎玉鉉，大吉，无不利。"], // 50 鼎
    ["震來虩虩，后笑言啞啞，吉。", "震來厲，億喪貝，躋于九陵，勿逐，七日得。", "震蘇蘇，震行无眚。", "震遂泥。", "震往來厲，億无喪，有事。", "震索索，視矍矍，征凶。震不于其躬，于其鄰，无咎。婚媾有言。"], // 51 震
    ["艮其趾，无咎，利永貞。", "艮其腓，不拯其隨，其心不快。", "艮其限，列其夤，厲薰心。", "艮其身，无咎。", "艮其輔，言有序，悔亡。", "敦艮，吉。"], // 52 艮
    ["鴻漸于干，小子厲，有言，无咎。", "鴻漸于磐，飲食衎衎，吉。", "鴻漸于陸，夫征不復，婦孕不育，凶；利禦寇。", "鴻漸于木，或得其桷，无咎。", "鴻漸于陵，婦三歲不孕，終莫之勝，吉。", "鴻漸于陸，其羽可用為儀，吉。"], // 53 漸
    ["歸妹以娣，跛能履，征吉。", "眇能視，利幽人之貞。", "歸妹以須，反歸以娣。", "歸妹愆期，遲歸有時。", "帝乙歸妹，其君之袂，不如其娣之袂良，月幾望，吉。", "女承筐无實，士刲羊无血，无攸利。"], // 54 歸妹
    ["遇其配主，雖旬无咎，往有尚。", "豐其蔀，日中見斗，往得疑疾，有孚發若，吉。", "豐其沛，日中見沫，折其右肱，无咎。", "豐其蔀，日中見斗，遇其夷主，吉。", "來章，有慶譽，吉。", "豐其屋，蔀其家，窺其戶，闃其无人，三歲不觌，凶。"], // 55 豐
    ["旅瑣瑣，斯其所取災。", "旅即次，懷其資，得童僕貞。", "旅焚其次，喪其童僕，貞厲。", "旅于處，得其資斧，我心不快。", "射雉一矢亡，終以譽命。", "鳥焚其巢，旅人先笑后號咷。喪牛于易，凶。"], // 56 旅
    ["進退，利武人之貞。", "巽在牀下，用史巫紛若，吉无咎。", "頻巽，吝。", "悔亡，田獲三品。", "貞吉悔亡，无不利。无初有終，先庚三日，后庚三日，吉。", "巽在牀下，喪其資斧，貞凶。"], // 57 巽
    ["和兌，吉。", "孚兌，吉，悔亡。", "來兌，凶。", "商兌，未寧，介疾有喜。", "孚于剝，有厲。", "引兌。"], // 58 兌
    ["用拯馬壯，吉。", "渙奔其机，悔亡。", "渙其躬，无悔。", "渙其群，元吉。渙有丘，匪夷所思。", "渙汗其大號，渙王居，无咎。", "渙其血，去逖出，无咎。"], // 59 渙
    ["不出戶庭，无咎。", "不出門庭，凶。", "不節若，則嗟若，无咎。", "安節，亨。", "甘節，吉；往有尚。", "苦節，貞凶，悔亡。"], // 60 節
    ["虞吉，有他不燕。", "鳴鶴在陰，其子和之，我有好爵，吾與爾靡之。", "得敵，或鼓或罷，或泣或歌。", "月几望，馬匹亡，无咎。", "有孚攣如，无咎。", "翰音登于天，貞凶。"], // 61 中孚
    ["飛鳥以凶。", "過其祖，遇其妣；不及其君，遇其臣；无咎。", "弗過防之，從或戕之，凶。", "无咎，弗過遇之。往厲必戒，勿用永貞。", "密云不雨，自我西郊，公弋取彼在穴。", "弗遇過之，飛鳥離之，凶，是謂災眚。"], // 62 小過
    ["曳其輪，濡其尾，无咎。", "婦喪其茀，勿逐，七日得。", "高宗伐鬼方，三年克之，小人勿用。", "繻有衣袽，終日戒。", "東鄰殺牛，不如西鄰之禴祭，實受其福。", "濡其首，厲。"], // 63 既濟
    ["濡其尾，吝。", "曳其輪，貞吉。", "未濟，征凶，利涉大川。", "貞吉，悔亡，震用伐鬼方，三年有賞于大國。", "貞吉，无悔，君子之光，有孚，吉。", "有孚于飲酒，无咎，濡其首，有孚失是。"] // 64 未濟
  ];
  const STEMS = '甲乙丙丁戊己庚辛壬癸';
  const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
  const GEN = {木:'火',火:'土',土:'金',金:'水',水:'木'};
  const CTRL = {木:'土',土:'水',水:'火',火:'金',金:'木'};
  const mod = (n,m) => ((n%m)+m)%m;
  const remainder = (n,m) => mod(n,m)||m;
  const trigFromLines = lines => TRIGRAMS.slice(1).find(t=>t.lines.join('')===lines.join(''));
  const pad = n=>String(n).padStart(2,'0');
  function hexagram(upper, lower) {
    const u=TRIGRAMS[upper],l=TRIGRAMS[lower];
    if(!u||!l)throw new Error('卦數須為 1 至 8。');
    const id=MATRIX[upper-1][lower-1],d=HEX[id];
    return {id,name:d[0],fullName:upper===lower?d[0]+'為'+u.image:u.image+l.image+d[0],theme:d[1],question:d[2],upper:u,lower:l,lines:[...l.lines,...u.lines],symbol:String.fromCodePoint(0x4DC0+id-1)};
  }
  function lineCitation(h, position) {
    if(!Number.isInteger(position)||position<1||position>6)throw new Error('爻位須為 1 至 6。');
    const yinYang=h.lines[position-1]?'九':'六';
    const label=position===1?'初'+yinYang:position===6?'上'+yinYang:yinYang+['','一','二','三','四','五','六'][position];
    const sourceName=({25:'无妄',32:'恒'})[h.id]||h.name;
    return {label,text:LINE_TEXTS[h.id][position-1],source:'https://zh.wikisource.org/wiki/周易/'+encodeURIComponent(sourceName)};
  }
  function relation(body, other) {
    if(body===other)return {type:'比和',detail:'體用同氣',meaning:'需求與節奏有相互配合的象徵。',observe:'雙方是否能就同一件事達成具體共識？'};
    if(GEN[other]===body)return {type:'用生體',detail:other+'生'+body,meaning:'外在支持、條件有助於我方的象徵。',observe:'是否出現主動回應、資源支持或實際承諾？'};
    if(GEN[body]===other)return {type:'體生用',detail:body+'生'+other,meaning:'我方較多投入、付出或配合的象徵。',observe:'投入是否得到回應？時間與心力是否主要由我方承擔？'};
    if(CTRL[other]===body)return {type:'用剋體',detail:other+'剋'+body,meaning:'外在條件帶來限制或協商壓力的象徵。',observe:'是否出現具體歧見、附加條件或推進上的阻礙？'};
    return {type:'體剋用',detail:body+'剋'+other,meaning:'我方需要主動處理、協調與推進的象徵。',observe:'是否需要我方提出方案？阻礙能否透過行動解決？'};
  }
  function build(upper, lower, moving) {
    if(!Number.isInteger(moving)||moving<1||moving>6)throw new Error('動爻須為 1 至 6。');
    const base=hexagram(upper,lower),bits=base.lines.slice();bits[moving-1]^=1;
    const changed=hexagram(trigFromLines(bits.slice(3)).id,trigFromLines(bits.slice(0,3)).id);
    // 一律取本卦 2–4 爻、3–5 爻。純乾純坤亦取本卦互體；此約定會隨輸出註明。
    const mutual=hexagram(trigFromLines(base.lines.slice(2,5)).id,trigFromLines(base.lines.slice(1,4)).id);
    const bodyPosition=moving<=3?'upper':'lower',usePosition=moving<=3?'lower':'upper';
    const body=base[bodyPosition],use=base[usePosition],changedUse=changed[usePosition];
    const yinYang=base.lines[moving-1]?'九':'六';
    const movingName=moving===1?'初'+yinYang:moving===6?'上'+yinYang:yinYang+['','一','二','三','四','五','六'][moving];
    return {base,mutual,changed,moving,movingName,movingText:lineCitation(base,moving),changedText:lineCitation(changed,moving),body,use,bodyPosition,usePosition,changedUse,initialRelation:relation(body.element,use.element),changedRelation:relation(body.element,changedUse.element),mutualRelations:[relation(body.element,mutual.upper.element),relation(body.element,mutual.lower.element)]};
  }
  function dateParts(date,time) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))throw new Error('請填寫完整的日期與時間。');
    const [y,m,d]=date.split('-').map(Number),[h,min]=time.split(':').map(Number);
    const value=new Date(Date.UTC(y,m-1,d,12));
    if(value.getUTCFullYear()!==y||value.getUTCMonth()!==m-1||value.getUTCDate()!==d||h>23||min>59)throw new Error('日期或時間無效。');
    if(date<'1900-01-31'||date>'2100-12-31')throw new Error('支援國曆 1900-01-31 至 2100-12-31。');
    return {y,m,d,h,min,value};
  }
  function lunarInfo(date,time,rollover='midnight') {
    if(!['midnight','zi'].includes(rollover))throw new Error('換日方式無效。');
    const p=dateParts(date,time),shifted=rollover==='zi'&&p.h===23;
    if(shifted)p.value.setUTCDate(p.value.getUTCDate()+1);
    const formatter=new Intl.DateTimeFormat('en-u-ca-chinese',{timeZone:'UTC',year:'numeric',month:'numeric',day:'numeric'});
    if(formatter.resolvedOptions().calendar!=='chinese')throw new Error('此瀏覽器不支援農曆換算，請使用新版 Chrome、Safari 或 Firefox，或改用數字起卦。');
    const parts=Object.fromEntries(formatter.formatToParts(p.value).map(x=>[x.type,x.value]));
    const year=Number(parts.relatedYear),month=parseInt(parts.month,10),day=Number(parts.day),leap=/bis|leap/i.test(parts.month);
    if(!Number.isInteger(year)||!Number.isInteger(month)||!Number.isInteger(day)||month<1||month>12||day<1||day>30)throw new Error('無法取得正確農曆資料，請改用數字起卦。');
    const branchIndex=mod(year-4,12),hourIndex=Math.floor((p.h+1)/2)%12;
    return {year,month,day,leap,yearName:STEMS[mod(year-4,10)]+BRANCHES[branchIndex],yearNumber:branchIndex+1,hourName:BRANCHES[hourIndex],hourNumber:hourIndex+1,shifted,effectiveDate:p.value.toISOString().slice(0,10),label:STEMS[mod(year-4,10)]+BRANCHES[branchIndex]+'年・'+(leap?'閏':'')+month+'月'+day+'日・'+BRANCHES[hourIndex]+'時'};
  }
  function fromTime(date,time,rollover='midnight') {
    const lunar=lunarInfo(date,time,rollover),sum=lunar.yearNumber+lunar.month+lunar.day,total=sum+lunar.hourNumber;
    return {...build(remainder(sum,8),remainder(total,8),remainder(total,6)),method:'time',source:{date,time,rollover,lunar},calculation:[{label:'上卦',text:`${lunar.yearNumber}＋${lunar.month}＋${lunar.day}＝${sum}；除以 8 餘 ${sum%8}${sum%8===0?'，取 8':''}`},{label:'下卦',text:`${sum}＋${lunar.hourNumber}＝${total}；除以 8 餘 ${total%8}${total%8===0?'，取 8':''}`},{label:'動爻',text:`${total} 除以 6 餘 ${total%6}${total%6===0?'，取 6':''}`} ]};
  }
  function fromNumbers(a,b,c) {
    const nums=[a,b,c];
    if(nums.some(n=>!Number.isSafeInteger(n)||n<1||n>999999999))throw new Error('請輸入 1 至 999999999 的整數。');
    return {...build(remainder(a,8),remainder(b,8),remainder(c,6)),method:'numbers',source:{numbers:nums},calculation:nums.map((n,i)=>({label:['上卦','下卦','動爻'][i],text:`${n} 除以 ${i===2?6:8} 餘 ${n%(i===2?6:8)}${n%(i===2?6:8)===0?'，取 '+(i===2?6:8):''}`}))};
  }
  function taipeiNow() {
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(x=>[x.type,x.value]));
    return {date:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`};
  }
  function calculate(input) {
    if(!input||typeof input!=='object')throw new Error('起卦資料無效。');
    if(input.method==='time')return fromTime(input.date,input.time,input.rollover);
    if(['numbers','random'].includes(input.method)&&Array.isArray(input.numbers)&&input.numbers.length===3){const result=fromNumbers(...input.numbers);if(input.method==='random'&&input.numbers.some(n=>n>960))throw new Error('隨機起卦數字須為 1 至 960。');return {...result,method:input.method};}
    throw new Error('起卦方式無效。');
  }
  function textReport(record) {
    const r=calculate(record.input),timeSource=r.method==='time'?`指定時間：${r.source.date} ${r.source.time}（台灣 UTC+8）\n農曆：${r.source.lunar.label}\n年支數 ${r.source.lunar.yearNumber}；月數 ${r.source.lunar.month}；日數 ${r.source.lunar.day}；時數 ${r.source.lunar.hourNumber}\n換日：${r.source.rollover==='zi'?'23:00 子初換日':'00:00 午夜換日'}${r.source.lunar.shifted?'（已按次日農曆計算）':''}\n閏月：沿用原月數；不把分鐘另行加數。`:`${r.method==='random'?'系統隨機產生；範圍 1–960。\n':''}三數：${r.source.numbers.join('、')}\n第一數取上卦，第二數取下卦，第三數直接除以 6 取動爻，不另加時辰。`;
    const lineDetail=[5,4,3,2,1,0].map(i=>`第 ${i+1} 爻：${r.base.lines[i]?'陽':'陰'}${i+1===r.moving?'（動，變'+(r.base.lines[i]?'陰':'陽')+'）':''}`).join('\n');
    return `【梅花易數解盤資料｜小六太乙・梅花觀象 v${VERSION}】\n\n【問事】\n${record.question||'未填寫'}\n\n【起卦前已知的實際狀況】\n${record.context||'未填寫'}\n\n【起卦方法】\n${r.method==='time'?'年月日時起卦':r.method==='random'?'隨機起卦（系統產生三數，第三數獨立取動爻）':'三數起卦（第三數獨立取動爻）'}\n${timeSource}\n紀錄建立時間：${record.createdAt||'未提供'}\n\n【演算】\n${r.calculation.map(x=>x.label+'：'+x.text).join('\n')}\n\n【卦象】\n本卦：第 ${r.base.id} 卦・${r.base.fullName}（上${r.base.upper.name}下${r.base.lower.name}）\n動爻：${r.movingName}，自下往上第 ${r.moving} 爻\n互卦：第 ${r.mutual.id} 卦・${r.mutual.fullName}（上${r.mutual.upper.name}下${r.mutual.lower.name}）\n變卦：第 ${r.changed.id} 卦・${r.changed.fullName}（上${r.changed.upper.name}下${r.changed.lower.name}）\n互卦約定：本卦第 2–4 爻為下互，第 3–5 爻為上互；純乾純坤也依本卦取互體。\n\n【動爻爻辭・《周易》原文】\n本卦動爻｜${r.base.fullName}・${r.movingText.label}：${r.movingText.text}\n原典：${r.movingText.source}\n變卦同位爻（對照）｜${r.changed.fullName}・${r.changedText.label}：${r.changedText.text}\n原典：${r.changedText.source}\n變卦同位爻指陰陽變化後的同一爻位，並非另起一個動爻。\n\n【本卦六爻・由上至下】\n${lineDetail}\n\n【體用】\n本卦不動的三爻卦為體，含動爻的三爻卦為用；變卦沿用本卦體卦。\n體：${r.bodyPosition==='upper'?'上':'下'}卦${r.body.name}，五行${r.body.element}\n用：${r.usePosition==='upper'?'上':'下'}卦${r.use.name}，五行${r.use.element}\n本卦：${r.initialRelation.type}（${r.initialRelation.detail}）\n互卦上卦${r.mutual.upper.name}${r.mutual.upper.element}對體：${r.mutualRelations[0].type}\n互卦下卦${r.mutual.lower.name}${r.mutual.lower.element}對體：${r.mutualRelations[1].type}\n變用：${r.changedUse.name}${r.changedUse.element}；對本卦體：${r.changedRelation.type}（${r.changedRelation.detail}）\n\n【事前想觀察的重點】\n${record.expected||'尚未填寫'}\n\n【事後實際發展】\n${record.actual||'尚未回填'}\n進度：${record.status||'待觀察'}\n對照結果：${record.match||'尚未對照'}\n\n【請協助解讀】\n請用繁體中文，以梅花易數體用生剋為主要脈絡，綜合本卦、互卦、變卦與動爻解讀；若有實際時間，再考量季節旺衰。區分「已知事實」「卦象推論」「待觀察事項」，說明支持與不支持的線索，不編造對方心理或成交機率。若引用卦爻辭，請核對原典，不把白話摘要當成原文。請提出 3 個具體觀察點；若已有事後紀錄，也列出對得上、對不上與資訊不足的地方，不事後硬套。我的用途是搭配實際狀態觀察，請聚焦解盤與核對。`;
  }
  const api={VERSION,TRIGRAMS,HEX,MATRIX,hexagram,build,lineCitation,relation,lunarInfo,fromTime,fromNumbers,taipeiNow,calculate,textReport};
  root.Meihua=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
