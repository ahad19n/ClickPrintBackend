const jwt = require('jsonwebtoken');
const { resp } = require('./func');

const authMiddleware = (type) => (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return resp(res, 401, 'Missing Authorization Header');

  const [scheme, credentials] = header.split(' ');
  if (!scheme || !credentials) return resp(res, 401, 'Malformed Authorization Header');

  if (scheme.toLowerCase() === 'apikey') {
    if (credentials !== process.env.API_KEY) return resp(res, 401, 'Invalid API Key');
    return next();
  }

  if (scheme.toLowerCase() === 'bearer') {
    if (type === 'key') return resp(res, 401, 'API Key Authentication Required');

    try {
      req.user = jwt.verify(credentials, process.env.JWT_SECRET);
      return next();
    } catch (err) {
      return resp(res, 401, 'Invalid or Expired JWT');
    }
  }

  return resp(res, 401, 'Unsupported Authorization Scheme');
};

const jwtAuth = authMiddleware('any');
const keyAuth = authMiddleware('key');

module.exports = { jwtAuth, keyAuth };