import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppLayout } from './AppLayout';
import { RequireAuth } from './RequireAuth';
import { RouteError } from './RouteError';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/auth/Login';
import { Signup } from '@/pages/auth/Signup';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ResetPassword } from '@/pages/auth/ResetPassword';
import { JoinInvite } from '@/pages/JoinInvite';
import { Dashboard } from '@/pages/app/Dashboard';
import { Groups } from '@/pages/app/Groups';
import { CreateGroup } from '@/pages/app/CreateGroup';
import { GroupDetail } from '@/pages/app/GroupDetail';
import { Activity } from '@/pages/app/Activity';
import { Settings } from '@/pages/app/Settings';
import { TransactionDetail } from '@/pages/app/TransactionDetail';
import { NotFound } from '@/pages/NotFound';

/**
 * Every route carries an `errorElement` so a render failure costs the page it
 * happened on, not the app: the nearest layout stays mounted behind the notice,
 * and the person reading it can navigate away. The top-level boundary in
 * `main.tsx` covers whatever is outside these routes — see #8.
 */
const router = createBrowserRouter([
  { path: '/', element: <Landing />, errorElement: <RouteError /> },
  { path: '/login', element: <Login />, errorElement: <RouteError /> },
  { path: '/signup', element: <Signup />, errorElement: <RouteError /> },
  { path: '/forgot-password', element: <ForgotPassword />, errorElement: <RouteError /> },
  { path: '/reset-password', element: <ResetPassword />, errorElement: <RouteError /> },
  { path: '/join/:inviteCode', element: <JoinInvite />, errorElement: <RouteError /> },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Dashboard />, errorElement: <RouteError /> },
      { path: 'groups', element: <Groups />, errorElement: <RouteError /> },
      { path: 'groups/create', element: <CreateGroup />, errorElement: <RouteError /> },
      { path: 'groups/:id', element: <GroupDetail />, errorElement: <RouteError /> },
      { path: 'activity', element: <Activity />, errorElement: <RouteError /> },
      { path: 'settings', element: <Settings />, errorElement: <RouteError /> },
      { path: 'transactions/:hash', element: <TransactionDetail />, errorElement: <RouteError /> },
    ],
  },
  { path: '*', element: <NotFound />, errorElement: <RouteError /> },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
