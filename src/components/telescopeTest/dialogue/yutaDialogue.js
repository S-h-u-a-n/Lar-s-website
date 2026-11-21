// Exact transcript, structured at authoring time. No runtime text parsing.
export const YUTA_DIALOGUE = {
  "intro": {
    "id": "intro",
    "trigger": {
      "type": "entry"
    },
    "segments": [
      {
        "id": "intro-1",
        "group": "intro",
        "text": "哈囉～我早就猜想到這種情況了，所以還內置了影像來教你們使用這個特製望遠鏡喔。\n那麼先從最基本的操作開始吧。",
        "motion": "開場"
      },
      {
        "id": "intro-2",
        "group": "intro",
        "text": "有兩種觀測方式，一種是平面地圖，方便確認地球各區的位置。",
        "motion": "指右邊"
      },
      {
        "id": "intro-3",
        "group": "intro",
        "text": "另一種則是實景觀測。雖然同樣是地球，但實際看到的景色可比地圖豐富多了。",
        "motion": null
      },
      {
        "id": "intro-4",
        "group": "intro",
        "text": "目前還有幾個小功能⋯至於要先看哪個，就交給你們決定囉。\n畢竟是你們的研究，不是嗎？",
        "motion": "對話-wink"
      }
    ]
  },
  "welcome": {
    "id": "welcome",
    "trigger": {
      "type": "entry"
    },
    "segments": [
      {
        "id": "welcome-1",
        "group": "welcome",
        "text": "歡迎回來～",
        "motion": "開場"
      },
      {
        "id": "welcome-2",
        "group": "welcome",
        "text": "操作方式應該已經熟悉了吧？",
        "motion": null
      },
      {
        "id": "welcome-3",
        "group": "welcome",
        "text": "有什麼需要幫忙的，隨時可以找我喔。",
        "motion": null
      }
    ]
  },
  "hint-random": {
    "id": "hint-random",
    "trigger": {
      "type": "hint"
    },
    "segments": [
      {
        "id": "hint-random-1",
        "group": "hint-random",
        "text": "不知道要觀測哪裡的話，交給運氣也可以喔。",
        "motion": "對話-wink"
      },
      {
        "id": "hint-random-2",
        "group": "hint-random",
        "text": "說不定會找到什麼意想不到的地方呢。",
        "motion": null
      }
    ]
  },
  "hint-recommendations": {
    "id": "hint-recommendations",
    "trigger": {
      "type": "hint"
    },
    "segments": [
      {
        "id": "hint-recommendations-1",
        "group": "hint-recommendations",
        "text": "這裡收集了大家推薦的觀測地點喔。\n每個人感興趣的東西都不太一樣，看看別人的選擇也挺有意思的吧？",
        "motion": "對話-開心"
      },
      {
        "id": "hint-recommendations-2",
        "group": "hint-recommendations",
        "text": "你說這和前面的劇情對不上？沒有喔，那只是介紹一下望遠鏡的來源。\n而且我現在是和「你」說話呀，對吧？",
        "motion": "對話-wink"
      }
    ]
  },
  "hint-collection": {
    "id": "hint-collection",
    "trigger": {
      "type": "hint"
    },
    "segments": [
      {
        "id": "hint-collection-1",
        "group": "hint-collection",
        "text": "如果有感興趣的地方，可以先記下來喔，會記錄在左上角的Log裡。\n下次想再看看時，就不用重新尋找了。",
        "motion": "開心"
      }
    ]
  },
  "random": {
    "id": "random",
    "trigger": {
      "type": "random"
    },
    "segments": [
      {
        "id": "random-1",
        "group": "random",
        "text": "又想試試運氣了嗎？",
        "motion": "開心"
      },
      {
        "id": "random-2",
        "group": "random",
        "text": "真有探索精神呢～",
        "motion": "對話-開心"
      },
      {
        "id": "random-3",
        "group": "random",
        "text": "下一站會是哪裡呢？",
        "motion": "對話-wink"
      },
      {
        "id": "random-4",
        "group": "random",
        "text": "世界這麼大，總會有些意想不到的發現吧？",
        "motion": "感興趣"
      }
    ]
  },
  "random-milestone-5": {
    "id": "random-milestone-5",
    "trigger": {
      "type": "random",
      "count": 5
    },
    "segments": [
      {
        "id": "random-milestone-5-1",
        "group": "random-milestone-5",
        "text": "還沒找到滿意的地方嗎？",
        "motion": "感興趣"
      }
    ]
  },
  "random-milestone-10": {
    "id": "random-milestone-10",
    "trigger": {
      "type": "random",
      "count": 10
    },
    "segments": [
      {
        "id": "random-milestone-10-1",
        "group": "random-milestone-10",
        "text": "你該不會打算靠這個功能把整顆地球都逛一遍吧？",
        "motion": "對話-開心"
      }
    ]
  },
  "favorite-1": {
    "id": "favorite-1",
    "trigger": {
      "type": "favorite",
      "count": 1
    },
    "segments": [
      {
        "id": "favorite-1-1",
        "group": "favorite-1",
        "text": "找到喜歡的地方了嗎？\n真不錯呢，之後我有時間也去看看吧。",
        "motion": "對話-開心"
      }
    ]
  },
  "favorite-5": {
    "id": "favorite-5",
    "trigger": {
      "type": "favorite",
      "count": 5
    },
    "segments": [
      {
        "id": "favorite-5-1",
        "group": "favorite-5",
        "text": "喔？看來你感興趣的地方不少呢\n呵呵，照這個速度，說不定很快就能整理出一份自己的觀測紀錄了。",
        "motion": "感興趣"
      }
    ]
  },
  "favorite-10": {
    "id": "favorite-10",
    "trigger": {
      "type": "favorite",
      "count": 10
    },
    "segments": [
      {
        "id": "favorite-10-1",
        "group": "favorite-10",
        "text": "看來你比我想像中還要喜歡這顆星球呢\n這樣下去，我是不是該考慮增加收藏的容量了？",
        "motion": "對話-wink"
      }
    ]
  },
  "chat-1": {
    "id": "chat-1",
    "trigger": {
      "type": "chat"
    },
    "segments": [
      {
        "id": "chat-1-1",
        "group": "chat-1",
        "text": "最近在姐妹校忙著外交事務呢，實在沒時間回來看看呢⋯\n希望校長能『體諒』我並多給點好處啊，呵呵。",
        "motion": "對話-思考"
      },
      {
        "id": "chat-1-2",
        "group": "chat-1",
        "text": "嗯？具體在忙什麼？",
        "motion": null
      },
      {
        "id": "chat-1-3",
        "group": "chat-1",
        "text": "主要是交換生制度的調整，還有下學期的聯合研究計畫。",
        "motion": "對話"
      },
      {
        "id": "chat-1-4",
        "group": "chat-1",
        "text": "兩邊對課程和研究資源的安排都有不同的想法，光是協調就花了不少時間呢。\n哈哈，不過要是大家的想法都一樣，也就不需要我特地跑這一趟了。",
        "motion": null
      },
      {
        "id": "chat-1-5",
        "group": "chat-1",
        "text": "不過目前進展還算順利。應該很快就能帶些好消息回去了。\n可以期待一下喔？",
        "motion": "對話-wink"
      }
    ]
  },
  "chat-2": {
    "id": "chat-2",
    "trigger": {
      "type": "chat"
    },
    "segments": [
      {
        "id": "chat-2-1",
        "group": "chat-2",
        "text": "學生會的工作？嗯，還挺有意思的。",
        "motion": "對話"
      },
      {
        "id": "chat-2-2",
        "group": "chat-2",
        "text": "幾乎每天都會遇到各式各樣的情況，大家真是有活力呢。",
        "motion": null
      },
      {
        "id": "chat-2-3",
        "group": "chat-2",
        "text": "如果某位副會長也能再努努力就好啦～",
        "motion": "開心"
      }
    ]
  },
  "chat-3": {
    "id": "chat-3",
    "trigger": {
      "type": "chat"
    },
    "segments": [
      {
        "id": "chat-3-1",
        "group": "chat-3",
        "text": "之前有人來學生會提議，說『讓食堂每週舉辦一次甜點吃到飽活動』。",
        "motion": "對話-思考"
      },
      {
        "id": "chat-3-2",
        "group": "chat-3",
        "text": "理由是『甜食有助於提升學生的幸福感』。",
        "motion": null
      },
      {
        "id": "chat-3-3",
        "group": "chat-3",
        "text": "看來是沒有修過哲學概論呢\n從「吃甜點會讓人開心」直接推導出『學校應該提供吃到飽』，中間是不是省略了太多東西？",
        "motion": null
      },
      {
        "id": "chat-3-4",
        "group": "chat-3",
        "text": "不過嘛⋯",
        "motion": null
      },
      {
        "id": "chat-3-5",
        "group": "chat-3",
        "text": "如果只是問我想不想參加，那答案當然是想囉。",
        "motion": "感興趣"
      }
    ]
  },
  "chat-4": {
    "id": "chat-4",
    "trigger": {
      "type": "chat"
    },
    "segments": [
      {
        "id": "chat-4-1",
        "group": "chat-4",
        "text": "說起來，魔導具學還挺容易被誤解的。\n總有人以為，只要把魔法陣刻在什麼東西上，就能算是魔導具了。",
        "motion": "對話-思考"
      },
      {
        "id": "chat-4-2",
        "group": "chat-4",
        "text": "嗯……倒也不能說完全不對。",
        "motion": null
      },
      {
        "id": "chat-4-3",
        "group": "chat-4",
        "text": "不過，能夠運作和能夠讓人方便地使用，可是兩回事。",
        "motion": "對話"
      },
      {
        "id": "chat-4-4",
        "group": "chat-4",
        "text": "就像這台望遠鏡。要是每次觀測都得先念上一長串咒語，你們大概早就不想用了吧？",
        "motion": null
      }
    ]
  },
  "chat-5": {
    "id": "chat-5",
    "trigger": {
      "type": "chat"
    },
    "segments": [
      {
        "id": "chat-5-1",
        "group": "chat-5",
        "text": "地球上的人類還真有意思呢。",
        "motion": "對話-開心"
      },
      {
        "id": "chat-5-2",
        "group": "chat-5",
        "text": "明明有那麼多地方可以去，卻總是會有一些特別受歡迎的景點，\n還要不計千辛萬苦前往。",
        "motion": null
      },
      {
        "id": "chat-5-3",
        "group": "chat-5",
        "text": "有些人是因為風景，有些人是因為歷史，\n還有人只是因為看見別人去過，所以自己也想去看看。",
        "motion": "對話"
      },
      {
        "id": "chat-5-4",
        "group": "chat-5",
        "text": "不過這也沒什麼不好。\n畢竟，想和別人分享同一片風景，也是一種很可愛的理由吧？",
        "motion": null
      }
    ]
  },
  "chat-6": {
    "id": "chat-6",
    "trigger": {
      "type": "chat"
    },
    "segments": [
      {
        "id": "chat-6-1",
        "group": "chat-6",
        "text": "感覺最近里德和拉爾都一直在躲著我呢……",
        "motion": "對話-思考"
      },
      {
        "id": "chat-6-2",
        "group": "chat-6",
        "text": "里德就算了，最近連拉爾看見我都會繞路走。\n難道他們私底下商量了什麼事情嗎？",
        "motion": null
      },
      {
        "id": "chat-6-3",
        "group": "chat-6",
        "text": "呵呵，真希望不是在說我的壞話。",
        "motion": null
      },
      {
        "id": "chat-6-4",
        "group": "chat-6",
        "text": "不過那兩個人居然會在這種事情上達成共識，倒也挺難得的。",
        "motion": "開心"
      },
      {
        "id": "chat-6-5",
        "group": "chat-6",
        "text": "下次要好好問清楚呢⋯",
        "motion": null
      }
    ]
  },
  "chat-7": {
    "id": "chat-7",
    "trigger": {
      "type": "chat"
    },
    "segments": [
      {
        "id": "chat-7-1",
        "group": "chat-7",
        "text": "說起來，里德真是個可靠的副會長呢。\n我不在學院的這段時間，學生會的工作幾乎都交給他了。",
        "motion": "開心"
      },
      {
        "id": "chat-7-2",
        "group": "chat-7",
        "text": "雖然他最近似乎不太想和我說話，但交接文件倒是一份都沒少。\n真是公私分明啊。",
        "motion": null
      },
      {
        "id": "chat-7-3",
        "group": "chat-7",
        "text": "等我回去以後，得好好感謝他才行",
        "motion": "感興趣"
      }
    ]
  },
  "chat-8": {
    "id": "chat-8",
    "trigger": {
      "type": "chat"
    },
    "segments": [
      {
        "id": "chat-8-1",
        "group": "chat-8",
        "text": "最近學院裡似乎流傳著一個奇怪的傳聞\n『據說只要在午夜走進圖書館最裡面的書架，就會聽見有人在背誦課文』。",
        "motion": "對話-思考"
      },
      {
        "id": "chat-8-2",
        "group": "chat-8",
        "text": "有些靈感低的學生覺得那是幽靈\n不過我倒是聽說，有位研究歷史的學生最近正在準備一場非常重要的考試。",
        "motion": null
      },
      {
        "id": "chat-8-3",
        "group": "chat-8",
        "text": "呵呵，真相有時候比傳聞還要普通呢",
        "motion": "開心"
      }
    ]
  },
  "chat-9": {
    "id": "chat-9",
    "trigger": {
      "type": "chat"
    },
    "segments": [
      {
        "id": "chat-9-1",
        "group": "chat-9",
        "text": "你有沒有想過，魔法究竟讓我們省下了多少時間？\n像是打掃、搬運、傳遞訊息……很多事情只要使用一點魔法就能解決。",
        "motion": "對話"
      },
      {
        "id": "chat-9-2",
        "group": "chat-9",
        "text": "但奇怪的是，大家似乎也沒有因此變得特別悠閒，\n省下來的時間，總會被新的事情填滿呢。",
        "motion": null
      },
      {
        "id": "chat-9-3",
        "group": "chat-9",
        "text": "真是不可思議啊～",
        "motion": "開心"
      }
    ]
  },
  "chat-10": {
    "id": "chat-10",
    "trigger": {
      "type": "chat"
    },
    "segments": [
      {
        "id": "chat-10-1",
        "group": "chat-10",
        "text": "嗯？我的成績？",
        "motion": "對話"
      },
      {
        "id": "chat-10-2",
        "group": "chat-10",
        "text": "還不錯喔。至少目前沒有需要特別擔心的科目。",
        "motion": null
      },
      {
        "id": "chat-10-3",
        "group": "chat-10",
        "text": "不過我不太喜歡考試呢。\n明明只要能做出成果就好了，卻還得花時間向老師證明自己知道怎麼做。",
        "motion": null
      },
      {
        "id": "chat-10-4",
        "group": "chat-10",
        "text": "哈哈，這話可別告訴教授們啊。",
        "motion": "對話-wink"
      }
    ]
  },
  "chat-11": {
    "id": "chat-11",
    "trigger": {
      "type": "chat"
    },
    "segments": [
      {
        "id": "chat-11-1",
        "group": "chat-11",
        "text": "有人說我總是在笑呢。",
        "motion": "對話"
      },
      {
        "id": "chat-11-2",
        "group": "chat-11",
        "text": "嗯……有嗎？\n我倒是沒有特別注意過。",
        "motion": null
      },
      {
        "id": "chat-11-3",
        "group": "chat-11",
        "text": "不過，既然笑容能讓人比較容易親近，那也沒什麼不好吧？",
        "motion": "開心"
      },
      {
        "id": "chat-11-4",
        "group": "chat-11",
        "text": "你說呢？",
        "motion": null
      }
    ]
  },
  "chat-12": {
    "id": "chat-12",
    "trigger": {
      "type": "chat"
    },
    "segments": [
      {
        "id": "chat-12-1",
        "group": "chat-12",
        "text": "說起來，你覺得這顆地球怎麼樣？",
        "motion": "對話"
      },
      {
        "id": "chat-12-2",
        "group": "chat-12",
        "text": "沒有魔法的世界……最初聽到這個構想時，我還以為他們只是想做個有趣的實驗呢。\n沒想到最後居然發展到這種規模。",
        "motion": null
      },
      {
        "id": "chat-12-3",
        "group": "chat-12",
        "text": "不過，仔細想想也很合理吧？\n即使沒有魔法，生命也會尋找自己的生存方式，文明也會沿著不同的方向發展。",
        "motion": "對話-思考"
      },
      {
        "id": "chat-12-4",
        "group": "chat-12",
        "text": "我覺得是個相當成功的作品喔。",
        "motion": null
      },
      {
        "id": "chat-12-5",
        "group": "chat-12",
        "text": "當然也有不少問題，\n戰爭、資源分配、環境破壞……有些事情甚至連創造它的人都未必能預料到。",
        "motion": null
      },
      {
        "id": "chat-12-6",
        "group": "chat-12",
        "text": "不過，如果所有事情都按照預定的方向發展，那觀察起來反而沒什麼意思了吧。",
        "motion": "感興趣"
      },
      {
        "id": "chat-12-7",
        "group": "chat-12",
        "text": "倒是讓我有點好奇，這顆星球最後會變成什麼模樣呢。",
        "motion": null
      }
    ]
  },
  "chat-13": {
    "id": "chat-13",
    "trigger": {
      "type": "chat"
    },
    "segments": [
      {
        "id": "chat-13-1",
        "group": "chat-13",
        "text": "我對地球上的人類還挺感興趣的",
        "motion": "對話-思考"
      },
      {
        "id": "chat-13-2",
        "group": "chat-13",
        "text": "明明沒有魔法，卻能製造出飛行器、通訊設備，甚至把人送到星球之外\n很多技術的原理都和我們的魔導具完全不同呢。",
        "motion": null
      },
      {
        "id": "chat-13-3",
        "group": "chat-13",
        "text": "看來無論有沒有魔法，大家都不太願意接受「做不到」這個答案啊，哈哈。",
        "motion": "開心"
      }
    ]
  },
  "chat-14": {
    "id": "chat-14",
    "trigger": {
      "type": "chat"
    },
    "segments": [
      {
        "id": "chat-14-1",
        "group": "chat-14",
        "text": "拉爾和緹芙波啊……我覺得她們最厲害的，或許是招募人才的能力呢，\n明明只是從一份課堂研究開始，最後卻聚集了這麼多不同領域的人。",
        "motion": "對話"
      },
      {
        "id": "chat-14-2",
        "group": "chat-14",
        "text": "就連我也不知不覺成了其中一員。",
        "motion": null
      },
      {
        "id": "chat-14-3",
        "group": "chat-14",
        "text": "原本還以為自己只是來幫忙做台望遠鏡的呢，\n沒想到意外的有趣呀～",
        "motion": "開心"
      },
      {
        "id": "chat-14-4",
        "group": "chat-14",
        "text": "我其實一直很好奇拉爾和緹芙波究竟有什麼特別的本領，\n能夠說服那麼多人投入自己的研究，可不是光靠熱情就能做到的。",
        "motion": null
      },
      {
        "id": "chat-14-5",
        "group": "chat-14",
        "text": "更何況，參與者的立場和目的似乎也不完全相同。",
        "motion": null
      },
      {
        "id": "chat-14-6",
        "group": "chat-14",
        "text": "結果現在連傳說中的惡龍都對這顆星球產生興趣了呢。\n這個企劃的規模究竟還打算擴大到哪裡去呢？",
        "motion": "對話-思考"
      },
      {
        "id": "chat-14-7",
        "group": "chat-14",
        "text": "究竟是她們特別擅長吸引人才，還是這個世界本身就有這樣的魅力呢？",
        "motion": null
      },
      {
        "id": "chat-14-8",
        "group": "chat-14",
        "text": "真想繼續觀察下去啊。",
        "motion": "對話-開心"
      }
    ]
  }
}

export const CHAT_GROUP_IDS = ["chat-1", "chat-2", "chat-3", "chat-4", "chat-5", "chat-6", "chat-7", "chat-8", "chat-9", "chat-10", "chat-11", "chat-12", "chat-13", "chat-14"]
