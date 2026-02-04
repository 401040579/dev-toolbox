import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';
import { useAppStore } from '@/store/app';
import { useEffect } from 'react';

// Import tool registry to trigger registration
import '@/tools/registry';

const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});

export function App() {
  const theme = useAppStore((s) => s.theme);

  // Apply theme on mount and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle SPA redirect from 404.html
  useEffect(() => {
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
      sessionStorage.removeItem('redirect');
      const url = new URL(redirect, window.location.origin);
      router.navigate(url.pathname + url.search + url.hash);
    }

    // Handle GitHub Pages ?/ redirect
    const { search } = window.location;
    if (search.startsWith('?/')) {
      const path = search.slice(1).replace(/~and~/g, '&');
      window.history.replaceState(null, '', import.meta.env.BASE_URL + path);
    }
  }, []);

  return <RouterProvider router={router} />;
}
