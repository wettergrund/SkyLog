import { createBrowserRouter, Navigate } from 'react-router-dom';
import Shell from './components/Shell/Shell';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import LogbookPage from './pages/LogbookPage/LogbookPage';
import TotalsPage from './pages/TotalsPage/TotalsPage';
import CurrencyPage from './pages/CurrencyPage/CurrencyPage';
import NewFlightPage from './pages/NewFlightPage/NewFlightPage';
import EditFlightPage from './pages/EditFlightPage/EditFlightPage';
import ImportExportPage from './pages/ImportExportPage/ImportExportPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Shell />,
        children: [
          { path: '/logbook', element: <LogbookPage /> },
          { path: '/totals', element: <TotalsPage /> },
          { path: '/currency', element: <CurrencyPage /> },
          { path: '/flights/new', element: <NewFlightPage /> },
          { path: '/flights/:id/edit', element: <EditFlightPage /> },
          { path: '/import-export', element: <ImportExportPage /> },
          { path: '/', element: <Navigate to="/logbook" replace /> },
        ],
      },
    ],
  },
]);
