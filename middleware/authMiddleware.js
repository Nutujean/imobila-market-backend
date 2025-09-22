import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  console.log("👉 Header primit:", authHeader);

  if (!authHeader) {
    return res.status(401).json({ error: "Lipsă token" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Format token invalid" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("👉 Decoded token:", decoded); // ar trebui să conțină { id, iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ JWT error:", err.message);
    return res.status(401).json({ error: "Token invalid sau expirat" });
  }
}
