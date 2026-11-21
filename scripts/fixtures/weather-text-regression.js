// Run from Chrome Console on localhost:5186/?edition=bottled-weather:
// (await import('/scripts/fixtures/weather-text-regression.js')).run()
// Uses the real mounted page/editor. Never changes potion data or engine state.
import { getTextValues, updateText } from '/src/dev/textEditorStore.js'

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
async function visible() {
  while(document.hidden) await new Promise(resolve=>document.addEventListener('visibilitychange',resolve,{once:true}))
}
export async function run() {
  if (location.hostname !== 'localhost') throw new Error('Use isolated localhost origin, not the user draft origin')
  const keys = ['genesis:text-editor:codex-bottled-weather:v1', 'genesis:text-editor:bottled-weather:v1']
  const saved = keys.map(key => [key, localStorage.getItem(key)])
  const results = []
  try {
    const targets = [...document.querySelectorAll('.wp-potions > button')].map(button => ({
      select:()=>button.click(),selector:'.wp-potion-remark',name:button.getAttribute('aria-label'),
    }))
    for (const selector of ['.wp-lead','.wp-description','.wp-margin-note p']) targets.push({select:()=>{},selector,name:selector})
    for (const target of targets) {
      await visible()
      const progress=document.getElementById('results')
      if(progress)progress.textContent=`Testing ${target.name}\n${JSON.stringify(results,null,2)}`
      target.select()
      await wait(400)
      await visible()
      // Registration is RAF-driven. A background tab can defer it beyond a
      // timeout; do not accidentally test updateText(undefined, ...) instead.
      for(let frame=0;frame<120;frame++) {
        if(document.querySelector(target.selector)?.dataset.textEditorId)break
        await new Promise(requestAnimationFrame)
      }
      const element = document.querySelector(target.selector)
      if (!element) throw new Error('Expected nonempty current source note')
      const id = element.dataset.textEditorId, original = { ...getTextValues(id) }
      if(!id || !getTextValues(id))throw new Error(`Editor registration missing: ${target.name}`)
      const transitions = []
      const observer = new MutationObserver(() => transitions.push(element.textContent))
      observer.observe(element, { subtree:true, characterData:true, childList:true })
      let empty, reentered
      try {
        updateText(id, {text:''})
        await wait(500)
        empty = element.textContent === '' && element.dataset.textEditorId === id
        updateText(id, {text:'Diagnostic text / 診斷文字'})
        await wait(500)
        reentered = element.textContent === 'Diagnostic text / 診斷文字'
      } finally {
        updateText(id, original)
        await wait(400)
        observer.disconnect()
      }
      const css = getComputedStyle(element)
      results.push({potion:target.name,empty,reentered,
        restored:element.textContent === original.text,
        oneRemark:document.querySelectorAll('.wp-potion-remark').length === 1,
        shadow:css.textShadow,opacity:css.opacity,transitions:transitions.length,
        pass:empty && reentered && element.textContent === original.text && transitions.length <= 3})
    }
  } finally {
    await wait(300)
    for (const [key,value] of saved) {
      if (value === null) localStorage.removeItem(key)
      else localStorage.setItem(key,value)
    }
  }
  console.log('WEATHER_TEXT_REGRESSION', JSON.stringify(results))
  return results
}
