import { useState, useEffect, useRef } from 'react';
import { validateEmail, validatePassword } from '../../../core/utils/validators.js';
import { ENDPOINTS } from '../../../core/api/endpoints.js';
import { apiClient, apiErrorMessage } from '../../../core/api/client.js';

const verifiedUser = (data) => {
  const user = data?.user;
  if (!user || typeof user.name !== 'string' || typeof user.email !== 'string') throw new Error('Invalid session response');
  return { name: user.name, email: user.email };
};

export const useAuthActions = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authErrors, setAuthErrors] = useState({});
  const pending = useRef(false);
  const sessionController = useRef(null);
  useEffect(() => {
    // Remove insecure credentials left behind by the old demo implementation.
    try { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); } catch { /* Storage may be disabled. */ }
    const controller = new AbortController();
    sessionController.current = controller;
    apiClient.get(ENDPOINTS.AUTH.ME, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted && !pending.current) setCurrentUser(verifiedUser(data)); })
      .catch(() => { /* An unavailable service or expired session leaves the visitor signed out. */ });
    return () => controller.abort();
  }, []);

  const authenticate = async (endpoint, values, register = false) => {
    if (pending.current) return false;
    const errors = {
      email: validateEmail(values.email),
      password: register ? validatePassword(values.password) : (!values.password ? 'Password is required' : null),
      ...(register && { name: !values.name?.trim() || values.name.trim().length > 100 ? 'Enter a name of 1–100 characters' : null }),
    };
    setAuthErrors(errors);
    if (Object.values(errors).some(Boolean)) return false;
    sessionController.current?.abort();
    pending.current = true; setIsLoading(true);
    try {
      const { data } = await apiClient.post(endpoint, { ...values, email: values.email.trim() });
      setCurrentUser(verifiedUser(data));
      return true;
    } catch (error) {
      setAuthErrors({ form: apiErrorMessage(error, 'Account service unavailable. Please try again later.') });
      return false;
    } finally { pending.current = false; setIsLoading(false); }
  };
  const handleLogout = async () => {
    if (pending.current) return;
    sessionController.current?.abort();
    pending.current = true; setIsLoading(true); setAuthErrors({});
    try { await apiClient.post(ENDPOINTS.AUTH.LOGOUT, {}); setCurrentUser(null); }
    catch { setAuthErrors({ form: 'Could not sign out. Please try again.' }); }
    finally { pending.current = false; setIsLoading(false); }
  };
  return { currentUser, isLoading, authErrors,
    handleLogin: (email, password) => authenticate(ENDPOINTS.AUTH.LOGIN, { email, password }),
    handleRegister: (name, email, password) => authenticate(ENDPOINTS.AUTH.REGISTER, { name: name.trim(), email, password }, true),
    handleLogout,
  };
};
