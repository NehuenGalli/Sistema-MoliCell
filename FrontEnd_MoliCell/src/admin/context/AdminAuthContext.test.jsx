import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import AdminLayout from '../components/AdminLayout';
import { AdminAuthProvider } from './AdminAuthContext';
import AdminAuthContext from './AdminAuthContextStore';
import { useAdminAuth } from './useAdminAuth';

const mocks = vi.hoisted(() => ({
  loginAdmin: vi.fn(),
  obtenerSesion: vi.fn(),
  logout: vi.fn(),
  obtenerUsuarioActual: vi.fn(),
}));

vi.mock('../services/adminApi', () => ({ loginAdmin: mocks.loginAdmin }));
vi.mock('../../services/authService', () => ({
  authService: {
    obtenerSesion: mocks.obtenerSesion,
    logout: mocks.logout,
    obtenerUsuarioActual: mocks.obtenerUsuarioActual,
  },
}));

function Consumer() {
  const auth = useAdminAuth();
  return <div>
    <span>{auth.initializing ? 'checking' : auth.adminUser?.email || 'anonymous'}</span>
    <button onClick={() => auth.login('admin@test.com', 'password123')}>login</button>
    <button onClick={() => void auth.logout().catch(() => {})}>logout</button>
  </div>;
}

describe('AdminAuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.obtenerUsuarioActual.mockReturnValue(null);
    mocks.obtenerSesion.mockResolvedValue({ usuario: { id: 1, email: 'session@test.com' } });
    mocks.loginAdmin.mockResolvedValue({ success: true, usuario: { id: 2, email: 'admin@test.com' } });
    mocks.logout.mockResolvedValue(undefined);
  });

  it('restaura la sesión HttpOnly al entrar a una ruta administrativa', async () => {
    render(<MemoryRouter initialEntries={['/admin']}><AdminAuthProvider><Consumer /></AdminAuthProvider></MemoryRouter>);
    expect(screen.getByText('checking')).toBeInTheDocument();
    await screen.findByText('session@test.com');
  });

  it('inicia y cierra sesión actualizando el contexto', async () => {
    render(<MemoryRouter initialEntries={['/admin/login']}><AdminAuthProvider><Consumer /></AdminAuthProvider></MemoryRouter>);
    fireEvent.click(screen.getByText('login'));
    await screen.findByText('admin@test.com');
    fireEvent.click(screen.getByText('logout'));
    await screen.findByText('anonymous');
    expect(mocks.logout).toHaveBeenCalled();
  });

  it('conserva la sesión visible si el servidor rechaza el logout', async () => {
    mocks.obtenerUsuarioActual.mockReturnValue({ id: 2, email: 'admin@test.com' });
    mocks.logout.mockRejectedValueOnce(new Error('sin conexión'));
    render(<MemoryRouter initialEntries={['/admin']}><AdminAuthProvider><Consumer /></AdminAuthProvider></MemoryRouter>);
    fireEvent.click(screen.getByText('logout'));
    await waitFor(() => expect(mocks.logout).toHaveBeenCalled());
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
  });

  it('presenta el error de login sin autenticar', async () => {
    mocks.loginAdmin.mockResolvedValueOnce({ success: false, error: 'Credenciales' });
    render(<MemoryRouter initialEntries={['/admin/login']}><AdminAuthProvider><Consumer /></AdminAuthProvider></MemoryRouter>);
    fireEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
  });
});

describe('AdminProtectedRoute', () => {
  const renderProtected = (value) => render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminAuthContext.Provider value={value}>
        <Routes>
          <Route path="/admin" element={<AdminProtectedRoute><span>privado</span></AdminProtectedRoute>} />
          <Route path="/admin/login" element={<span>login-page</span>} />
        </Routes>
      </AdminAuthContext.Provider>
    </MemoryRouter>,
  );

  it('muestra espera, contenido o redirección según el estado', () => {
    const first = renderProtected({ initializing: true, isAuthenticated: false });
    expect(screen.getByRole('status')).toBeInTheDocument();
    first.unmount();

    const second = renderProtected({ initializing: false, isAuthenticated: true });
    expect(screen.getByText('privado')).toBeInTheDocument();
    second.unmount();

    renderProtected({ initializing: false, isAuthenticated: false });
    expect(screen.getByText('login-page')).toBeInTheDocument();
  });
});

describe('AdminLayout logout', () => {
  const renderLayout = (logout) => render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminAuthContext.Provider value={{
        adminUser: { email: 'admin@test.com' },
        isAuthenticated: true,
        logout,
      }}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<span>contenido privado</span>} />
          </Route>
          <Route path="/admin/login" element={<span>login-page</span>} />
        </Routes>
      </AdminAuthContext.Provider>
    </MemoryRouter>,
  );

  it('espera al servidor antes de navegar al login', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    renderLayout(logout);
    fireEvent.click(screen.getByRole('button', { name: /Cerrar Sesión/i }));
    await screen.findByText('login-page');
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('informa el error y mantiene el panel cuando el logout falla', async () => {
    const logout = vi.fn().mockRejectedValue(new Error('sin conexión'));
    renderLayout(logout);
    fireEvent.click(screen.getByRole('button', { name: /Cerrar Sesión/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cerrar la sesión');
    expect(screen.getByText('contenido privado')).toBeInTheDocument();
  });
});
