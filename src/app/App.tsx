import { QueryClientProvider } from '@tanstack/react-query';
import { CircleAlert } from 'lucide-react';
import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from '../components/ui/ToastProvider';
import { AuthProvider } from '../features/auth/AuthProvider';
import { configurationError } from '../lib/supabase';
import { queryClient } from './queryClient';
import { router } from './router';

export function App() {
  if (configurationError) return <main className="config-error"><div className="brand-mark">D</div><CircleAlert /><h1>Falta configurar Supabase</h1><p>{configurationError}</p><code>cp .env.example .env.local</code><span>Luego reinicia <strong>pnpm dev</strong>.</span></main>;
  return <QueryClientProvider client={queryClient}><AuthProvider><ToastProvider><RouterProvider router={router} /></ToastProvider></AuthProvider></QueryClientProvider>;
}
