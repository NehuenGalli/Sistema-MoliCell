/**
 * Helper para búsqueda de productos.
 * Los datos se obtienen dinámicamente desde la base de datos backend.
 */

export const MOCK_PRODUCTS = [];

export const DEFAULT_FEATURED_PRODUCTS = [];

export const DEFAULT_OFFER_PRODUCTS = [];

export const getProductById = (id, productosFromApi = []) => {
  if (!id) return null;
  const strId = String(id);
  
  return productosFromApi.find(
    (p) => String(p.id_producto || p.id) === strId
  ) || null;
};
