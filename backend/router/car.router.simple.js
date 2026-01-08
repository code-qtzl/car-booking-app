const express = require('express');
const router = express.Router();
const carController = require('../controller/car.controller');

// Simple routes without middleware first
router.get('/', carController.getAllCars);
router.get('/search', carController.searchCars);
router.get('/availability/:status', carController.getCarsByAvailability);
router.get('/:id', carController.getCarById);
router.post('/', carController.createCar);
router.put('/:id', carController.updateCar);
router.delete('/:id', carController.deleteCar);

module.exports = router;
