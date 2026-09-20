import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CartDrawer from './CartDrawer/CartDrawer';
import ProductCard from './ProductCard/ProductCard';

describe('componentes comerciales', () => {
  it('muestra un producto con descuento y enlace al detalle', () => {
    render(
      <MemoryRouter>
        <ProductCard product={{ id: 7, name: 'Teléfono', precio: 1000, descuento: true, descuento_precio: 750, categoria: 'Celulares' }} />
      </MemoryRouter>,
    );
    expect(screen.getByText('-25%')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /teléfono|comprar ahora/i })[0]).toHaveAttribute('href', '/producto/7');
  });

  it('opera cantidades, eliminación y checkout del carrito', () => {
    const update = vi.fn();
    const remove = vi.fn();
    const close = vi.fn();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<CartDrawer
      isOpen
      onClose={close}
      onUpdateQuantity={update}
      onRemoveItem={remove}
      cartItems={[{ id: 1, nombre: 'Cable', precio: 100, cantidad: 2, imagen: '/cable.webp' }]}
    />);

    fireEvent.click(screen.getByText('>'));
    fireEvent.click(screen.getByLabelText('Eliminar producto'));
    fireEvent.click(screen.getByText('INICIAR COMPRA POR WHATSAPP'));
    expect(update).toHaveBeenCalledWith(1, 3);
    expect(remove).toHaveBeenCalledWith(1);
    expect(open).toHaveBeenCalledWith(expect.stringContaining('wa.me'), '_blank', 'noopener,noreferrer');
  });

  it('no renderiza el drawer cerrado ni una tarjeta sin producto', () => {
    const { container, rerender } = render(<CartDrawer isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<ProductCard product={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
