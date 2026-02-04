import { lazy } from 'react';
import { type RouteObject } from 'react-router-dom';
import { RootLayout } from './layout/RootLayout';

const HomePage = lazy(() => import('@/pages/HomePage'));
const CategoryPage = lazy(() => import('@/pages/CategoryPage'));
const ToolPage = lazy(() => import('@/pages/ToolPage'));
const PipelinePage = lazy(() => import('@/pipeline/PipelinePage'));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tools/:category', element: <CategoryPage /> },
      { path: 'tools/:category/:toolId', element: <ToolPage /> },
      { path: 'pipeline', element: <PipelinePage /> },
    ],
  },
];
