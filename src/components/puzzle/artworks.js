import mainArt from '../../../Art/Main-art/Mainart.JPG'
import q from '../../../Art/Main-art/q.jpg'
import old from '../../../Art/Main-art/old.jpg'
import long from '../../../Art/Main-art/long/long.jpg'
import long1 from '../../../Art/Main-art/long/long1.jpg'
import long2 from '../../../Art/Main-art/long/long2.jpg'
import long3 from '../../../Art/Main-art/long/long3.jpg'

const settings = {version: 1, difficulties: [24, 96, 180], difficultyNames: ['簡單', '普通', '困難'], frame: 'css'}
const avatarImages = import.meta.glob('../../../Art/avatar/*.{jpg,jpeg,png,JPG,JPEG,PNG}', {eager: true, query: '?url', import: 'default'})
const avatarSharedInfo = {artist: 'Art by.REMOANPU', canvasSize: '2048 × 2048', year: '2026'}
const avatarProfiles = {
  'genesis-avatar-拉爾': {description: '巫師帽是我自己設計的喔！你發現了嗎！是『無限』的形狀！！哼哼！'},
  'genesis-avatar-緹芙波': {description: '陣術竟然不可以運行⋯為什麼呢？\n\n陣術竟然可以運行⋯為什麼呢？'},
  'genesis-avatar-伊爾': {description: '胸針？很漂亮吧？是拉爾給的，如果沒有這個的話我就真的一身灰色了⋯'},
  'genesis-avatar-俄斯塔': {description: '有什麼不懂的可以問我。……才、才不是關心你！是可憐你！'},
  'genesis-avatar-尤塔': {description: '又見面啦！最近很少看見我？嗯……學生會的工作實在太多了，你會想我嗎？哈哈？'},
  'genesis-avatar-里德': {description: '今天應該不會再發生什麼倒楣的事了吧……喂！你那是什麼表情？！'},
  'genesis-avatar-安普': {description: '……嗯。這個給你。……路上撿到的。', aside: '（*手上揣著看上去很珍貴的寶石）'},
  'genesis-avatar-哈里特': {description: '今天天氣真好啊！要不要一起出去走走？一直待在研究室裡也不好吧！', aside: '（*請狠狠拒絕他！太刺眼了吧？！都什麼話啊？不行不行！）'},
  'genesis-avatar-凱恩': {description: '我把今天的觀測結果記下來了。……你看不懂？嗯，沒關係，我講給你聽吧。'},
  'genesis-avatar-賽斯': {description: '嘿！要寄信嗎？交給我吧！正好順路！……去哪裡？哪裡都順路啦！'},
  'genesis-avatar-檑恪楒': {description: '好想親眼看看地球的一切，以後有機會一起去吧？'},
  'genesis-avatar-道格拉斯': {description: '哼哼，想聽聽我過去的偉業嗎？既然你如此好奇，那就破例告訴你吧。'},
  'genesis-avatar-校長': {description: '呵呵，年輕人有些奇思妙想是好事。畢竟誰知道最後會變成什麼呢？'},
  'genesis-avatar-阿瑞娜': {description: '我弟弟很聰明的喔！就是有時候太容易相信別人了……真讓人擔心呢。'},
  'genesis-avatar-德俄斯庫里': {description: '姐姐什麼都很好，就是有時候太容易相信別人了……我得好好看著她才行。'},
  'genesis-avatar-瑞吉娜': {description: '待會整理完資料之後，一起去吃蛋糕吧！我推薦開心果口味的呢！'},
  'genesis-avatar-帕托': {description: '噓……告訴你一個秘密。其實研究室裡有一個人是幽靈喔！……你猜是誰？'},
  'genesis-avatar-法雷奈': {description: '我的手比較怕冷，所以穿了加長版的袖子喔！很可愛吧！'},
  'genesis-avatar-艾斯帕依艾': {description: '我考了瑪德蓮，你也來一塊吧。做料理最重要的就是照著步驟來……研究室那群傢伙要是也懂這個道理就好了。'},
  'genesis-avatar-達芙': {description: '既然你都來了，那我考你一個問題吧！放心放心，很簡單的！'},
  'genesis-avatar-多萊絲': {description: '嗯……？啊，抱歉，剛剛在和史密斯先生說話⋯⋯你說到哪裡了？', aside: '（*史密斯先生是幽靈）'},
  'genesis-avatar-衵依': {description: '啊……那個……如果有什麼問題的話，隨時可以來找我……！雖然我不一定能幫上忙就是了……'},
  'genesis-avatar-培珒': {description: '最近的年輕人真有活力呢。正好，要不要來騎士團參觀一下？'},
  'genesis-avatar-伊': {description: '賺了多少？這是商業機密。今天花了多少？……0！哼哼，厲害吧！'},
  'genesis-avatar-奧芙羅': {description: '其實我最近也在嘗試一些以前沒畫過的東西……！嗯，希望能順利完成吧。'},
  'genesis-avatar-伊西斯': {description: '想知道答案？圖書館第三層，左側第七排，從上往下數第四本。去看看吧。'},
}
const emptyAvatarProfile = {description: null, artistStatement: null}
// Filenames are stable character identities; adding an avatar here requires no page changes.
const avatars = Object.entries(avatarImages).sort(([a], [b]) => a.localeCompare(b, 'zh-Hant')).map(([path, src]) => {
  const name = path.split('/').pop().replace(/\.[^.]+$/, '')
  const id = `genesis-avatar-${name}`
  return {...settings, id, title: name, src, width: 2048, height: 2048, number: '05', profile: {...avatarSharedInfo,...emptyAvatarProfile,...avatarProfiles[id]}}
})
const triptychInfo = {
  title: '運命',
  officialTitle: '運命',
  canvasSize: '12524 × 2620',
  artist: 'Art by.REMOANPU',
  year: '2026',
  artistStatement: '雖然看起來長的不得了，但其實是拆開來畫的所以沒問題！一開始畫的時候只覺得絕望，根本不覺得這能有多好的效果，還要畫那麼多人！但沒想到合成後意外的還行⋯？！\n\n結果也是成功重溫一遍歷史了⋯雖然畫的時候很崩潰，但在整理資料時，就發覺每個人都好厲害⋯世界並不是由哪一位特別厲害的人組建起來的，而是由所有的大家！每個人都必不可少，不知道我是否也些微的影響到了別人呢？說不定有人會因為我而開心、而努力生活喔？想到這些就挺開心的⋯真不可思議。',
}

