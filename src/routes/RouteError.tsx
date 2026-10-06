import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { buttonClasses } from '@/components/button-styles';
import { Button, Notice } from '@/components/ui';

/**
 * The recovery screen for a route that failed while rendering.
 *
 * This is the `errorElement` on every route in `router.tsx`. React Router swaps
 * only the route that threw for this element, so the layout above it — and the
 * providers above that — stay mounted: the navigation still works, and a person
 * can leave the broken page instead of being left with a blank one.
 *
 * The error's own message is shown, as plain text, because it is the one fact
 * anyone reporting this page will need. It is rendered as text and never as
 * markup — the same rule everything else on these screens follows.
 */
export function RouteError() {
  const error = useRouteError();

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : undefined;

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-16">
      <Notice tone="danger" title="This page could not be displayed">
        <p>
          It failed while rendering, so it has been replaced with this notice. The rest of the app
          still works.
        </p>
        {detail === undefined ? null : (
          <p className="mt-2 break-words font-mono text-xs opacity-75">{detail}</p>
        )}
      </Notice>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/" className={buttonClasses('secondary')}>
          Go to the home page
        </Link>
        <Button variant="ghost" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    </div>
  );
}
