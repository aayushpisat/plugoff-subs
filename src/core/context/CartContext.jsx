import { normalizeCart, clampQuantity } from '../utils/cart.js';
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'plugoff_cart_v1';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('aerostore_cart_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return normalizeCart(parsed);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [notification, setNotification] = useState(null);
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const [isSideCartOpen, setIsSideCartOpen] = useState(false);

  const openSideCart = () => setIsSideCartOpen(true);
  const closeSideCart = () => setIsSideCartOpen(false);
  const toggleSideCart = () => setIsSideCartOpen((prev) => !prev);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch { /* Cart still works in memory when storage is disabled. */ }
  }, [items]);

  const addToCart = (product, quantity = 1) => {
    if (!product || typeof product.id !== 'string') return;
    quantity = clampQuantity(quantity);
    const itemKey = product.freebies && product.freebies.length > 0
      ? `${product.id}-${[...product.freebies].sort().join('-')}`
      : product.id;

    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === itemKey);
      if (existing) {
        return prevItems.map((item) =>
          item.id === itemKey
            ? { ...item, quantity: clampQuantity(item.quantity + quantity) }
            : item
        );
      }
      return [
        ...prevItems,
        {
          id: itemKey,
          productId: product.id,
          title: product.title || product.name,
          price: Number(product.price) || 0,
          quantity,
          category: product.category || 'Programme',
          image: product.image,
          sku: product.sku || `SKU-${product.id}`,
          freebies: product.freebies || [],
        },
      ];
    });

    setNotification({
      message: `Added "${product.title || product.name}" to cart`,
      timestamp: Date.now(),
    });
    setIsSideCartOpen(true);
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    quantity = clampQuantity(quantity);
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = (message) => {
    setItems([]);
    if (typeof message === 'string') setNotification({ message, timestamp: Date.now() });
  };

  // Calculations
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% estimated tax
  const shipping = subtotal > 150 || subtotal === 0 ? 0 : 15;
  const total = subtotal + tax + shipping;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount,
        subtotal,
        tax,
        shipping,
        total,
        notification,
        isSideCartOpen,
        setIsSideCartOpen,
        openSideCart,
        closeSideCart,
        toggleSideCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
