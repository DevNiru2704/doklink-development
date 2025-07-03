// validation.ts - Utility functions for form validation
export const validateUsername = (username: string): string | null => {
  if (!username.trim()) return "Username is required";
  if (!/^[a-z]/.test(username)) return "Username must start with a lowercase letter";
  if (!/^[a-z0-9]+$/.test(username)) return "Username can only contain lowercase letters and digits";
  return null;
};

export const validateAadhaar = (aadhaar: string): string | null => {
  if (!aadhaar.trim()) return "Aadhaar number is required";
  if (!/^[2-9]/.test(aadhaar)) return "Aadhaar must not start with 0 or 1";
  if (!/^[2-9][0-9]{11}$/.test(aadhaar)) return "Aadhaar must be exactly 12 digits";
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email.trim()) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters long";
  if (!/[a-z]/.test(password)) return "Password must have at least one lowercase letter";
  if (!/[A-Z]/.test(password)) return "Password must have at least one uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must have at least one digit";
  if (!/[@$!%*#?&]/.test(password)) return "Password must have at least one special character";
  return null;
};

export const validatePhoneNumber = (phone: string): string | null => {
  if (!phone.trim()) return "Phone number is required";
  if (!/^[6-9][0-9]{9}$/.test(phone)) return "Please enter a valid phone number";
  return null;
};

export const validatePinCode = (pin: string): string | null => {
  if (!pin.trim()) return "PIN code is required";
  if (!/^[1-9][0-9]{5}$/.test(pin)) return "PIN code must be exactly 6 digits";
  return null;
};

export const validateDOB = (dob: string): string | null => {
  if (!dob.trim()) return "Date of birth is required";
  
  const today = new Date();
  const birthDate = new Date(dob.split('/').reverse().join('-')); // Convert DD/MM/YYYY to YYYY-MM-DD
  
  if (birthDate >= today) return "Please give a valid date of birth";
  
  const age = today.getFullYear() - birthDate.getFullYear() - 
    ((today.getMonth() < birthDate.getMonth() || 
     (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) ? 1 : 0);
  
  if (age > 120) return "Please give a valid date of birth";
  return null;
};
