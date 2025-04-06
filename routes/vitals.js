// routes/vitals.js

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// Registrar nuevos signos vitales
router.post('/register', async (req, res) => {
  try {
    const { userId, patientId, heartRate, spo2, temperature, anomaly } = req.body;
    
    // Validar datos
    if (!patientId || !heartRate || !spo2 || !temperature) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos. Se requieren todos los signos vitales.'
      });
    }
    
    // Insertar en la base de datos
    const [result] = await pool.execute(
      'INSERT INTO historial (id_paciente, bpm, spo2, temperatura, estado) VALUES (?, ?, ?, ?, ?)',
      [patientId, heartRate, spo2, temperature, anomaly || 'normal']
    );
    
    // Responder
    res.status(201).json({
      success: true,
      message: 'Signos vitales registrados correctamente',
      data: {
        id: result.insertId,
        patientId,
        heartRate,
        spo2,
        temperature,
        anomaly
      }
    });
  } catch (error) {
    console.error('Error al registrar signos vitales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar signos vitales',
      error: error.message
    });
  }
});

// Obtener historial de signos vitales
router.get('/history/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM historial WHERE id_paciente = ? ORDER BY fecha DESC LIMIT 100',
      [patientId]
    );
    
    // Transformar resultados a formato estándar
    const formattedResults = rows.map(row => ({
      id: row.id,
      patientId: row.id_paciente,
      heartRate: row.bpm,
      spo2: row.spo2,
      temperature: row.temperatura,
      anomaly: row.estado,
      createdAt: row.fecha
    }));
    
    res.json({
      success: true,
      count: formattedResults.length,
      data: formattedResults
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
      error: error.message
    });
  }
});

module.exports = router;