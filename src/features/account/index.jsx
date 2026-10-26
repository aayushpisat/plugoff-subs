import { useState } from 'react';
import { LoginForm } from './components/LoginForm.jsx';
import { RegisterForm } from './components/RegisterForm.jsx';
import { useAuthActions } from './hooks/useAuthActions.js';
import { UserCheck, LogOut } from 'lucide-react';
import { Button } from '../../core/ui/Button.jsx';

export const Account = () => {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const {
    currentUser,
    isLoading,
    authErrors,
    handleLogin,
    handleRegister,
    handleLogout,
  } = useAuthActions();



  return (
    <div className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-600 font-semibold">
            WELCOME TO PLUGOFF
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mt-2">
            Your account
          </h1>
          <p className="mt-2 text-xs text-zinc-500">
            Sign in to manage your account and programmes.
          </p>
        </div>

        {currentUser ? (
          /* Logged In View */
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-4 pb-6 border-b border-zinc-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">{currentUser.name}</h3>
                <p className="text-xs text-zinc-500 font-mono">{currentUser.email}</p>
              </div>
            </div>

            {authErrors.form && <p role="alert" className="mt-4 text-sm text-rose-700">{authErrors.form}</p>}

            <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center justify-between">
              <Button
                variant="danger"
                size="sm"
                onClick={handleLogout}
                isLoading={isLoading}
                icon={LogOut}
              >
                Log Out
              </Button>
            </div>
          </div>
        ) : (
          /* Authentication Forms */
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
            {/* Tabs */}
            <div className="flex border-b border-zinc-200 mb-6">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  tab === 'login'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('register')}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  tab === 'register'
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
                }`}
              >
                Register
              </button>
            </div>

            {tab === 'login' ? (
              <LoginForm
                onLogin={handleLogin}
                isLoading={isLoading}
                errors={authErrors}
              />
            ) : (
              <RegisterForm
                onRegister={handleRegister}
                isLoading={isLoading}
                errors={authErrors}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;
