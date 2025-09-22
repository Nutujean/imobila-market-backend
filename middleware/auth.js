import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Lipsă token de autorizare" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token lipsă" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token invalid" });
  }
}
