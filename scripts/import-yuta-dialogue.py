from pathlib import Path
import re,json
root=Path('src/components/telescopeTest/dialogue')
s=(root/'yuta-original.txt').read_text()
heads={'開場（左邊望遠鏡還在聚焦中）':'intro','第二次以後進場':'welcome','隨機觀測':'hint-random','大家推薦':'hint-recommendations','收藏':'hint-collection','點擊隨機觀測（隨機播放以下幾句）':'random','點擊隨機觀測一定次數':'random-milestone','點擊收藏':'favorite','閒聊':'chat'}
groups={};section=None;motion=None;count=None;depth=0;buf=''
for line in s.splitlines():
 if depth:
  buf+='\n'
 else:
  if line in ['切換MAP','切換VIEW','連續切換兩種模式']: section=None;motion=None;continue
  if line in heads: section=heads[line];motion=None;continue
  if re.fullmatch(r'（\d+）',line): section='chat-'+line[1:-1];continue
  if line in ['（第一次）','（第五次）','（第十次）']:count={'（第一次）':1,'（第五次）':5,'（第十次）':10}[line];continue
  if re.fullmatch(r'（(?:開場|指右邊-開心|指右邊|開心|感興趣|對話(?:-思考|-開心|-wink|-笑容)?)）',line):motion=line[1:-1];continue
  if section is None:continue
  if not line.startswith('「'):continue
 for ch in line:
  if ch=='「':
   if depth:buf+=ch
   depth+=1
  elif ch=='」':
   depth-=1
   if depth:buf+=ch
   else:
    key=section+('-'+str(count) if section in ['random-milestone','favorite'] else '')
    arr=groups.setdefault(key,[])
    arr.append({'id':key+'-'+str(len(arr)+1),'group':key,'text':buf,'motion':motion})
    buf='';motion=None
  elif depth:buf+=ch
assert depth==0 and len(groups)==25
out={}
for key,segments in groups.items():
 trigger={'type':'chat' if key.startswith('chat-') else 'entry' if key in ['intro','welcome'] else 'hint' if key.startswith('hint-') else 'random' if key.startswith('random') else 'favorite'}
 if key.startswith(('random-milestone-','favorite-')): trigger['count']=int(key.split('-')[-1])
 out[key]={'id':key,'trigger':trigger,'segments':segments}
(root/'yutaDialogue.js').write_text('// Exact transcript, structured at authoring time. No runtime text parsing.\nexport const YUTA_DIALOGUE = '+json.dumps(out,ensure_ascii=False,indent=2)+'\n\nexport const CHAT_GROUP_IDS = '+json.dumps([f'chat-{i}' for i in range(1,15)],ensure_ascii=False)+'\n')
print(len(out),'groups;',sum(len(g['segments']) for g in out.values()),'segments')
