import React from 'react'
import { createRoot } from 'react-dom/client'
import WeatherPotions from '../../src/dev/weatherPotions/WeatherPotions'
import DomPageAdapter from '../../src/dev/DomPageAdapter'
import '../../src/styles.css'
import '../../src/edition/edition.css'
import '../../src/dev/weatherPotions/WeatherPotions.css'
import {run} from './weather-text-regression.js'

createRoot(document.getElementById('root')).render(<><WeatherPotions/><DomPageAdapter pageId="bottled-weather"/></>)
setTimeout(async()=>{
  try {
    const results=await run()
    document.getElementById('results').textContent=`Completed ${results.length}; failed ${results.filter(r=>!r.pass).length}\n`+
      results.map(r=>`${r.potion}: ${r.pass?'PASS':'FAIL'}; mutations=${r.transitions}; opacity=${r.opacity}; shadow=${r.shadow}`).join('\n')
  }
  catch(error) { document.getElementById('results').textContent=error.stack }
},1200)
