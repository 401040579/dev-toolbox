import { createContext } from 'react';

export const DraftContext = createContext<{ toolId: string; incoming?: Record<string, unknown>; cleared?: boolean } | null>(null);
