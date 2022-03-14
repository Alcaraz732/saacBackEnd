/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 18-10-2021

Creacion de fichero de rutas de la aplicacion, se anyaden las rutas para obtener, crear, modificar
y eliminar una provincia.

*/

const { Router } = require('express');
const { getProvinces, getAllProvinces, createProvince, updateProvince, deleteProvince } = require('../controllers/province');
const { check } = require('express-validator');
const { validarCampos } = require('../middleware/validar-campos');
const { validateJWT } = require('../middleware/validate_jwt');

const router = Router();

router.get('/', [
    validateJWT,
    // Campos opcionales, si vienen los validamos
    check('id', 'El id de provincia debe ser válido').optional().isMongoId(),
    check('desde', 'El desde debe ser un número').optional().isNumeric(),
    validarCampos
], getProvinces);
router.get('/all', [
    validateJWT,
    // Campos opcionales, si vienen los validamos
], getAllProvinces);

router.post('/', [
    validateJWT,
    check('name', 'El argumento nombre es obligatorio').not().isEmpty().trim(),
    validarCampos,

], createProvince);

router.put('/:id', [
    validateJWT,
    check('name', 'El argumento nombre es obligatorio').not().isEmpty().trim(),
    check('id', 'El identificador no es válido').isMongoId(),
    validarCampos
], updateProvince);

router.delete('/:id', [
        validateJWT,
        check('id', 'El identificador no es válido').isMongoId(),
        validarCampos,
    ],
    deleteProvince);

module.exports = router;