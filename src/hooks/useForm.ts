import { useState, useCallback, ChangeEvent } from 'react';

interface ValidationRules {
  [key: string]: (value: any) => string | undefined;
}

export interface FormState {
  [key: string]: any;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

export function useForm<T extends FormState>(initialState: T, validationRules?: ValidationRules) {
  const [values, setValues] = useState<T>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle input changes
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    const inputValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value;
    
    setValues(prev => ({ ...prev, [name]: inputValue }));
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }));
    }
    
    // Validate field if rules exist
    if (validationRules && validationRules[name]) {
      const errorMessage = validationRules[name](inputValue);
      setErrors(prev => ({ ...prev, [name]: errorMessage }));
    }
  }, [touched, validationRules]);
  
  // Manually set a field value
  const setValue = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validate field if rules exist
    if (validationRules && validationRules[name]) {
      const errorMessage = validationRules[name](value);
      setErrors(prev => ({ ...prev, [name]: errorMessage }));
    }
  }, [validationRules]);
  
  // Reset form to initial state or new state
  const resetForm = useCallback((newState?: Partial<T>) => {
    setValues(prevValues => ({ ...initialState, ...(newState || {}) }));
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialState]);
  
  // Validate all fields
  const validateForm = useCallback(() => {
    if (!validationRules) return true;
    
    let isValid = true;
    const newErrors: FormErrors = {};
    
    // Check all fields with validation rules
    Object.keys(validationRules).forEach(field => {
      const errorMessage = validationRules[field](values[field]);
      newErrors[field] = errorMessage;
      
      if (errorMessage) {
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);
  
  // Handle form submission
  const handleSubmit = useCallback((callback: (values: T) => void | Promise<void>) => {
    return async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      
      setIsSubmitting(true);
      
      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {};
      Object.keys(values).forEach(key => {
        allTouched[key] = true;
      });
      setTouched(allTouched);
      
      const isValid = validateForm();
      
      if (isValid) {
        try {
          await callback(values);
        } catch (error) {
          console.error('Form submission error:', error);
        }
      }
      
      setIsSubmitting(false);
    };
  }, [values, validateForm]);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    setValue,
    handleSubmit,
    resetForm,
    validateForm
  };
} 