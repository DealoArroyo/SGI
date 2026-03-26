const setCorsVary = (res) => {
  const current = res.getHeader("Vary");
  if (!current) {
    res.setHeader("Vary", "Origin");
    return;
  }
  const value = Array.isArray(current) ? current.join(", ") : String(current);
  if (!value.includes("Origin")) {
    res.setHeader("Vary", `${value}, Origin`);
  }
};

export const securityHeadersMiddleware = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' http://localhost:3000; frame-ancestors 'none'; base-uri 'self';"
  );
  setCorsVary(res);
  next();
};

const createInMemoryLimiter = ({ windowMs, maxRequests }) => {
  const store = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();

    const entry = store.get(ip) || { count: 0, expiresAt: now + windowMs };

    if (entry.expiresAt <= now) {
      entry.count = 0;
      entry.expiresAt = now + windowMs;
    }

    entry.count += 1;
    store.set(ip, entry);

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.expiresAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "Demasiadas solicitudes. Intenta más tarde.",
      });
    }

    next();
  };
};

export const loginRateLimit = createInMemoryLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 20,
});

export const authRateLimit = createInMemoryLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
});
