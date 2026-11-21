// Isolated localhost browser QA. Never imported by the app.
import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import PuzzlePage from '../../src/components/puzzle/PuzzlePage'
import Gallery from '../../src/components/main/HomePuzzleGallery'
import {ARTWORKS} from '../../src/components/puzzle/artworks'
import {createPuzzle} from '../../src/components/puzzle/engine'
import {saveProgress,loadProgress,lastDifficulty} from '../../src/components/puzzle/progress'
import '../../src/styles.css'
import '../../src/edition/edition.css'
const art=ARTWORKS[0]
function Lab(){const [selected,setSelected]=useState(art.id),[game,setGame]=useState(false),[generation,next]=useState(0),[report,setReport]=useState('')
function prepare(mode){if(location.hostname!=='localhost')throw Error('Use localhost');const m=createPuzzle(art.width,art.height,24)
 if(mode==='complete'){m.positions=m.pieces.map(p=>({x:p.x+(p.id===0?5:0),y:p.y+(p.id===0?3:0),group:p.id,locked:false}))}
 if(mode==='anchor'){m.positions[0]={x:5,y:3,group:0,locked:false};m.positions[1]={x:m.cw+35,y:3,group:1,locked:false}}
 saveProgress(art,24,m);next(n=>n+1);setGame(true)}
function inspect(){const m=loadProgress(art,lastDifficulty(art));setReport(JSON.stringify({pieces:m.pieces.length,locked:m.positions.filter(p=>p.locked).length,groups:new Set(m.positions.map(p=>p.group)).size,first:m.positions[0],layout:m.layout,loaded:m.hasSaved}))}
return <><div style={{position:'fixed',bottom:0,left:0,zIndex:30000,background:'white',padding:4,font:'10px monospace',maxWidth:'90vw'}}><button onClick={()=>prepare('complete')}>QA：準備完成</button><button onClick={()=>prepare('anchor')}>QA：定位測試</button><button onClick={inspect}>QA：檢查存檔</button>{report&&<span>{report}</span>}</div>{game?<PuzzlePage key={generation} artworkId={selected} onBack={()=>setGame(false)}/>:<Gallery selectedId={selected} onSelect={setSelected} onEnter={id=>{setSelected(id);setGame(true)}}/>}</>}
createRoot(document.getElementById('root')).render(<Lab/> )
