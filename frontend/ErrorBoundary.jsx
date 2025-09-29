import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { console.error('UI ErrorBoundary:', err, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-gold p-6">
          <h2 className="text-2xl mb-2">Something went wrong.</h2>
          <p>Please refresh the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
