import larComic from '../../../Art/information2/lar-comic.png'
import larDialog1 from '../../../Art/information2/lar-dialog1.png'
import larDialog2 from '../../../Art/information2/lar-dialog2.png'
import tivboComic from '../../../Art/information2/tivbo-comic.png'
import tivboDialog1 from '../../../Art/information2/tivbo-dialog1.png'
import tivboDialog2 from '../../../Art/information2/tivbo-dialog2.png'

export const FIELD_COMIC_STORIES = {
  'book-open1': {
    artwork: [
      { id: 'natural-comic-panel', label: '自然世界漫畫', src: tivboComic, ratio: 1556 / 1395 },
      { id: 'natural-comic-dialog-1', label: '自然世界對話 1', src: tivboDialog1, ratio: 663 / 892, groupId: 'natural-dialogue-group-1' },
      { id: 'natural-comic-dialog-2', label: '自然世界對話 2', src: tivboDialog2, ratio: 687 / 901, groupId: 'natural-dialogue-group-2' },
    ],
  },
  'book-close1': {
    artwork: [
      { id: 'human-comic-panel', label: '人文世界漫畫', src: larComic, ratio: 1572 / 1393 },
      { id: 'human-comic-dialog-1', label: '人文世界對話 1', src: larDialog1, ratio: 666 / 889, groupId: 'human-dialogue-group-1' },
      { id: 'human-comic-dialog-2', label: '人文世界對話 2', src: larDialog2, ratio: 701 / 894, groupId: 'human-dialogue-group-2' },
    ],
  },
}
