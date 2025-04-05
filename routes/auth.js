const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Ruta para iniciar sesión (doctor y observador)
router.post('/login', authController.login);

// Ruta para iniciar sesión con dispositivo (paciente)
router.post('/login-with-device', authController.loginWithDevice);

// Ruta para obtener información del usuario autenticado
router.get('/me', auth, authController.getUserInfo);

module.exports = router;