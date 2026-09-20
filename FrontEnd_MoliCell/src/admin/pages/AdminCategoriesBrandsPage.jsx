import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Tags, ShieldAlert, X } from 'lucide-react';
import { 
  fetchAdminCategorias, 
  createAdminCategoria, 
  deleteAdminCategoria,
  fetchAdminMarcas,
  createAdminMarca,
  deleteAdminMarca
} from '../services/adminApi';

export default function AdminCategoriesBrandsPage() {
  const [activeTab, setActiveTab] = useState('categorias');
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  const [catError, setCatError] = useState('');
  const [brandError, setBrandError] = useState('');

  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' });
  const [errorLoad, setErrorLoad] = useState('');

  const loadData = async () => {
    setErrorLoad('');
    try {
      const [cats, mrcs] = await Promise.all([
        fetchAdminCategorias(),
        fetchAdminMarcas()
      ]);
      setCategorias(cats);
      setMarcas(mrcs);
    } catch (err) {
      setErrorLoad(err.message || 'Error al cargar categorías y marcas desde la base de datos');
    }
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(loadTimer);
  }, []);

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg({ text: '', type: 'success' }), 3500);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCatError('El campo es obligatorio');
      return;
    }
    setCatError('');
    try {
      await createAdminCategoria(newCatName.trim());
      setNewCatName('');
      showToast('Categoría agregada exitosamente', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Error al agregar la categoría', 'error');
    }
  };

  const handleDeleteCategory = async (id, nombre) => {
    if (window.confirm(`¿Confirmás eliminar la categoría "${nombre}"?`)) {
      try {
        const success = await deleteAdminCategoria(id);
        if (success) {
          showToast('Categoría eliminada', 'success');
          loadData();
        } else {
          showToast('No se puede eliminar la categoría porque está asociada a productos.', 'error');
        }
      } catch (err) {
        showToast(err.message || 'Error al eliminar la categoría', 'error');
      }
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!newBrandName.trim()) {
      setBrandError('El campo es obligatorio');
      return;
    }
    setBrandError('');
    try {
      await createAdminMarca(newBrandName.trim());
      setNewBrandName('');
      showToast('Marca agregada exitosamente', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Error al agregar la marca', 'error');
    }
  };

  const handleDeleteBrand = async (id, nombre) => {
    if (window.confirm(`¿Confirmás eliminar la marca "${nombre}"?`)) {
      try {
        const success = await deleteAdminMarca(id);
        if (success) {
          showToast('Marca eliminada', 'success');
          loadData();
        } else {
          showToast('No se puede eliminar la marca porque está asociada a productos.', 'error');
        }
      } catch (err) {
        showToast(err.message || 'Error al eliminar la marca', 'error');
      }
    }
  };

  return (
    <div className="admin-cat-brands-page">
      
      {toastMsg.text && (
        <div 
          className="admin-toast animate-fade-in" 
          style={{ 
            backgroundColor: toastMsg.type === 'error' ? '#EF4444' : '#10B981',
            boxShadow: toastMsg.type === 'error' ? '0 10px 25px rgba(239, 68, 68, 0.3)' : '0 10px 25px rgba(16, 185, 129, 0.3)'
          }}
        >
          {toastMsg.type === 'error' ? <X size={18} /> : <Check size={18} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {errorLoad && (
        <div className="admin-error-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '16px 20px', borderRadius: '12px' }}>
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>Error al cargar categorías y marcas</strong>
            <span style={{ fontSize: '0.85rem' }}>{errorLoad}</span>
          </div>
          <button 
            type="button" 
            onClick={() => loadData()} 
            style={{ background: '#991B1B', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="page-header">
        <h2>Categorías & Marcas</h2>
        <p>Organizá la estructura del catálogo y las marcas comerciales asociadas.</p>
      </div>

      {/* Tabs */}
      <div className="cat-brands-tabs">
        <button 
          type="button" 
          className={`tab-btn ${activeTab === 'categorias' ? 'active' : ''}`}
          onClick={() => setActiveTab('categorias')}
        >
          <Tags size={18} />
          <span>Categorías ({categorias.length})</span>
        </button>

        <button 
          type="button" 
          className={`tab-btn ${activeTab === 'marcas' ? 'active' : ''}`}
          onClick={() => setActiveTab('marcas')}
        >
          <ShieldAlert size={18} />
          <span>Marcas ({marcas.length})</span>
        </button>
      </div>

      {/* ── TAB 1: CATEGORÍAS ── */}
      {activeTab === 'categorias' && (
        <div className="tab-content-grid">
          
          {/* Formulario Agregar */}
          <div className="create-card-box">
            <h3>Nueva Categoría</h3>
            <form onSubmit={handleAddCategory} className="create-form" noValidate>
              <div className="form-group">
                <label>Nombre de Categoría *</label>
                <input
                  type="text"
                  className={catError ? 'input-has-error' : ''}
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    if (catError) setCatError('');
                  }}
                  placeholder="Ej: Smartwatches & Wearables"
                />
                {catError && <span className="field-error-text">{catError}</span>}
              </div>
              <button type="submit" className="btn-submit-cat">
                <Plus size={16} />
                <span>Agregar Categoría</span>
              </button>
            </form>
          </div>

          {/* Lista de Categorías */}
          <div className="items-table-card">
            <h3>Categorías Existentes</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((c) => {
                  const id = c.id || c.id_categoria;
                  const name = c.name || c.nombre;
                  return (
                    <tr key={id}>
                      <td>#{id}</td>
                      <td><strong>{name}</strong></td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteCategory(id, name)}
                          className="btn-action delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ── TAB 2: MARCAS ── */}
      {activeTab === 'marcas' && (
        <div className="tab-content-grid">
          
          {/* Formulario Agregar */}
          <div className="create-card-box">
            <h3>Nueva Marca</h3>
            <form onSubmit={handleAddBrand} className="create-form" noValidate>
              <div className="form-group">
                <label>Nombre de Marca *</label>
                <input
                  type="text"
                  className={brandError ? 'input-has-error' : ''}
                  value={newBrandName}
                  onChange={(e) => {
                    setNewBrandName(e.target.value);
                    if (brandError) setBrandError('');
                  }}
                  placeholder="Ej: Xiaomi / Anker"
                />
                {brandError && <span className="field-error-text">{brandError}</span>}
              </div>
              <button type="submit" className="btn-submit-cat">
                <Plus size={16} />
                <span>Agregar Marca</span>
              </button>
            </form>
          </div>

          {/* Lista de Marcas */}
          <div className="items-table-card">
            <h3>Marcas Existentes</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Marca</th>
                  <th style={{ textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {marcas.map((b) => {
                  const id = b.id || b.id_marca;
                  const name = b.name || b.nombre;
                  return (
                    <tr key={id}>
                      <td>#{id}</td>
                      <td><strong>{name}</strong></td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteBrand(id, name)}
                          className="btn-action delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}
