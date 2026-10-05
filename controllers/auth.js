const authService = require('../services/auth.js');
const { registerSchema, loginSchema } = require('../validators/auth.js');

const register = async (req, res) => {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.issues.map(i => i.message).join(", ") });
  }
  // ➔ Cukup panggil dapur service untuk mendaftarkan data bersih
  const newUser = await authService.registerUser(validation.data);
  res.status(201).json({ message: "Registrasi sukses!", data: newUser });
};

const login = async (req, res) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.issues.map(i => i.message).join(", ") });
  }

  // ➔ Cukup panggil dapur service untuk memvalidasi masuk & cetak token JWT
  const result = await authService.loginUser(validation.data);
  res.status(200).json(result); // Balas hasil ke Postman membawa Token JWT asli!
};

module.exports = { register, login };