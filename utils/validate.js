export const validateEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateEmpty = (...fields) => {
  return fields.every(f => f.trim() !== "");
};
