import { Component, type ReactNode } from 'react';
import { Button, Notice } from './ui';

/**
 * Keeps a render failure inside the part of the tree that threw.
 *
 * Without a boundary anywhere, React unmounts the whole root when a render
 * error has nowhere to go: the document goes blank, and a session, a wallet
 * connection and a page of unreadable-but-intact data all *look* lost with it.
 * This component sits at the top of the tree (see `src/main.tsx`) so that
 * everything above it stays mounted while what threw is replaced by a notice
 * that says so. Routes get the same treatment more precisely, one level down,
 * through `errorElement` — see `src/routes/RouteError.tsx`.
 *
 * The fallback is a `Notice` rather than a custom screen because a failure is a
 * state the design system already has a shape for, and because the recovery it
 * offers is honest: render the same subtree again, or reload. It reports no
 * balance, no transaction and no status — it cannot, because it exists for the
 * case where rendering failed.
 */
type ErrorBoundaryProps = {
  readonly children: ReactNode;
  /** What the notice is titled, for callers whose scope of "this" differs. */
  readonly title?: string;
};

type ErrorBoundaryState = {
  readonly error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override readonly state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  private readonly onRetry = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (this.state.error === null) {
      return this.props.children;
    }

    return (
      <div className="p-6 sm:p-10">
        <Notice
          tone="danger"
          title={this.props.title ?? 'This part of the app could not be displayed'}
        >
          <p>
            Something in this view failed while rendering, so it has been replaced with this notice
            rather than a blank page. Trying again re-renders it; if that does not help, reloading
            the page will.
          </p>
        </Notice>
        <div className="mt-4">
          <Button variant="secondary" onClick={this.onRetry}>
            Try again
          </Button>
        </div>
      </div>
    );
  }
}
