import { Component } from "react";

// Catches render errors (for example from a malformed CSV) so the user never sees a blank page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="max-w-xl mx-auto mt-16 p-6 bg-paper border border-lineStrong rounded-md">
        <h1 className="font-serif text-2xl mb-2">Something went wrong</h1>
        <p className="text-inkSoft mb-4">
          The page hit an unexpected error. Reloading usually fixes it; if you uploaded a CSV, check
          that it has the expected columns.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4.5 py-2.5 rounded border border-ink bg-ink text-paper text-sm hover:bg-black"
        >
          Reload the page
        </button>
      </div>
    );
  }
}
