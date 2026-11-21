import { Component } from 'react'
import ResourceStatus from '../edition/ResourceStatus'

// A rejected lazy import or WebGL setup must expose recovery, not leave the
// existing transition closed forever. Recovery uses the existing error UI.
export default class DestinationBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error) { console.error('[Destination]', error); this.props.onError?.(error) }
  render() {
    return this.state.error
      ? <ResourceStatus status="error" onRetry={() => window.location.reload()}/>
      : this.props.children
  }
}
