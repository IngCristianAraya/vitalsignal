const { pool } = require('../config/db');

exports.getPatients = async (req, res) => {
  try {
    // Verificar si el usuario es doctor
    if (req.user.tipoUsuario !== 'Doctor') {
      return res.status(403).json({
        success: false,
        message: 'Acceso no autorizado. Solo los doctores pueden ver esta información.'
      });
    }

    // Obtener pacientes asignados al doctor
    const [patients] = await pool.query(
      `SELECT u.idUsuario, u.nombre, u.tipoUsuario 
       FROM usuarios u 
       JOIN relaciones r ON u.idUsuario = r.idUsuarioPaciente 
       WHERE r.idUsuarioDoctor = ? AND u.tipoUsuario = 'Paciente'`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error('Error en getPatients:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los pacientes'
    });
  }
};

exports.getPatientDetails = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verificar si el usuario es doctor
    if (req.user.tipoUsuario !== 'Doctor') {
      return res.status(403).json({
        success: false,
        message: 'Acceso no autorizado. Solo los doctores pueden ver esta información.'
      });
    }

    // Verificar relación doctor-paciente
    const [relation] = await pool.query(
      'SELECT * FROM relaciones WHERE idUsuarioPaciente = ? AND idUsuarioDoctor = ?',
      [patientId, req.user.id]
    );

    if (relation.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a los datos de este paciente'
      });
    }

    // Obtener detalles del paciente
    const [patient] = await pool.query(
      'SELECT idUsuario, nombre, tipoUsuario FROM usuarios WHERE idUsuario = ? AND tipoUsuario = "Paciente"',
      [patientId]
    );

    if (patient.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Obtener último registro de signos vitales
    const [lastVitals] = await pool.query(
      'SELECT * FROM historial WHERE idUsuario = ? ORDER BY horaFecha DESC LIMIT 1',
      [patientId]
    );

    res.json({
      success: true,
      data: {
        patient: patient[0],
        lastVitals: lastVitals.length > 0 ? lastVitals[0] : null
      }
    });
  } catch (error) {
    console.error('Error en getPatientDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los detalles del paciente'
    });
  }
};