// Keep unavailable editorial metadata explicitly null; each artwork owns its puzzle settings.
export const ARTWORKS = [
  {
    id: 'genesis-mainart',
    version: 1,
    number: '01',
    title: 'B-612研究室',
    officialTitle: 'B-612研究室',
    src: mainArt,
    width: 8994,
    height: 4048,
    canvasSize: '8994 × 4048',
    difficulties: [24, 96, 180],
    difficultyNames: ['簡單', '普通', '困難'],
    legacyDifficulties: [48],
    theme: null,
    description: '在ORBIS王立魔法學院的一角，具體來說是研究館B棟6樓12號房間，有一間小小的研究室。\n\n這裡堆滿了書籍、筆記，以及各種用途不明的研究器材。\n\n而在這張看似普通的研究桌上，兩位學生正在研究她們那異想天開的計畫，也就是「一個沒有魔法的世界」。\n\n至於研究究竟會如何發展，就連她們自己也還不知道。\n\n「不過地球上的故事裡，居然也有一顆叫 B-612 的小行星耶！是不是電波剛好對上了呢？」',
    artistStatement: '因為當時很急，雖然不知道具體在急什麼，所以很多地方都畫的比較粗糙，結果放上網站發現只能作為封面，那怎麼可以？！所以我做了這個拼圖模式！拼圖很好玩，同時還能重複利用一些素材！簡直是天才的發明！\n\n作為定調整個網站和風格的插畫，我很滿意喔！（暫時）',
    year: '2026',
    artist: 'Art by.REMOANPU',
    frame: 'css',
  },
  {
    ...settings, id: 'genesis-old', number: '02', title: '魔女的作業', officialTitle: '魔女的作業',
    src: old, width: 5783, height: 4088, canvasSize: '5703 × 4088',
    description: '「當初為什麼要訂這個根本做不完的題目啦⋯⋯」\n\n「啊！地球又出bug了！」\n\n那個下午，兩人仍在與這個不可思議的世界奮戰。\n\n那些看似平凡又混亂的日子，也正是創世故事的一部分。',
    artistStatement: '當時因為勾線勾了好久都超級失敗，絕望了幾天，然後選擇了直接細化的道路⋯屬於吃力不討好的範疇⋯⋯不過正因為這張畫，才開始認真的思考這個故事，過程中也是給自己草稿上畫的各種小物件找補，「呃這個水晶球其實可以連結地球！大家可以一起看電影！」、「天氣藥水⋯一般不怎麼用，但一開始地球還沒很完善時應該會為了平衡而派上用場吧⋯？」，諸如此類的自問自答也是多的不得了，真是一點也不嚴謹（）。',
    year: '2025', artist: 'Art by.REMOANPU',
  },
  {...settings, ...triptychInfo, id: 'genesis-long', number: '03', kind: 'triptych', src: long, width: 12524, height: 2620,
    items: [
      {...settings, id: 'genesis-long-1', number: '03 · 1', title: 'I. 從這裡開始', subtitle: '從南方古猿到古希臘', src: long1, width: 4071, height: 2620,
        collectionInfo: triptychInfo,
        description: '從古老的大地，到城市與文明逐漸興起，人類走過了漫長的歲月。\n\n學會製作工具、留下文字、建立城邦，並開始思考世界的模樣。\n\n那時的人們或許不曾想過，自己的足跡將成為後世所稱的歷史。'},
      {...settings, id: 'genesis-long-2', number: '03 · 2', title: 'II. 世界如此遼闊', subtitle: '從伊斯蘭文明到啟蒙時期', src: long2, width: 4557, height: 2620,
        collectionInfo: triptychInfo,
        description: '書籍跨越國界，知識也開始在不同文明之間流轉。\n\n人們重新觀察天空與大地，也開始追問權力、信仰與理性的意義。\n\n隨著一次次交流、爭論與發現，理解世界的方法也悄悄改變了。'},
      {...settings, id: 'genesis-long-3', number: '03 · 3', title: 'III. 而故事仍在繼續', subtitle: '從工業革命到現代', src: long3, width: 3969, height: 2620,
        collectionInfo: triptychInfo,
        description: '機器改變了生產的方式，城市不斷擴張，人類的腳步甚至踏上了月球。\n\n短短數百年間，世界經歷了前所未有的變化。\n\n而歷史並沒有停在畫卷的最後一格。\n\n此刻的每一天，也正在成為未來的歷史。'},
    ]},
  {
    ...settings, id: 'genesis-q', number: '04', title: '世界誕生之時', officialTitle: '世界誕生之時',
    src: q, width: 2048, height: 2048, canvasSize: '2048 × 2048',
    description: '在兩人與許多老師、朋友的共同努力下，世界終於完成了。\n\n就在那一刻，一道光芒悄悄亮起。\n\n它並不耀眼，也不微弱。\n\n但對他們而言，對這個剛剛誕生的世界而言，那是最值得開心的光芒。',
    artistStatement: '就是當時覺得「真是想了一個好故事呀！」後，隨便畫的小塗鴉，沒想到這裡還能派上用場！好耶',
    year: '2025', artist: 'Art by.REMOANPU',
  },
  {...settings, id: 'genesis-avatars', number: '05', title: 'B-612研究室的大家', kind: 'avatars', src: avatars[0]?.src, width: 2048, height: 2048, items: avatars},
]

export const findCollection = id => ARTWORKS.find(art => art.id === id || art.items?.some(item => item.id === id)) || ARTWORKS[0]
export const findArtwork = id => ARTWORKS.flatMap(art => art.items || [art]).find(art => art.id === id) || ARTWORKS[0]
