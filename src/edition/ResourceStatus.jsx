export default function ResourceStatus({status,onRetry,label='研究工具',showLoading=true}) {
  if(status==='ready'||(status==='loading'&&!showLoading))return null
  return <div className="edition-resource-status" role="status"><span className={status==='error'?'is-error':''}>✧</span><strong>{status==='error'?`${label}暫時沒有回應`:`正在準備${label}`}</strong><p>{status==='error'?'可以重新載入，或從研究索引選擇另一件工具。':'把世界放上研究桌，請稍候。'}</p>{status==='error'&&<button onClick={onRetry}>重新準備 ↻</button>}</div>
}
