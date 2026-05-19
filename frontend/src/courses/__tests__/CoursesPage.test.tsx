import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '../../__tests__/test-utils';
import { ToastProvider } from '../../components/ToastProvider';
import { server } from '../../__tests__/msw/server';
import { CoursesPage } from '../CoursesPage';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/courses" element={<CoursesPage />} />
      </Routes>
    </ToastProvider>
  );
}

describe('CoursesPage', () => {
  it('renders courses with sequential row numbers, no IDs visible', async () => {
    renderWithProviders(<App />, { initialEntries: ['/courses'] });
    await waitFor(() => expect(screen.getByText('Algorithms')).toBeInTheDocument());
    expect(screen.getByText('Data Structures')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    const html = document.body.innerHTML;
    expect(html).not.toContain('c-1');
    expect(html).not.toContain('c-2');
  });

  it('shows empty state when there are no courses', async () => {
    server.use(http.get('/api/courses', () => HttpResponse.json({ items: [] })));
    renderWithProviders(<App />, { initialEntries: ['/courses'] });
    await waitFor(() => expect(screen.getByText(/no courses yet/i)).toBeInTheDocument());
  });
});
