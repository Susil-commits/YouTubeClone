export default function auth(req, res, next) {
  const userId = req.header("x-user-id");
  const isAdmin = req.header("x-admin") === "true";
  if (userId) {
    req.user = { id: userId, isAdmin };
  } else {
    req.user = null;
  }
  next();
}
