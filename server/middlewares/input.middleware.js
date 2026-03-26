const sanitizeObject = (value, { trimStrings }) => {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeObject(entry, { trimStrings }));
  }

  if (value && typeof value === "object") {
    const output = {};
    for (const [key, entry] of Object.entries(value)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        continue;
      }
      output[key] = sanitizeObject(entry, { trimStrings });
    }
    return output;
  }

  if (trimStrings && typeof value === "string") {
    return value.trim();
  }

  return value;
};

export const sanitizeInputMiddleware = (req, _res, next) => {
  if (req.body) req.body = sanitizeObject(req.body, { trimStrings: false });
  // En Express 5, req.query puede ser de solo lectura; no reasignarlo evita crashes.
  // Sanitizamos solo body para no romper el ciclo de request.
  next();
};
