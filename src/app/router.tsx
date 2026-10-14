import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AuthLayout } from '../features/auth/AuthLayout';
import { ForgotPasswordPage, ResetPasswordPage } from '../features/auth/PasswordPages';
import { LoginPage } from '../features/auth/LoginPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { RegisterPage } from '../features/auth/RegisterPage';
import { CalendarPage } from '../features/calendar/CalendarPage';
import { CategoriesPage } from '../features/categories/CategoriesPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { StatisticsPage } from '../features/statistics/StatisticsPage';
import { TodayPage } from '../features/tasks/TodayPage';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [{
      element: <AppShell />,
      children: [
        { index: true, element: <TodayPage /> },
        { path: '/calendar', element: <CalendarPage /> },
        { path: '/categories', element: <CategoriesPage /> },
        { path: '/statistics', element: <StatisticsPage /> },
        { path: '/settings', element: <SettingsPage /> },
      ],
    }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
