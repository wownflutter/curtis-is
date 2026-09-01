import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Portfolio } from '../components/portfolio';
import original from '../app/data/original.json';
import '../app/globals.css';

const slug = window.location.pathname.replace(/^\/+|\/+$/g, '');
const initialSlug = original.projects.some(project => project.slug === slug) ? slug : null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Portfolio initialSlug={initialSlug} />
  </StrictMode>,
);
