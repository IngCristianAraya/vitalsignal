// Importar los módulos necesarios
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool, testConnection } = require('./config/db');  // Asegúrate de que esta línea esté al principio

// Crear la aplicación Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ extended: false }));

// Probar conexión a la base de datos
testConnection();

// Definir rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vitals', require('./routes/vitals'));
app.use('/api/doctor', require('./routes/doctor'));

// Ruta para verificar estado del servidor
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Ruta de prueba principal
app.get('/', (req, res) => res.send('API de monitoreo de signos vitales funcionando'));

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Puerto y arranque del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));

// Ruta para recibir datos directamente del Arduino (sin autenticación)
app.post('/api/arduino/data', async (req, res) => {
  try {
    const { idUsuario, pulso, spo2, temperatura, anomalia } = req.body;
    
    if (!idUsuario || !pulso || !spo2 || !temperatura) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan datos requeridos' 
      });
    }
    
    const conn = await pool.getConnection();
    
    const [result] = await conn.query(
      'INSERT INTO historial (idUsuario, pulso, spo2, temperatura, anomalia) VALUES (?, ?, ?, ?, ?)',
      [idUsuario, pulso, spo2, temperatura, anomalia || 'normal']
    );
    
    conn.release();
    
    res.json({ 
      success: true, 
      id: result.insertId,
      message: 'Datos guardados correctamente'
    });
  } catch (err) {
    console.error('Error guardando datos de Arduino:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error al guardar datos' 
    });
  }
});

// Ruta para simular datos del sensor (solo para pruebas)
app.get('/api/simulation/start', (req, res) => {
  // Intervalo para generar datos simulados cada 5 segundos
  const simulationInterval = setInterval(async () => {
    try {
      const idUsuario = 1; // ID del usuario de prueba
      const pulso = Math.floor(Math.random() * 40) + 60; // Entre 60 y 100
      const spo2 = Math.floor(Math.random() * 10) + 90; // Entre 90 y 100
      const temperatura = (Math.random() * 2 + 36).toFixed(1); // Entre 36 y 38
      let anomalia = 'normal';
      
      if (pulso < 60) anomalia = 'bradicardia';
      if (pulso > 100) anomalia = 'taquicardia';
      
      // Aquí está el problema - necesitamos obtener una conexión del pool correctamente
      const conn = await pool.getConnection();
      await conn.query(
        'INSERT INTO historial (idUsuario, pulso, spo2, temperatura, anomalia) VALUES (?, ?, ?, ?, ?)',
        [idUsuario, pulso, spo2, temperatura, anomalia]
      );
      conn.release();
      
      console.log(`Datos simulados guardados: Pulso=${pulso}, SpO2=${spo2}, Temp=${temperatura}, Anomalía=${anomalia}`);
    } catch (error) {
      console.error('Error guardando datos simulados:', error);
    }
  }, 5000);
  
  // Almacenar el intervalo en app.locals para poder detenerlo después
  app.locals.simulationInterval = simulationInterval;
  
  res.json({ success: true, message: 'Simulación iniciada. Se generarán datos aleatorios cada 5 segundos.' });
});

// Ruta para detener la simulación
app.get('/api/simulation/stop', (req, res) => {
  if (app.locals.simulationInterval) {
    clearInterval(app.locals.simulationInterval);
    app.locals.simulationInterval = null;
    res.json({ success: true, message: 'Simulación detenida.' });
  } else {
    res.json({ success: false, message: 'No hay simulación en curso.' });
  }
});
