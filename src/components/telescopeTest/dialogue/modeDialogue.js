// Exact supplied mode-switch responses. They complete without a confirmation click.
const response = (id, text, motion) => ({ id, group: id.split(':')[0], text, motion })
export const MODE_DIALOGUE = {
  'mode-map': [
    response('mode-map:1', '這樣一看，地球真是又小又大呢。', '對話'),
    response('mode-map:2', '原本還想加入更多標記功能的，不過最後還是決定讓畫面簡單一些，哈哈。', '對話-開心'),
    response('mode-map:3', '如果能直接在地圖上畫出傳送陣就好了。啊，差點忘了那裡不能用魔法呢。', '對話-思考'),
  ],
  'mode-view': [
    response('mode-view:1', '果然還是看看實景比較有意思呢～', '對話-開心'),
    response('mode-view:2', '因為裡面內建了比較複雜的術式，所以可能要加載一會才能完整顯示喔。', '對話-開心'),
    response('mode-view:3', '同一個地點，從不同的方式觀察，得到的印象也會不太一樣呢。', '對話'),
  ],
  'mode-burst': [
    response('mode-burst:1', '嗯？是在比較兩種模式的差異嗎？', '對話-思考'),
    response('mode-burst:2', '呵呵，這台望遠鏡的切換功能應該已經通過你的測試了吧？', '對話-wink'),
  ],
}
export const MODE_SWITCH_CONFIG = Object.freeze({ count: 6, windowMs: 15000, cooldownMs: 30000 })
