import { Outlet } from 'react-router-dom';
import { Suspense, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { ErrorBoundary } from '@/components/error-boundary/ErrorBoundary';

export function RootLayout() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
        <main className="flex-1 min-h-0 overflow-auto pb-14 md:pb-0">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
        <MobileNav />
      </div>
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </div>
  );
}
