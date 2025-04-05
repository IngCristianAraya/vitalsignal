const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
require('dotenv').config();

// Función para generar un JWT
const generateToken = (user) => {
  return jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.login = async (req, res) => {
  try {
    const { nombreUsuario, clave, tipoUsuario } = req.body;

    // Validaciones básicas
    if (!nombreUsuario || !clave || !tipoUsuario) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requieren todos los campos' 
      });
    }

    // Verificar si el tipo de usuario es válido
    if (!['Doctor', 'Observador'].includes(tipoUsuario)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de usuario no válido'
      });
    }

    // Consultar la base de datos
    const [users] = await pool.query(
      'SELECT * FROM usuarios WHERE nombreUsuario = ? AND clave = ? AND tipoUsuario = ?',
      [nombreUsuario, clave, tipoUsuario]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    const user = users[0];
    
    // Generar token
    const token = generateToken({
      id: user.idUsuario,
      nombre: user.nombre,
      tipoUsuario: user.tipoUsuario
    });

    // Respuesta exitosa
    res.json({
      success: true,
      user: {
        idUsuario: user.idUsuario,
        nombre: user.nombre,
        tipoUsuario: user.tipoUsuario,
        token
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

exports.loginWithDevice = async (req, res) => {
  try {
    const { nombreUsuario, clave, codigoDispositivo } = req.body;

    // Validaciones básicas
    if (!nombreUsuario || !clave || !codigoDispositivo) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren todos los campos'
      });
    }

    // Verificar usuario
    const [users] = await pool.query(
      'SELECT * FROM usuarios WHERE nombreUsuario = ? AND clave = ? AND tipoUsuario = "Paciente"',
      [nombreUsuario, clave]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    const user = users[0];

    // Verificar que el dispositivo esté asociado al usuario
    const [devices] = await pool.query(
      'SELECT * FROM dispositivos WHERE idDispositivo = ? AND idUsuario = ?',
      [codigoDispositivo, user.idUsuario]
    );

    if (devices.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'El dispositivo no está asociado a este usuario'
      });
    }

    // Generar token
    const token = generateToken({
      id: user.idUsuario,
      nombre: user.nombre,
      tipoUsuario: user.tipoUsuario,
      dispositivo: codigoDispositivo
    });

    // Respuesta exitosa
    res.json({
      success: true,
      user: {
        idUsuario: user.idUsuario,
        nombre: user.nombre,
        tipoUsuario: user.tipoUsuario,
        dispositivo: codigoDispositivo,
        token
      }
    });
  } catch (error) {
    console.error('Error en loginWithDevice:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT idUsuario, nombre, tipoUsuario FROM usuarios WHERE idUsuario = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Error en getUserInfo:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};