import { toggleDevEditor, useDevEditorState } from './devEditorStore'
import './DevEditorLauncher.css'

const EDITOR_BUTTONS = [
  { kind: '3d', label: '3D' },
  { kind: 'img', label: 'IMG' },
  { kind: 'text', label: 'TEXT' },
]

function DevEditorLauncher({ disabled = false }) {
  const { editors, active } = useDevEditorState()
  const buttons = EDITOR_BUTTONS.filter(button => editors.some(editor => editor.kind === button.kind))
  if (!import.meta.env.DEV || buttons.length === 0) return null

  return (
    <div className="dev-editor-launcher">
      {buttons.map(button => (
        <button
          key={button.kind}
          type="button"
          disabled={disabled}
          className={active?.kind === button.kind ? 'is-active' : undefined}
          onClick={() => toggleDevEditor(button.kind)}
        >
          {button.label}
        </button>
      ))}
    </div>
  )
}

export default DevEditorLauncher
