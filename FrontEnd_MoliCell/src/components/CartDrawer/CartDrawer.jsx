import { X, Trash2 } from 'lucide-react';
import './CartDrawer.css';

const CartDrawer = ({ 
    isOpen, 
    onClose, 
    cartItems = [], 
    onUpdateQuantity, 
    onRemoveItem 
}) => {
    if (!isOpen) return null;

    const total = cartItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) return;
        const lineas = cartItems.map(
            (item) => `• ${item.nombre} x${item.cantidad} - ${formatPrice(item.precio * item.cantidad)}`
        );
        const mensaje = [
            `🛍️ *NUEVA COMPRA MOLI-CELL*`,
            ...lineas,
            ``,
            `💰 *TOTAL:* ${formatPrice(total)}`,
            `📍 Por favor indicar método de pago (Efectivo/Transferencia/Tarjeta) y si retira por el local o prefiere envío.`
        ].join('\n');

        window.open(`https://wa.me/5491134324675?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="cart-overlay" onClick={onClose}>
            <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
                
                {/* Header del Carrito */}
                <div className="cart-header">
                    <h2>Carrito de compras</h2>
                    <button className="cart-close-btn" onClick={onClose} aria-label="Cerrar carrito">
                        <X size={24} />
                    </button>
                </div>

                {/* Cuerpo con la lista de productos */}
                <div className="cart-body">
                    {cartItems.length === 0 ? (
                        <div className="cart-empty">
                            <p>Tu carrito está vacío.</p>
                        </div>
                    ) : (
                        <div className="cart-items-list">
                            {cartItems.map((item) => (
                                <div key={item.id} className="cart-item-card">
                                    <div className="cart-item-image">
                                        <img src={item.imagen} alt={item.nombre} />
                                    </div>
                                    
                                    <div className="cart-item-details">
                                        <div className="cart-item-top">
                                            <h3 className="cart-item-name">{item.nombre}</h3>
                                            <button 
                                                className="cart-item-delete"
                                                onClick={() => onRemoveItem(item.id)}
                                                aria-label="Eliminar producto"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="cart-item-bottom">
                                            <div className="cart-quantity-selector">
                                                <button 
                                                    onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
                                                    disabled={item.cantidad <= 1}
                                                >
                                                    &lt;
                                                </button>
                                                <span>{item.cantidad}</span>
                                                <button 
                                                    onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
                                                >
                                                    &gt;
                                                </button>
                                            </div>
                                            <span className="cart-item-price">
                                                {formatPrice(item.precio * item.cantidad)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer con Total e Iniciar Compra */}
                {cartItems.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-total-row">
                            <span className="cart-total-label">Total:</span>
                            <span className="cart-total-amount">{formatPrice(total)}</span>
                        </div>

                        <button type="button" className="btn-iniciar-compra" onClick={handleCheckout}>
                            INICIAR COMPRA POR WHATSAPP
                        </button>

                        <button type="button" className="btn-ver-mas-productos" onClick={onClose}>
                            Ver más productos
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
