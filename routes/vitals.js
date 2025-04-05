const express = require('express');
const router = express.Router();
const vitalsController = require('../controllers/vitalsController');
const auth = require('../middleware/auth');

// Enviar nuevos datos de signos vitales
router.post('/', auth, vitalsController.sendVitals);

// Obtener los últimos datos de signos vitales
router.get('/latest', auth, vitalsController.getLatestVitals);

// Obtener los últimos datos de un paciente específico (para doctores)
router.get('/latest/:patientId', auth, vitalsController.getLatestVitals);

// Obtener historial de signos vitales
router.get('/history', auth, vitalsController.getVitalsHistory);

// Obtener historial de un paciente específico (para doctores)
router.get('/history/:patientId', auth, vitalsController.getVitalsHistory);

module.exports = router;