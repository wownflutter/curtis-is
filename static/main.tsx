import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Portfolio } from '../components/portfolio';
import original from '../app/data/original.json';
import '../app/globals.css';

const pathSegments = window.location.pathname.split('/').filter(Boolean);
const routeBase = pathSegments[0] === 'signal' ? '/signal' : '';
const slug = routeBase === '/signal' ? pathSegments[1] : pathSegments[0];
const initialSlug = original.projects.some(project => project.slug === slug) ? slug : null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Portfolio initialSlug={initialSlug} variant="signal" routeBase={routeBase} />
  </StrictMode>,
);
