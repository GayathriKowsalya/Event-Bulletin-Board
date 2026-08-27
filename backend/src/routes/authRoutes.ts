import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.ADMIN_JWT_SECRET || 'fallback_secret_key';

  if (!validUsername || !validPassword) {
    return res.status(500).json({ error: 'Admin credentials not configured on the server' });
  }

  if (username === validUsername && password === validPassword) {
    // Generate custom JWT
    const token = jwt.sign(
      {
        id: 'demo-admin-id',
        role: 'admin',
        username: validUsername,
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      message: 'Admin login successful',
      user: {
        role: 'admin'
      },
      token
    });
  }

  // Invalid credentials
  return res.status(401).json({ error: 'Invalid admin credentials.' });
});

export default router;
