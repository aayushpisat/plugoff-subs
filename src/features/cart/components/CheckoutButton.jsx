import { apiClient, apiErrorMessage } from '../../../core/api/client.js';
import { useRef, useState } from 'react';
import { Button } from '../../../core/ui/Button.jsx';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../../core/context/CartContext.jsx';
import { useSecurity } from '../../../core/context/SecurityContext.jsx';
import { ENDPOINTS } from '../../../core/api/endpoints.js';

export const CheckoutButton = () => {
  const { items, clearCart } = useCart();
  const { isRateLimited, retryAfter } = useSecurity();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const handleCheckout = async () => {
    if (!items.length || pending.current || isRateLimited) return;
    pending.current = true; setIsProcessing(true); setError('');
    try {
      const { data } = await apiClient.post(ENDPOINTS.CART.CHECKOUT, {
        items: items.map(({ productId, quantity, freebies }) => ({ productId, quantity, freebies })),
      });
      if (!data?.orderId || data?.status !== 'confirmed') throw new Error('Order not confirmed');
      setOrderComplete(true);
      clearCart('Your order has been confirmed. Thank you!');
    } catch (error) {
      setError(apiErrorMessage(error, 'Checkout is unavailable. Your cart has been kept. Please try again later.'));
    } finally { pending.current = false; setIsProcessing(false); }
  };

  if (orderComplete) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-xs text-left">
        <div className="flex items-center gap-2 font-bold text-sm mb-1">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Order Confirmed</span>
        </div>
        <p className="mt-1 text-emerald-700">
          Thank you. Your order has been confirmed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={items.length === 0 || isRateLimited}
        isLoading={isProcessing}
        onClick={handleCheckout}
        icon={Lock}
      >
        {isRateLimited
          ? `Checkout Locked (${retryAfter}s)`
          : `Secure Checkout (${items.length} ${items.length === 1 ? 'item' : 'items'})`}
      </Button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-zinc-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Your order will be confirmed before your cart is cleared.</span>
      </div>
    </div>
  );
};

export default CheckoutButton;
