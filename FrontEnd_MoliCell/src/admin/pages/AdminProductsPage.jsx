import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Image as ImageIcon,
  Tag,
  AlertCircle,
  Camera,
  Upload,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { 
  fetchAdminProductos, 
  createAdminProducto, 
  updateAdminProducto, 
  deleteAdminProducto,
  reactivarAdminProducto,
  fetchAdminCategorias,
  createAdminCategoria,
  fetchAdminMarcas,
  createAdminMarca
} from '../services/adminApi';
import './AdminProductsPage.css';

export default function AdminProductsPage() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorLoad, setErrorLoad] = useState('');
  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' });

  // ── ESTADOS DE FILTROS AVANZADOS (Side Drawer Panel) ──
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isCategoryAccordionOpen, setIsCategoryAccordionOpen] = useState(true); // Abiertos por defecto
  const [isBrandAccordionOpen, setIsBrandAccordionOpen] = useState(true);       // Abiertos por defecto

  const [filterParams, setFilterParams] = useState({
    status: 'activos', // 'activos', 'inactivos', 'todos'
    conDescuento: false,
    soloDestacados: false,
    selectedCategoryIds: [],
    selectedBrandIds: []
  });

  // Estado para Modal de Creación / Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Modal pequeño de confirmación para creación rápida de Categoría / Marca
  const [confirmCreateModal, setConfirmCreateModal] = useState({
    isOpen: false,
    type: '', // 'categoria' | 'marca'
    name: ''
  });

  // Combobox interactivo de Categorías y Marcas (Buscable + Sin selección por defecto)
  const [catComboboxOpen, setCatComboboxOpen] = useState(false);
  const [catSearchText, setCatSearchText] = useState('');

  const [brandComboboxOpen, setBrandComboboxOpen] = useState(false);
  const [brandSearchText, setBrandSearchText] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Imágenes en el modal (URLs existentes + nuevos archivos local/cámara)
  const [imageItems, setImageItems] = useState([]);

  // Cámara Stream
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Formulario sin opción por defecto en Categoría ni Marca
  const [form, setForm] = useState({
    nombre: '',
    categoria_id: '',
    marca_id: '',
    precio: '', // Texto formateado tipo "150.000"
    precio_costo: '',
    descuento: false,
    descuento_precio: '',
    destacado: false,
    stock: '',
    descripcion: ''
  });

  // Formateador dinámico para precios en ARS con puntos de miles
  const formatMoneyDisplay = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const numStr = String(val).replace(/\D/g, '');
    if (!numStr) return '';
    return Number(numStr).toLocaleString('es-AR');
  };

  const parseMoneyValue = (val) => {
    if (!val) return '';
    const numStr = String(val).replace(/\D/g, '');
    return numStr ? parseFloat(numStr) : '';
  };

  useEffect(() => {
    loadInitialData();
  }, [filterParams.status]);

  const loadInitialData = async () => {
    setLoading(true);
    setErrorLoad('');
    try {
      const incluirInactivos = filterParams.status !== 'activos';
      const [prods, cats, mrcs] = await Promise.all([
        fetchAdminProductos(incluirInactivos),
        fetchAdminCategorias(),
        fetchAdminMarcas()
      ]);
      setProductos(prods);
      setCategorias(cats);
      setMarcas(mrcs);
    } catch (err) {
      setErrorLoad(err.message || 'Error al conectar con la base de datos para cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg({ text: '', type: 'success' }), 3500);
  };

  // Abrir Modal de Creación (SIN opción por defecto en categoría ni marca)
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setImageItems([]);
    setFormErrors({});

    setForm({
      nombre: '',
      categoria_id: '',
      marca_id: '',
      precio: '',
      precio_costo: '',
      descuento: false,
      descuento_precio: '',
      destacado: false,
      stock: '',
      descripcion: ''
    });

    setCatSearchText('');
    setBrandSearchText('');
    setCatComboboxOpen(false);
    setBrandComboboxOpen(false);
    setIsModalOpen(true);
  };

  // Abrir Modal de Edición
  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setFormErrors({});

    let catId = '';
    let catName = '';
    if (Array.isArray(prod.categorias) && prod.categorias.length > 0) {
      const firstCat = prod.categorias[0];
      catId = typeof firstCat === 'object' ? (firstCat.id || firstCat.id_categoria) : firstCat;
      catName = typeof firstCat === 'object' ? (firstCat.name || firstCat.nombre) : '';
    } else if (prod.categoria_id) {
      catId = prod.categoria_id;
    }
    if (!catName && catId) {
      const foundCat = categorias.find(c => String(c.id || c.id_categoria) === String(catId));
      catName = foundCat ? (foundCat.name || foundCat.nombre) : '';
    }

    const foundBrand = marcas.find(m => String(m.id || m.id_marca) === String(prod.marca_id));
    const brandName = prod.marca || (foundBrand ? (foundBrand.name || foundBrand.nombre) : '');

    setForm({
      nombre: prod.name || prod.nombre || '',
      categoria_id: catId ? String(catId) : '',
      marca_id: prod.marca_id ? String(prod.marca_id) : '',
      precio: formatMoneyDisplay(prod.precio),
      precio_costo: formatMoneyDisplay(prod.precio_costo),
      descuento: !!prod.descuento,
      descuento_precio: formatMoneyDisplay(prod.descuento_precio),
      destacado: !!prod.destacado,
      stock: prod.stock !== undefined && prod.stock !== null ? String(prod.stock) : '',
      descripcion: prod.descripcion || ''
    });

    setCatSearchText(catName || '');
    setBrandSearchText(brandName || '');

    // Imágenes existentes
    const existingImgs = [];
    if (prod.img_url) existingImgs.push(prod.img_url);
    if (Array.isArray(prod.imagenes)) {
      prod.imagenes.forEach(url => {
        if (typeof url === 'string' && !existingImgs.includes(url)) {
          existingImgs.push(url);
        }
      });
    }

    setImageItems(existingImgs.map(url => ({ url, isExisting: true })));
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const newItems = files.map(file => ({
      url: URL.createObjectURL(file),
      file,
      isExisting: false
    }));
    setImageItems(prev => [...prev, ...newItems]);
  };

  const handleRemoveImageItem = (index) => {
    setImageItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Cámara web activa
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      showToast('No se pudo acceder a la cámara. Verificá los permisos del navegador.', 'error');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camara_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const newItem = {
        url: URL.createObjectURL(file),
        file,
        isExisting: false
      };
      setImageItems(prev => [...prev, newItem]);
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  // Abrir modal pequeño de confirmación para crear categoría o marca
  const promptCreateCategory = (name) => {
    if (!name.trim()) return;
    setCatComboboxOpen(false);
    setConfirmCreateModal({
      isOpen: true,
      type: 'categoria',
      name: name.trim()
    });
  };

  const promptCreateBrand = (name) => {
    if (!name.trim()) return;
    setBrandComboboxOpen(false);
    setConfirmCreateModal({
      isOpen: true,
      type: 'marca',
      name: name.trim()
    });
  };

  // Ejecutar la creación tras la confirmación en el modal
  const handleConfirmCreateInlineItem = async () => {
    const { type, name } = confirmCreateModal;
    if (!name) return;

    try {
      if (type === 'categoria') {
        const newCat = await createAdminCategoria(name);
        const newId = newCat.id || newCat.id_categoria;
        setCategorias(prev => [...prev, newCat]);
        setForm(prev => ({ ...prev, categoria_id: String(newId) }));
        setCatSearchText(newCat.name || newCat.nombre || name);
        if (formErrors.categoria_id) setFormErrors(prev => ({ ...prev, categoria_id: '' }));
        showToast(`¡Categoría "${name}" creada y seleccionada!`, 'success');
      } else if (type === 'marca') {
        const newBrand = await createAdminMarca(name);
        const newId = newBrand.id || newBrand.id_marca;
        setMarcas(prev => [...prev, newBrand]);
        setForm(prev => ({ ...prev, marca_id: String(newId) }));
        setBrandSearchText(newBrand.name || newBrand.nombre || name);
        if (formErrors.marca_id) setFormErrors(prev => ({ ...prev, marca_id: '' }));
        showToast(`¡Marca "${name}" creada y seleccionada!`, 'success');
      }
    } catch (err) {
      showToast(err.message || `Error al crear ${type}`, 'error');
    } finally {
      setConfirmCreateModal({ isOpen: false, type: '', name: '' });
    }
  };

  // Guardar Producto (FormData)
  const handleSaveProduct = async (e) => {
    e.preventDefault();

    const rawPrecio = parseMoneyValue(form.precio);
    const rawPrecioCosto = parseMoneyValue(form.precio_costo);
    const rawDescuentoPrecio = parseMoneyValue(form.descuento_precio);

    const errors = {};
    if (!form.nombre.trim()) errors.nombre = 'El campo es obligatorio';
    if (!form.categoria_id) errors.categoria_id = 'El campo es obligatorio';
    if (!form.marca_id) errors.marca_id = 'El campo es obligatorio';
    if (!rawPrecio || rawPrecio <= 0) errors.precio = 'El campo es obligatorio';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const formData = new FormData();
    formData.append('name', form.nombre.trim());
    formData.append('precio', rawPrecio);
    formData.append('precio_costo', rawPrecioCosto || 0);
    formData.append('stock', form.stock !== '' ? form.stock : '0');
    formData.append('descuento', form.descuento);
    if (form.descuento) {
      formData.append('descuento_precio', rawDescuentoPrecio || rawPrecio);
    } else {
      formData.append('descuento_precio', '');
    }
    formData.append('destacado', form.destacado);
    formData.append('marca_id', parseInt(form.marca_id, 10));

    if (form.categoria_id) {
      formData.append('categorias', JSON.stringify([parseInt(form.categoria_id, 10)]));
    }
    formData.append('descripcion', form.descripcion.trim());

    // Retener URLs existentes conservadas
    const existingUrls = imageItems.filter(item => item.isExisting).map(item => item.url);
    if (existingUrls.length > 0) {
      formData.append('imagenes', JSON.stringify(existingUrls));
      formData.append('img_url', existingUrls[0]);
    }

    // Adjuntar archivos nuevos
    imageItems.filter(item => item.file instanceof File).forEach(item => {
      formData.append('imagenes', item.file);
    });

    try {
      if (editingProduct) {
        await updateAdminProducto(editingProduct.id || editingProduct.id_producto, formData);
        showToast('¡Producto actualizado con éxito!', 'success');
      } else {
        await createAdminProducto(formData);
        showToast('¡Nuevo producto creado con éxito!', 'success');
      }
      setIsModalOpen(false);
      stopCamera();
      loadInitialData();
    } catch (err) {
      showToast(err.message || 'Error al guardar el producto en el servidor', 'error');
    }
  };

  // Alternar Destacado Rápido (Click directo en tabla)
  const handleToggleDestacado = async (prodId, currentDestacado, prodName) => {
    const newStatus = !currentDestacado;
    // Actualización optimista inmediata en UI
    setProductos(prev => prev.map(p => {
      if ((p.id || p.id_producto) === prodId) {
        return { ...p, destacado: newStatus };
      }
      return p;
    }));

    try {
      await updateAdminProducto(prodId, { destacado: newStatus });
      showToast(
        newStatus 
          ? `¡"${prodName}" marcado como Destacado ⭐!` 
          : `"${prodName}" quitado de destacados.`,
        'success'
      );
    } catch (err) {
      // Revertir si hubo error
      setProductos(prev => prev.map(p => {
        if ((p.id || p.id_producto) === prodId) {
          return { ...p, destacado: currentDestacado };
        }
        return p;
      }));
      showToast(err.message || 'Error al actualizar estado de destacado', 'error');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`¿Confirmás dar de baja el producto "${name}"? El producto pasará al listado de eliminados.`)) {
      try {
        await deleteAdminProducto(id);
        showToast('Producto dado de baja', 'success');
        loadInitialData();
      } catch (err) {
        showToast(err.message || 'Error al eliminar el producto', 'error');
      }
    }
  };

  const handleReactivarProduct = async (id, name) => {
    try {
      await reactivarAdminProducto(id);
      showToast(`¡Producto "${name}" reactivado en catálogo!`, 'success');
      loadInitialData();
    } catch (err) {
      showToast(err.message || 'Error al reactivar el producto', 'error');
    }
  };

  // Restablecer Filtros
  const handleResetFilters = () => {
    setFilterParams({
      status: 'activos',
      conDescuento: false,
      soloDestacados: false,
      selectedCategoryIds: [],
      selectedBrandIds: []
    });
    setSearchTerm('');
  };

  // Manejar selección múltiple de Categorías en el Drawer
  const handleToggleCategoryFilter = (catId) => {
    setFilterParams(prev => {
      const exists = prev.selectedCategoryIds.includes(catId);
      const updated = exists 
        ? prev.selectedCategoryIds.filter(id => id !== catId)
        : [...prev.selectedCategoryIds, catId];
      return { ...prev, selectedCategoryIds: updated };
    });
  };

  // Manejar selección múltiple de Marcas en el Drawer
  const handleToggleBrandFilter = (brandId) => {
    setFilterParams(prev => {
      const exists = prev.selectedBrandIds.includes(brandId);
      const updated = exists 
        ? prev.selectedBrandIds.filter(id => id !== brandId)
        : [...prev.selectedBrandIds, brandId];
      return { ...prev, selectedBrandIds: updated };
    });
  };

  // Conteo de Filtros Activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterParams.status !== 'activos') count++;
    if (filterParams.conDescuento) count++;
    if (filterParams.soloDestacados) count++;
    if (filterParams.selectedCategoryIds.length > 0) count += filterParams.selectedCategoryIds.length;
    if (filterParams.selectedBrandIds.length > 0) count += filterParams.selectedBrandIds.length;
    return count;
  }, [filterParams]);

  // Filtrado de Productos en Memoria Local / PostgreSQL
  const filteredProducts = productos.filter(p => {
    // 1. Estado
    if (filterParams.status === 'activos' && p.activo === false) return false;
    if (filterParams.status === 'inactivos' && p.activo !== false) return false;

    // 2. Con Descuento
    if (filterParams.conDescuento && !p.descuento) return false;

    // 3. Solo Destacados
    if (filterParams.soloDestacados && !p.destacado) return false;

    // 4. Categorías
    if (filterParams.selectedCategoryIds.length > 0) {
      const selectedCatStrs = filterParams.selectedCategoryIds.map(String);
      let prodCatIds = [];
      if (Array.isArray(p.categorias) && p.categorias.length > 0) {
        p.categorias.forEach(c => {
          if (c && typeof c === 'object') {
            if (c.id !== undefined) prodCatIds.push(String(c.id));
            if (c.id_categoria !== undefined) prodCatIds.push(String(c.id_categoria));
          } else if (c) {
            prodCatIds.push(String(c));
          }
        });
      }
      if (p.categoria_id !== undefined && p.categoria_id !== null) {
        prodCatIds.push(String(p.categoria_id));
      }
      if (p.id_categoria !== undefined && p.id_categoria !== null) {
        prodCatIds.push(String(p.id_categoria));
      }
      const matchesCategory = selectedCatStrs.some(id => prodCatIds.includes(id));
      if (!matchesCategory) return false;
    }

    // 5. Marcas
    if (filterParams.selectedBrandIds.length > 0) {
      const selectedBrandStrs = filterParams.selectedBrandIds.map(String);
      const prodBrandId = String(p.marca_id || p.id_marca || (typeof p.marca === 'object' ? (p.marca?.id || p.marca?.id_marca) : '') || '');
      if (!selectedBrandStrs.includes(prodBrandId)) {
        return false;
      }
    }

    // 6. Búsqueda por texto
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const name = (p.name || p.nombre || '').toLowerCase();
    const brand = (p.marca || marcas.find(m => String(m.id || m.id_marca) === String(p.marca_id))?.name || '').toLowerCase();
    return name.includes(term) || brand.includes(term);
  });

  return (
    <div className="admin-products-page">
      
      {/* Toast Notificación */}
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

      {/* Banner de Error de Carga */}
      {errorLoad && (
        <div className="admin-error-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '16px 20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={22} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>Error al cargar inventario de productos</strong>
              <span style={{ fontSize: '0.85rem' }}>{errorLoad}</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => loadInitialData()} 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#991B1B', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          >
            <RefreshCw size={15} />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* Cabecera y Acción Principal */}
      <div className="page-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontWeight: 800, fontSize: '1.35rem', color: '#0F172A' }}>
            Inventario de Productos
          </h2>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.88rem' }}>
            Administrá precios, stock, imágenes y productos dados de baja.
          </p>
        </div>

        <button type="button" onClick={handleOpenCreateModal} className="btn-add-main">
          <Plus size={18} />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Controles de Búsqueda y Filtros con Panel Drawer (Mismo diseño de Ventas/Catálogo) */}
      <div className="products-table-controls">
        
        {/* Botón Filtros a la IZQUIERDA en Mobile y Desktop */}
        <button
          type="button"
          className={`admin-filter-btn ${activeFiltersCount > 0 ? 'active' : ''}`}
          onClick={() => setIsFilterMenuOpen(true)}
        >
          <SlidersHorizontal size={17} />
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="filter-badge">{activeFiltersCount}</span>
          )}
        </button>

        {/* Buscador por Nombre/Marca a la DERECHA */}
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o marca..."
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')} className="clear-btn">
              <X size={16} />
            </button>
          )}
        </div>

      </div>

      {/* Panel Drawer Lateral IZQUIERDO de Filtros Avanzados (Estilo Catálogo) */}
      {isFilterMenuOpen && (
        <div className="filter-drawer-overlay" onClick={() => setIsFilterMenuOpen(false)}>
          <div className="filter-drawer-panel left-side" onClick={(e) => e.stopPropagation()}>
            
            <div className="filter-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={18} style={{ color: '#0F172A' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Filtros de Productos</h4>
              </div>
              <button type="button" onClick={() => setIsFilterMenuOpen(false)} className="close-modal-btn">
                <X size={20} />
              </button>
            </div>

            <div className="filter-drawer-body">
              
              {/* 1. Estado de Visibilidad (Activos / Eliminados / Todos) */}
              <div className="filter-field-group">
                <label>Estado del Producto</label>
                <select
                  value={filterParams.status}
                  onChange={(e) => setFilterParams(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="activos">Solo Productos Activos</option>
                  <option value="inactivos">Productos Eliminados / Inactivos</option>
                  <option value="todos">Todos los Productos</option>
                </select>
              </div>

              {/* 2. Filtro Con Descuento */}
              <div className="filter-field-group">
                <label className="filter-checkbox-option" style={{ fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={filterParams.conDescuento}
                    onChange={(e) => setFilterParams(prev => ({ ...prev, conDescuento: e.target.checked }))}
                  />
                  <span>Solo con Descuento</span>
                </label>
              </div>

              {/* 3. Filtro Solo Destacados */}
              <div className="filter-field-group">
                <label className="filter-checkbox-option" style={{ fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={filterParams.soloDestacados}
                    onChange={(e) => setFilterParams(prev => ({ ...prev, soloDestacados: e.target.checked }))}
                  />
                  <span>Solo Destacados</span>
                </label>
              </div>

              {/* 3. Acordeón Categorías (Empieza Cerrado / Colapsado) */}
              <div className="filter-accordion-item">
                <button
                  type="button"
                  className="filter-accordion-header"
                  onClick={() => setIsCategoryAccordionOpen(!isCategoryAccordionOpen)}
                >
                  <span>Categorías ({filterParams.selectedCategoryIds.length})</span>
                  {isCategoryAccordionOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {isCategoryAccordionOpen && (
                  <div className="filter-accordion-content animate-fade-in">
                    {categorias.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: '#64748B' }}>No hay categorías registradas.</span>
                    ) : (
                      categorias.map(cat => {
                        const catId = cat.id || cat.id_categoria;
                        const isSelected = filterParams.selectedCategoryIds.map(String).includes(String(catId));

                        return (
                          <label key={catId} className="filter-checkbox-option">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleCategoryFilter(catId)}
                            />
                            <span>{cat.name || cat.nombre}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* 4. Acordeón Marcas (Empieza Cerrado / Colapsado) */}
              <div className="filter-accordion-item">
                <button
                  type="button"
                  className="filter-accordion-header"
                  onClick={() => setIsBrandAccordionOpen(!isBrandAccordionOpen)}
                >
                  <span>Marcas ({filterParams.selectedBrandIds.length})</span>
                  {isBrandAccordionOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {isBrandAccordionOpen && (
                  <div className="filter-accordion-content animate-fade-in">
                    {marcas.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: '#64748B' }}>No hay marcas registradas.</span>
                    ) : (
                      marcas.map(brand => {
                        const brandId = brand.id || brand.id_marca;
                        const isSelected = filterParams.selectedBrandIds.map(String).includes(String(brandId));

                        return (
                          <label key={brandId} className="filter-checkbox-option">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleBrandFilter(brandId)}
                            />
                            <span>{brand.name || brand.nombre}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Footer con Botón Aplicar Filtro con Check */}
            <div className="filter-drawer-footer">
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn-reset-filters"
              >
                <RotateCcw size={14} /> Limpiar Todo
              </button>
              
              <button
                type="button"
                onClick={() => setIsFilterMenuOpen(false)}
                className="btn-apply-filters"
              >
                <Check size={16} />
                <span>Aplicar Filtros</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Tabla de Productos */}
      <div className="table-card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className="loading-state">Cargando inventario de productos...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="loading-state" style={{ padding: '3rem', color: '#64748B' }}>
            {filterParams.status === 'inactivos' 
              ? 'No hay productos dados de baja en este momento.' 
              : 'No se encontraron productos coincidentes.'}
          </div>
        ) : (
          <table className="admin-table" style={{ width: '100%', minWidth: '720px' }}>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Imagen</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio Venta</th>
                <th>Stock</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const prodId = p.id || p.id_producto;
                const catName = Array.isArray(p.categorias) && p.categorias.length > 0
                  ? (typeof p.categorias[0] === 'object' ? p.categorias[0].name : p.categorias[0])
                  : (p.categoria || 'General');

                const brandName = p.marca || marcas.find(m => String(m.id || m.id_marca) === String(p.marca_id))?.name || 'Sin marca';
                const isInactive = p.activo === false;

                return (
                  <tr key={prodId} style={{ opacity: isInactive ? 0.65 : 1 }}>
                    <td>
                      <img 
                        src={p.img_url || p.imagen || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&q=80'} 
                        alt={p.name || p.nombre} 
                        className="product-table-thumb"
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong className="product-name-title">{p.name || p.nombre}</strong>
                        {(p.destacado || p.descuento) && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {p.destacado && (
                              <span className="featured-tag">DESTACADO</span>
                            )}
                            {p.descuento && (
                              <span className="discount-tag">CON DESCUENTO</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="cat-pill">{catName}</span>
                      <span className="brand-subtext">{brandName}</span>
                    </td>
                    <td>
                      <strong className="price-val">${Number(p.precio).toLocaleString('es-AR')}</strong>
                    </td>
                    <td>
                      <span className={`stock-badge ${Number(p.stock) < 5 ? 'critical' : 'normal'}`}>
                        {p.stock !== undefined ? p.stock : 0} un.
                      </span>
                    </td>
                    <td>
                      {isInactive ? (
                        <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                          Eliminado
                        </span>
                      ) : (
                        <span style={{ background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                          Activo
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="actions-flex">
                        {isInactive ? (
                          <button
                            type="button"
                            onClick={() => handleReactivarProduct(prodId, p.name || p.nombre)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              background: '#10B981',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                            title="Reactivar producto eliminado"
                          >
                            <RefreshCw size={15} />
                            <span>Reactivar</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(p)}
                              className="btn-action edit"
                              title="Editar producto"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prodId, p.name || p.nombre)}
                              className="btn-action delete"
                              title="Dar de baja producto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODAL PEQUEÑO DE CONFIRMACIÓN DE CREACIÓN DIRECTA ── */}
      {confirmCreateModal.isOpen && (
        <div className="admin-modal-overlay" style={{ zIndex: 3000 }} onClick={() => setConfirmCreateModal({ isOpen: false, type: '', name: '' })}>
          <div className="admin-modal-card" style={{ maxWidth: '400px', width: '90%', padding: '20px', borderRadius: '16px' }} onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header" style={{ paddingBottom: '10px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                Crear Nueva {confirmCreateModal.type === 'categoria' ? 'Categoría' : 'Marca'}
              </h3>
              <button 
                type="button" 
                onClick={() => setConfirmCreateModal({ isOpen: false, type: '', name: '' })} 
                className="close-modal-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '8px 0', fontSize: '0.95rem', color: '#334155', lineHeight: '1.5' }}>
              ¿Confirmás crear la {confirmCreateModal.type === 'categoria' ? 'categoría' : 'marca'}{' '}
              <strong style={{ color: '#0F172A', fontWeight: 800 }}>"{confirmCreateModal.name}"</strong>?
            </div>

            <div className="modal-footer" style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '10px', width: '100%' }}>
              <button 
                type="button" 
                onClick={() => setConfirmCreateModal({ isOpen: false, type: '', name: '' })} 
                className="btn-cancel"
                style={{ flex: '1', maxWidth: '120px' }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmCreateInlineItem} 
                className="btn-save"
                style={{ flex: '1', maxWidth: '140px', background: '#0F172A', color: '#FFFFFF', fontWeight: 800 }}
              >
                Crear
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL DE CREACIÓN / EDICIÓN ── */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={() => { setIsModalOpen(false); stopCamera(); }}>
          <div className="admin-modal-card" style={{ maxWidth: '650px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <h3>{editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}</h3>
              <button type="button" onClick={() => { setIsModalOpen(false); stopCamera(); }} className="close-modal-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="modal-form" noValidate>
              
              {/* Nombre */}
              <div className="form-group">
                <label>Nombre del Producto *</label>
                <input
                  type="text"
                  className={formErrors.nombre ? 'input-has-error' : ''}
                  value={form.nombre}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, nombre: e.target.value }));
                    if (formErrors.nombre) setFormErrors(prev => ({ ...prev, nombre: '' }));
                  }}
                  placeholder="Ej: iPhone 14 Pro Max 256GB"
                />
                {formErrors.nombre && (
                  <span className="field-error-text">{formErrors.nombre}</span>
                )}
              </div>

              {/* Categoría y Marca con Combobox Buscable (Sin default) */}
              <div className="form-grid-2">
                
                {/* Categoría Combobox */}
                <div className="form-group">
                  <label>Categoría *</label>
                  <div className="combobox-container">
                    <input
                      type="text"
                      className={formErrors.categoria_id ? 'input-has-error' : ''}
                      value={catSearchText}
                      onChange={(e) => {
                        setCatSearchText(e.target.value);
                        setForm(prev => ({ ...prev, categoria_id: '' }));
                        setCatComboboxOpen(true);
                        if (formErrors.categoria_id) setFormErrors(prev => ({ ...prev, categoria_id: '' }));
                      }}
                      onFocus={() => setCatComboboxOpen(true)}
                      placeholder="Seleccionar o escribir categoría..."
                    />
                    
                    {catComboboxOpen && (
                      <div className="combobox-dropdown">
                        {categorias
                          .filter(c => (c.name || c.nombre || '').toLowerCase().includes(catSearchText.toLowerCase().trim()))
                          .map(c => {
                            const cId = String(c.id || c.id_categoria);
                            return (
                              <div
                                key={cId}
                                className="combobox-option"
                                onClick={() => {
                                  setForm(prev => ({ ...prev, categoria_id: cId }));
                                  setCatSearchText(c.name || c.nombre);
                                  setCatComboboxOpen(false);
                                  if (formErrors.categoria_id) setFormErrors(prev => ({ ...prev, categoria_id: '' }));
                                }}
                              >
                                <span>{c.name || c.nombre}</span>
                                {form.categoria_id === cId && <Check size={14} style={{ color: '#10B981' }} />}
                              </div>
                            );
                        })}

                        {/* Opción de Crear Categoría abre Modal Pequeño de Confirmación */}
                        {catSearchText.trim() && !categorias.some(c => (c.name || c.nombre || '').toLowerCase() === catSearchText.trim().toLowerCase()) && (
                          <div
                            className="combobox-option create-new"
                            onClick={() => promptCreateCategory(catSearchText)}
                          >
                            <Plus size={16} style={{ flexShrink: 0 }} />
                            <span>Crear nueva categoría "{catSearchText}"</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {formErrors.categoria_id && (
                    <span className="field-error-text">{formErrors.categoria_id}</span>
                  )}
                </div>

                {/* Marca Combobox */}
                <div className="form-group">
                  <label>Marca *</label>
                  <div className="combobox-container">
                    <input
                      type="text"
                      className={formErrors.marca_id ? 'input-has-error' : ''}
                      value={brandSearchText}
                      onChange={(e) => {
                        setBrandSearchText(e.target.value);
                        setForm(prev => ({ ...prev, marca_id: '' }));
                        setBrandComboboxOpen(true);
                        if (formErrors.marca_id) setFormErrors(prev => ({ ...prev, marca_id: '' }));
                      }}
                      onFocus={() => setBrandComboboxOpen(true)}
                      placeholder="Seleccionar o escribir marca..."
                    />
                    
                    {brandComboboxOpen && (
                      <div className="combobox-dropdown">
                        {marcas
                          .filter(m => (m.name || m.nombre || '').toLowerCase().includes(brandSearchText.toLowerCase().trim()))
                          .map(m => {
                            const mId = String(m.id || m.id_marca);
                            return (
                              <div
                                key={mId}
                                className="combobox-option"
                                onClick={() => {
                                  setForm(prev => ({ ...prev, marca_id: mId }));
                                  setBrandSearchText(m.name || m.nombre);
                                  setBrandComboboxOpen(false);
                                  if (formErrors.marca_id) setFormErrors(prev => ({ ...prev, marca_id: '' }));
                                }}
                              >
                                <span>{m.name || m.nombre}</span>
                                {form.marca_id === mId && <Check size={14} style={{ color: '#10B981' }} />}
                              </div>
                            );
                        })}

                        {/* Opción de Crear Marca abre Modal Pequeño de Confirmación */}
                        {brandSearchText.trim() && !marcas.some(m => (m.name || m.nombre || '').toLowerCase() === brandSearchText.trim().toLowerCase()) && (
                          <div
                            className="combobox-option create-new"
                            onClick={() => promptCreateBrand(brandSearchText)}
                          >
                            <Plus size={16} style={{ flexShrink: 0 }} />
                            <span>Crear nueva marca "{brandSearchText}"</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {formErrors.marca_id && (
                    <span className="field-error-text">{formErrors.marca_id}</span>
                  )}
                </div>

              </div>

              {/* Precio Venta y Precio Costo con Puntos para Miles */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Precio de Venta ($ ARS) *</label>
                  <input
                    type="text"
                    className={formErrors.precio ? 'input-has-error' : ''}
                    value={form.precio}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, precio: formatMoneyDisplay(e.target.value) }));
                      if (formErrors.precio) setFormErrors(prev => ({ ...prev, precio: '' }));
                    }}
                    placeholder="Ej: 450.000"
                  />
                  {formErrors.precio && (
                    <span className="field-error-text">{formErrors.precio}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Precio Costo ($ ARS)</label>
                  <input
                    type="text"
                    value={form.precio_costo}
                    onChange={(e) => setForm(prev => ({ ...prev, precio_costo: formatMoneyDisplay(e.target.value) }))}
                    placeholder="Ej: 320.000"
                  />
                </div>
              </div>

              {/* Stock y Opciones Especiales (Destacado y Descuento) */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Stock Disponible *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onFocus={(e) => {
                      if (e.target.value === '0' || e.target.value === 0) {
                        setForm(prev => ({ ...prev, stock: '' }));
                      }
                    }}
                    onChange={(e) => setForm(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="Ej: 10"
                    required
                  />
                </div>

                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <div className="destacado-toggle-card">
                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.destacado}
                        onChange={(e) => setForm(prev => ({ ...prev, destacado: e.target.checked }))}
                      />
                      <span>Producto destacado</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Toggle de Descuento */}
              <div className="form-group">
                <div className="discount-toggle-card">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.descuento}
                      onChange={(e) => setForm(prev => ({ ...prev, descuento: e.target.checked }))}
                    />
                    <span>¿Aplicar Precio con Descuento?</span>
                  </label>
                </div>
              </div>

              {form.descuento && (
                <div className="form-group">
                  <label>Precio Promocional con Descuento ($ ARS) *</label>
                  <input
                    type="text"
                    value={form.descuento_precio}
                    onChange={(e) => setForm(prev => ({ ...prev, descuento_precio: formatMoneyDisplay(e.target.value) }))}
                    placeholder="Ej: 410.000"
                    required={form.descuento}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Descripción del Producto</label>
                <textarea
                  rows="3"
                  value={form.descripcion}
                  onChange={(e) => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Detalles de especificaciones técnicas o estado del producto..."
                />
              </div>

              {/* Sección de Carga de Fotos / Cámara (Mismo Tamaño de Botones) */}
              <div className="form-group" style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <label style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <ImageIcon size={18} />
                  <span>Imágenes del Producto</span>
                </label>

                {/* Vista previa de imágenes cargadas */}
                {imageItems.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {imageItems.map((item, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '70px', height: '70px' }}>
                        <img
                          src={item.url}
                          alt="preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImageItem(idx)}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            background: '#EF4444',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botones de Acción de Mismo Tamaño */}
                <div className="image-upload-actions-row">
                  <label className="btn-upload-file">
                    <Upload size={16} />
                    <span>Seleccionar Archivos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {!isCameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="btn-take-camera"
                    >
                      <Camera size={16} />
                      <span>Tomar con Cámara</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="btn-take-camera"
                      style={{ background: '#DC2626', borderColor: '#DC2626' }}
                    >
                      <X size={16} />
                      <span>Cerrar Cámara</span>
                    </button>
                  )}
                </div>

                {/* Transmisión de la Cámara en Vivo */}
                {isCameraActive && (
                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '240px', borderRadius: '8px', background: '#000' }} />
                    <button
                      type="button"
                      onClick={capturePhoto}
                      style={{ marginTop: '8px', padding: '8px 16px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Capturar Foto
                    </button>
                  </div>
                )}
              </div>

              {/* Botones del Footer Centrados */}
              <div className="modal-footer">
                <button type="button" onClick={() => { setIsModalOpen(false); stopCamera(); }} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
