import { Navbar } from './Navbar.jsx';
import { Footer } from './Footer.jsx';
import { Toast } from '../ui/Toast.jsx';
import { useSecurity } from '../context/SecurityContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { SideCartDrawer } from './SideCartDrawer.jsx';

export const Layout = ({ children, currentPath = '/', navigate }) => {
  const { retryAfter, showBlockSheet, dismissBlockSheet } = useSecurity();
  const { notification } = useCart();
  const hasHero = ['/', '/blog', '/about', '/contact'].includes(currentPath.toLowerCase().replace(/\/$/, '') || '/');
  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white">
      <Navbar currentPath={currentPath} navigate={navigate} />
      <main className={`flex-1 w-full flex flex-col ${hasHero ? '' : 'pt-20 sm:pt-24'}`}>{children}</main>
      <Footer navigate={navigate} />
      <SideCartDrawer navigate={navigate} />
      {notification && <div className="fixed bottom-6 inset-x-4 sm:left-auto sm:right-6 z-50" role="status"><Toast type="success" title="Cart Updated" message={notification.message} /></div>}
      {showBlockSheet && <div className="fixed bottom-6 inset-x-4 sm:left-auto sm:right-6 z-50 max-w-lg rounded-2xl bg-white border border-amber-300 p-5 shadow-xl" role="status">
        <p className="font-bold">Please give it a moment.</p>
        <p className="text-sm mt-2">Too many requests. You can try again in {retryAfter} seconds.</p>
        <button onClick={dismissBlockSheet} className="mt-3 font-semibold underline">Dismiss</button>
      </div>}
    </div>
  );
};
