/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 25-10-2021

Creacion de fichero de rutas de la aplicacion, se anyaden las rutas para obtener, crear, modificar
y eliminar un viaje.

*/

const { Router } = require('express');
const { createTravel, getTravels, updateTravel, deleteTravel, getAllTravels } = require('../controllers/travel');
const { check } = require('express-validator');
const { validarCampos } = require('../middleware/validar-campos');
const { validateJWT } = require('../middleware/validate_jwt');
const router = Router();


router.get('/', [
    validateJWT,
    // Campos opcionales, si vienen los validamos
    check('id', 'El id de viaje debe ser válido').optional().isMongoId(),
    check('desde', 'El desde debe ser un número').optional().isNumeric(),
    validarCampos
], getTravels);
router.get('/all', [
    //validateJWT,


], getAllTravels);

router.post('/', [
    validateJWT,
    check('id', 'El argumento id no es válido').optional().isMongoId(),
    check('name', 'El argumento nombre no es válido').not().isEmpty().trim(),
    check('photo', 'El argumento foto no es válido').optional(),
    check('description', 'El argumento descripcion no es válido').optional(),
    validarCampos,
], createTravel);

router.put('/:id', [
    validateJWT,
    check('id', 'El identificador no es válido').isMongoId(),
    check('name', 'El argumento nombre no es válido').optional(),
    check('photo', 'El argumento foto no es válido').optional(),
    check('description', 'El argumento descripcion no es válido').optional(),
    validarCampos
], updateTravel);

router.delete('/:id', [
    validateJWT,
    check('id', 'El identificador no es válido').isMongoId(),
    validarCampos,
], deleteTravel);

module.exports = router;