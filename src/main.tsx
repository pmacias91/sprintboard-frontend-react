import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Toaster } from 'sonner';
import App from './app';
import './styles.css';
import './styles/workspace.css';
import './styles/sample-data.css';
import './styles/sample-controls.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

async function start() {
  // MSW is part of the demo runtime, including production preview builds.
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledFrame: 'bypass', quiet: true });
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        {/* URL updates also control the search input and must render synchronously. */}
        <BrowserRouter useTransitions={false}>
          <TooltipProvider delayDuration={250}>
            <App />
            <Toaster position="bottom-right" richColors closeButton />
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

void start().catch(() => {
  const root = document.getElementById('root')!;
  const error = document.createElement('div');
  error.className = 'startup-error';
  const heading = document.createElement('h1');
  heading.textContent = 'Your workspace couldn’t start.';
  const description = document.createElement('p');
  description.textContent =
    'Allow service workers for this local site, then reload to try again.';
  const retry = document.createElement('button');
  retry.className = 'button button-primary';
  retry.textContent = 'Reload workspace';
  retry.onclick = () => window.location.reload();
  error.append(heading, description, retry);
  root.replaceChildren(error);
});
