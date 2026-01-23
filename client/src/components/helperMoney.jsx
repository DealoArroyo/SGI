export const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') {
    return '$ 0.00';
  }

  // 🔥 LIMPIAR FORMATO
  const cleanValue =
    typeof value === 'string'
      ? value.replace(/[$,\s]/g, '')
      : value;

  const number = Number(cleanValue);

  if (Number.isNaN(number)) {
    return '$ 0.00';
  }

  return number.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  });
};
