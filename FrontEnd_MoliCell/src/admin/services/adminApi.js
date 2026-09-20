import {
  authService,
  productoService,
  categoriaService,
  marcaService,
  tecnicoService,
  ventaService,
  dashboardService
} from '../../services';

// ─── 1. AUTENTICACIÓN ────────────────────────────────────────────────────────
export const loginAdmin = async (email, password) => {
  try {
    const data = await authService.login(email, password);
    return { success: true, usuario: data.usuario };
  } catch (err) {
    return { success: false, error: err.message || 'Credenciales inválidas' };
  }
};

// ─── 2. PRODUCTOS ─────────────────────────────────────────────────────────────
export const fetchAdminProductos = async (params = false) => {
  try {
    return await productoService.obtenerProductosAdmin(params);
  } catch (e) {
    console.error('Error al obtener productos del backend:', e);
    throw e;
  }
};

export const createAdminProducto = async (data) => {
  try {
    return await productoService.crearProducto(data);
  } catch (e) {
    console.error('Error al crear producto:', e);
    throw e;
  }
};

export const updateAdminProducto = async (id, data) => {
  try {
    return await productoService.actualizarProducto(id, data);
  } catch (e) {
    console.error('Error al actualizar producto:', e);
    throw e;
  }
};

export const reactivarAdminProducto = async (id) => {
  try {
    await productoService.reactivarProducto(id);
    return true;
  } catch (e) {
    console.error('Error al reactivar producto:', e);
    throw e;
  }
};

export const deleteAdminProducto = async (id) => {
  try {
    await productoService.eliminarProducto(id);
    return true;
  } catch (e) {
    console.error('Error al eliminar producto:', e);
    throw e;
  }
};

// ─── 3. CATEGORÍAS & MARCAS ──────────────────────────────────────────────────
export const fetchAdminCategorias = async () => {
  try {
    return await categoriaService.obtenerCategorias();
  } catch (e) {
    console.error('Error al obtener categorías:', e);
    throw e;
  }
};

export const createAdminCategoria = async (nombre) => {
  try {
    return await categoriaService.crearCategoria(nombre);
  } catch (e) {
    console.error('Error al crear categoría:', e);
    throw e;
  }
};

export const deleteAdminCategoria = async (id) => {
  try {
    await categoriaService.eliminarCategoria(id);
    return true;
  } catch (e) {
    console.error('Error al eliminar categoría:', e);
    throw e;
  }
};

export const fetchAdminMarcas = async () => {
  try {
    return await marcaService.obtenerMarcas();
  } catch (e) {
    console.error('Error al obtener marcas:', e);
    throw e;
  }
};

export const createAdminMarca = async (nombre) => {
  try {
    return await marcaService.crearMarca(nombre);
  } catch (e) {
    console.error('Error al crear marca:', e);
    throw e;
  }
};

export const deleteAdminMarca = async (id) => {
  try {
    await marcaService.eliminarMarca(id);
    return true;
  } catch (e) {
    console.error('Error al eliminar marca:', e);
    throw e;
  }
};

// ─── 4. SERVICIO TÉCNICO / ÓRDENES DE REPARACIÓN ──────────────────────────────
// #9 Fix: acepta params para limitar los datos en el dashboard
export const fetchAdminReparaciones = async (params = {}) => {
  try {
    const res = await tecnicoService.obtenerServiciosTecnicos(params);
    // El service ahora devuelve { servicios, pagination } o arreglo plano según compatibilidad
    return res;
  } catch (e) {
    console.error('Error al obtener servicios técnicos:', e);
    throw e;
  }
};

export const createAdminReparacion = async (data) => {
  try {
    return await tecnicoService.crearServicioTecnico(data);
  } catch (e) {
    console.error('Error al crear orden de reparación:', e);
    throw e;
  }
};

export const updateAdminReparacion = async (id, data) => {
  try {
    return await tecnicoService.actualizarServicioTecnico(id, data);
  } catch (e) {
    console.error('Error al actualizar orden de reparación:', e);
    throw e;
  }
};

export const deleteAdminReparacion = async (id) => {
  try {
    await tecnicoService.eliminarServicioTecnico(id);
    return true;
  } catch (e) {
    console.error('Error al eliminar orden de reparación:', e);
    throw e;
  }
};

// ─── 5. VENTAS / PEDIDOS ──────────────────────────────────────────────────────
export const fetchAdminVentas = async (params = {}) => {
  try {
    return await ventaService.obtenerVentas(params);
  } catch (e) {
    console.error('Error al obtener ventas:', e);
    throw e;
  }
};

export const fetchAdminResumen = async () => {
  const res = await dashboardService.obtenerResumen();
  return res?.data || res;
};

export const createAdminVenta = async (data) => {
  try {
    const res = await ventaService.crearVenta(data);
    return res?.data || res;
  } catch (e) {
    console.error('Error al crear venta:', e);
    throw e;
  }
};
