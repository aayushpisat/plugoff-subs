import { useRef, useState } from 'react';
import { validateContactForm } from '../../../core/utils/validators.js';
import { ENDPOINTS } from '../../../core/api/endpoints.js';
import { apiClient, apiErrorMessage } from '../../../core/api/client.js';

export const useContactSubmit = () => {
  const pending = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const submitContactForm = async (formData) => {
    if (pending.current) return false;
    setErrors({});
    setSuccess(false);
    const validation = validateContactForm(formData);
    if (!validation.isValid) { setErrors(validation.errors); return false; }
    pending.current = true;
    setIsSubmitting(true);
    try {
      const { data } = await apiClient.post(ENDPOINTS.CONTACT.SUBMIT, {
        name: formData.name.trim(), email: formData.email.trim(),
        phone: formData.phone?.trim() || '', message: formData.message.trim(),
      });
      if (data?.success !== true) throw new Error('Unconfirmed submission');
      setSuccess(true);
      return true;
    } catch (error) {
      setErrors({ form: apiErrorMessage(error, 'Your message could not be sent. Please try again later.') });
      return false;
    } finally { pending.current = false; setIsSubmitting(false); }
  };
  return { isSubmitting, errors, success, submitContactForm, resetFormState: () => { setErrors({}); setSuccess(false); } };
};
