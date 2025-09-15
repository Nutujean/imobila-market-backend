import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// simulăm o "bază de date" în memorie (de test)
// în practică vei folosi PostgreSQL sau MongoDB
let users = [];

// REGISTER
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ email, password: hashedPassword });
  res.json({ message: "User registered successfully ✅" });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ message: "Invalid password" });
  }
  const token = jwt.sign({ email: user.email }, "secretKey", { expiresIn: "1h" });
  res.json({ message: "Login successful ✅", token });
});
