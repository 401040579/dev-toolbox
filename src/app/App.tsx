import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { restorePagesRedirect } from '@/lib/pages-redirect';
import { routes } from './routes';
import { useAppStore } from '@/store/app';
import { useEffect } from 'react';

// Import tool registry to trigger registration
import '@/tools/registry';

restorePagesRedirect();

const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});

export function App() {
  const theme = useAppStore((s) => s.theme);

  // Apply theme on mount and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <RouterProvider router={router} />;
}
