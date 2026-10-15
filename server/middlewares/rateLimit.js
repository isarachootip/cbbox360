/**
 * rateLimit.js — simple in-memory fixed-window limiter per client IP.
 * Note: per-process only; use a shared store (e.g. Redis) if running multiple instances.
 */
export const createRateLimiter = ({ windowMs, max, now = () => Date.now() }) => {
  const hits = new Map();

  return (req, res, next) => {
    const key = req.ip ?? 'unknown';
    const t = now();
    const entry = hits.get(key);
    if (!entry || t - entry.start > windowMs) {
      hits.set(key, { start: t, count: 1 });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.start + windowMs - t) / 1000));
      return res.status(429).json({ success: false, error: 'TOO_MANY_REQUESTS' });
    }
    return next();
  };
};
