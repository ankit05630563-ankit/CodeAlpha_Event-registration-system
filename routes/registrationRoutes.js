const express = require('express');
const {
  createRegistration,
  getMyRegistrations,
  getRegistrationById,
  cancelRegistration,
} = require('../controllers/registrationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All registration routes require a logged-in user
router.use(protect);

router.post('/', createRegistration);
router.get('/my', getMyRegistrations);
router.get('/:id', getRegistrationById);
router.delete('/:id', cancelRegistration);

module.exports = router;
