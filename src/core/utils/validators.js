/** Client-side feedback only. The backend must repeat validation and authorization. */
export const validateEmail = (email) => {
  if (typeof email !== 'string' || !email.trim()) return 'Email is required';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address';
  return null;
};
export const validatePassword = (password) => {
  if (typeof password !== 'string' || !password) return 'Password is required';
  if (password.length < 12) return 'Password must be at least 12 characters long';
  if (password.length > 128) return 'Password must be at most 128 characters long';
  return null;
};
export const validateContactForm = (values = {}) => {
  const errors = {};
  if (typeof values.name !== 'string' || values.name.trim().length < 2 || values.name.length > 100) errors.name = 'Enter a name of 2–100 characters';
  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;
  if (typeof values.message !== 'string' || values.message.trim().length < 5 || values.message.length > 5000) errors.message = 'Enter a message of 5–5,000 characters';
  if (values.phone && (typeof values.phone !== 'string' || values.phone.length > 30 || !/^[+\d\s().-]+$/.test(values.phone))) errors.phone = 'Please enter a valid phone number';
  return { isValid: Object.keys(errors).length === 0, errors };
};
export const formatCurrency = (amount, currency = 'INR') => {
  const num = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(num);
};
