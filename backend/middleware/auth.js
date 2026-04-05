import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1] || req.query.token;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // This decoded object should contain { id, role }
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Role Authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access Denied: ${req.user.role} role unauthorized.` });
    }
    next();
  };
};