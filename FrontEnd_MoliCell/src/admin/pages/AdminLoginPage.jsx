import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '../context/useAdminAuth';
import './AdminLoginPage.css';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const { login, loading } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const errors = {};
    if (!email.trim()) errors.email = 'El campo es obligatorio';
    if (!password) errors.password = 'El campo es obligatorio';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const res = await login(email, password);
    if (res.success) {
      navigate('/admin');
    } else {
      setErrorMsg(res.error || 'Credenciales inválidas');
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-card-container">
        
        <div className="login-card-header">
          <div className="login-badge-icon">
            <ShieldCheck size={32} />
          </div>
          <h1>Moli-Cell Admin</h1>
          <p>Ingresá tus credenciales para administrar la tienda</p>
        </div>

        {errorMsg && (
          <div className="login-error-alert animate-fade-in" role="alert">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
          <div className="login-field">
            <label htmlFor="email">Correo Electrónico</label>
            <div className="input-icon-group">
              <Mail size={18} className="input-icon input-icon-left" />
              <input
                id="email"
                type="email"
                className={formErrors.email ? 'input-has-error' : ''}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="admin@molicell.com"
                autoComplete="email"
              />
            </div>
            {formErrors.email && <span className="field-error-text">{formErrors.email}</span>}
          </div>

          <div className="login-field">
            <label htmlFor="password">Contraseña</label>
            <div className="input-icon-group">
              <Lock size={18} className="input-icon input-icon-left" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={formErrors.password ? 'input-has-error' : ''}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
                }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formErrors.password && <span className="field-error-text">{formErrors.password}</span>}
          </div>

          <button type="submit" className="btn-login-submit" disabled={loading}>
            <span>{loading ? 'Ingresando…' : 'Iniciar Sesión'}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

      </div>
    </div>
  );
}
