/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 18-10-2021

Creacion de fichero de rutas de la aplicacion, se anyaden las rutas para obtener, crear, modificar
y eliminar una provincia.

*/

const { Router } = require('express');
const { createTown, getTowns, updateTown, deleteTown, getAllTowns, getTownsByVisits } = require('../controllers/town');
const { check } = require('express-validator');
const { validarCampos } = require('../middleware/validar-campos');
const { validateJWT } = require('../middleware/validate_jwt');

const router = Router();

router.get('/', [
    //validateJWT,
    // Campos opcionales, si vienen los validamos
    check('id', 'El id de pueblo debe ser válido').optional().isMongoId(),
    check('desde', 'El desde debe ser un número').optional().isNumeric(),
    validarCampos
], getTowns);

router.get('/all', [

    // Campos opcionales, si vienen los validamos
], getAllTowns);

router.get('/visits', [
    validateJWT,
    // Campos opcionales, si vienen los validamos
], getTownsByVisits);

router.post('/', [
    validateJWT,
    check('name', 'El argumento nombre es obligatorio').not().isEmpty().trim(),
    check('province', 'El argumento provincia debe ser un id valido').isMongoId(),
    check('location', 'El argumento localización es obligatorio').not().isEmpty().trim(),
    check('population', 'El argumento población es obligatorio y debe de ser un valor numérico').isNumeric(),
    validarCampos,

], createTown);

router.put('/:id', [
    validateJWT,
    check('name', 'El argumento nombre es obligatorio').not().isEmpty().trim(),
    check('province', 'El argumento provincia debe ser un id valido').isMongoId(),
    check('id', 'El identificador no es válido').isMongoId(),
    check('population', 'El argumento población es obligatorio y debe de ser un valor numérico').isNumeric(),
    validarCampos
], updateTown);

router.delete('/:id', [
        validateJWT,
        check('id', 'El identificador no es válido').isMongoId(),
        validarCampos,
    ],
    deleteTown);

module.exports = router;