exports.jwtAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return exports.resp(res, 401, 'Missing Authorization Header');

  const token = header.split(' ')[1];
  if (!token) return exports.resp(res, 401, 'Malformed Authorization Header');

  try {
    req.token = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (err) {
    return exports.resp(res, 401, 'Invalid or Expired JWT');
  }
};