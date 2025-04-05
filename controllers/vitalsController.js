const { pool } = require('../config/db');

exports.sendVitals = async (req, res) => {
  try {
    const { pulso, spo2, temperatura, anomalia } = req.body;
    const idUsuario = req.user.id;

    // Validaciones básicas
    if (pulso === undefined || spo2 === undefined || temperatura === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren todos los campos de signos vitales'
      });
    }

    // Insertar en la base de datos
    const [result] = await pool.query(
      'INSERT INTO historial (idUsuario, pulso, spo2, temperatura, anomalia) VALUES (?, ?, ?, ?, ?)',
      [idUsuario, pulso, spo2, temperatura, anomalia || 'normal']
    );

    res.json({
      success: true,
      id: result.insertId,
      message: 'Signos vitales guardados exitosamente'
    });
  } catch (error) {
    console.error('Error en sendVitals:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar los signos vitales'
    });
  }
};

exports.getLatestVitals = async (req, res) => {
  try {
    const idUsuario = req.params.patientId || req.user.id;
    
    // Si es doctor solicitando datos de un paciente, verificar relación
    if (req.params.patientId && req.user.tipoUsuario === 'Doctor') {
      const [relations] = await pool.query(
        'SELECT * FROM relaciones WHERE idUsuarioPaciente = ? AND idUsuarioDoctor = ?',
        [req.params.patientId, req.user.id]
      );
      
      if (relations.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a los datos de este paciente'
        });
      }
    }

    // Obtener último registro
    const [vitals] = await pool.query(
      'SELECT * FROM historial WHERE idUsuario = ? ORDER BY horaFecha DESC LIMIT 1',
      [idUsuario]
    );

    if (vitals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay datos disponibles'
      });
    }

    res.json({
      success: true,
      data: vitals[0]
    });
  } catch (error) {
    console.error('Error en getLatestVitals:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los signos vitales'
    });
  }
};

exports.getVitalsHistory = async (req, res) => {
  try {
    const idUsuario = req.params.patientId || req.user.id;
    const limit = parseInt(req.query.limit) || 100;
    
    // Si es doctor solicitando datos de un paciente, verificar relación
    if (req.params.patientId && req.user.tipoUsuario === 'Doctor') {
      const [relations] = await pool.query(
        'SELECT * FROM relaciones WHERE idUsuarioPaciente = ? AND idUsuarioDoctor = ?',
        [req.params.patientId, req.user.id]
      );
      
      if (relations.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a los datos de este paciente'
        });
      }
    }

    // Obtener historial
    const [vitals] = await pool.query(
      'SELECT * FROM historial WHERE idUsuario = ? ORDER BY horaFecha DESC LIMIT ?',
      [idUsuario, limit]
    );

    res.json({
      success: true,
      data: vitals
    });
  } catch (error) {
    console.error('Error en getVitalsHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de signos vitales'
    });
  }
};