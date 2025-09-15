import rateLimit from 'express-rate-limit';
import config from '../config';

export const generalLimiter = rateLimit({
  windowMs: config.server.nodeEnv === 'development' ? 60 * 1000 : config.rateLimit.windowMs, // 1 minute in dev, 15 minutes in prod
  max: config.server.nodeEnv === 'development' ? 10000 : config.rateLimit.maxRequests, // Very high limit in development
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting entirely in development
    if (config.server.nodeEnv === 'development') {
      return true;
    }
    return false;
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.server.nodeEnv === 'development' ? 50 : 5, // More lenient in development
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting entirely in development
    if (config.server.nodeEnv === 'development') {
      return true;
    }
    return false;
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.server.nodeEnv === 'development' ? 100 : 10, // More lenient in development
  message: {
    error: 'Too many upload requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting entirely in development
    if (config.server.nodeEnv === 'development') {
      return true;
    }
    return false;
  },
});