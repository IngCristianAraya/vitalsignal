const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool, testConnection } = require('./config/db');

// Crear la aplicación Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ extended: false }));

// Puerto y arranque del servidor
const PORT = process.env.PORT || 8080;

// Iniciar la aplicación solo después de verificar la conexión a la base de datos
(async () => {
  try {
    // Intentar conectar a la base de datos
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('No se pudo establecer conexión con la base de datos. Verificando variables de entorno:');
      console.log({
        MYSQLHOST: process.env.MYSQLHOST,
        MYSQLUSER: process.env.MYSQLUSER,
        MYSQLDATABASE: process.env.MYSQLDATABASE,
        MYSQLPORT: process.env.MYSQLPORT,
        // No mostrar la contraseña por seguridad
      });
      // Continuar de todos modos, ya que la conexión podría establecerse más tarde
    }

    // Definir rutas
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/vitals', require('./routes/vitals'));
    app.use('/api/doctor', require('./routes/doctor'));

    // Ruta para verificar estado del servidor
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        time: new Date().toISOString(),
        dbConnected: isConnected
      });
    });

    // Ruta de prueba principal
    app.get('/', (req, res) => res.send('API de monitoreo de signos vitales funcionando'));

    // Iniciar el servidor
    app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));
    
  } catch (error) {
    console.error('Error al iniciar la aplicación:', error);
    process.exit(1);
  }
})();

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});