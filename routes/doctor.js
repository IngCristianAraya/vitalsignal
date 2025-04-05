const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const auth = require('../middleware/auth');

// Obtener todos los pacientes asignados a un doctor
router.get('/patients', auth, doctorController.getPatients);

// Obtener detalles de un paciente específico
router.get('/patients/:patientId', auth, doctorController.getPatientDetails);

module.exports = router;

