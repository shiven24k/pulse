import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  //Check headers first
  const token = req.headers.authorization?.split(" ")[1] || req.query.token;

  if (!token)
    return res.status(401).json({ error: "No token" });

 try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}