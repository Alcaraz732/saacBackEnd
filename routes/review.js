/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 26-10-2021

Creacion de fichero de rutas de la aplicacion, se anyaden las rutas para obtener, crear, modificar
y eliminar una provincia.

*/

const { Router } = require('express');
const { createReview, getReviews, getAllReviews, updateReview, deleteReview, getReviewsbyCommerce } = require('../controllers/review');
const { check } = require('express-validator');
const { validarCampos } = require('../middleware/validar-campos');
const { validateJWT } = require('../middleware/validate_jwt');

const router = Router();

router.get('/', [
    validateJWT,
    // Campos opcionales, si vienen los validamos
    check('id', 'El id de la review debe ser válido').optional().isMongoId(),
    check('desde', 'El desde debe ser un número').optional().isNumeric(),
    validarCampos
], getReviews);

router.get('/all', [
    //validateJWT,
    // Campos opcionales, si vienen los validamos
    //check('id', 'El id de la review debe ser válido').optional().isMongoId(),
    //check('desde', 'El desde debe ser un número').optional().isNumeric()
], getAllReviews);

router.get('/bycommerce', [
    //validateJWT,
    // Campos opcionales, si vienen los validamos
    //check('id', 'El id de la review debe ser válido').optional().isMongoId(),
    //check('desde', 'El desde debe ser un número').optional().isNumeric()
], getReviewsbyCommerce);


router.post('/', [
    validateJWT,
    check('comment', 'El argumento Comentario es obligatorio').not().isEmpty().trim(),
    check('review', 'El argumento review debe ser un valor numerico entre 1 o 5').isNumeric(),
    validarCampos
], createReview);

router.put('/:id', [
    validateJWT,
    check('comment', 'El argumento Comentario es obligatorio').not().isEmpty().trim(),
    check('review', 'El argumento review debe ser numerico').isNumeric(),
    validarCampos
], updateReview);

router.delete('/:id', [
        validateJWT,
        check('id', 'El identificador no es válido').isMongoId(),
        validarCampos
    ],
    deleteReview);

module.exports = router;