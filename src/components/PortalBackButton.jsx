function PortalBackButton({ onBack }) {
  return (
    <button
      className="globe-back"
      type="button"
      aria-label="Back"
      title="Back"
      onPointerDown={event => event.stopPropagation()}
      onClick={onBack}
    >
      ←
    </button>
  )
}

export default PortalBackButton