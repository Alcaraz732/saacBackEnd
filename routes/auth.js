/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 18-10-2021

Creacion de fichero de rutas auth.
*/

const { Router } = require('express');
const { login, token, loginGoogle, getUserRecovery, updateRecoPass } = require('../controllers/auth');
const { check } = require('express-validator');
const { validarCampos } = require('../middleware/validar-campos');

const router = Router();

router.get('/token', [
    check('x-token', 'El argumento x-token es obligatorio').not().isEmpty(),
    validarCampos,
], token);
router.get('/userReco/', [

    validarCampos
], getUserRecovery);
//recibir post password y email, validar campos no vacios y si es correcto pasar al controlador /controllers/auth.js
router.post('/', [
    check('password', 'El argumento pasword es obligatorio').not().isEmpty(),
    check('email', 'El argumento email es obligatorio').not().isEmpty(),
    validarCampos,
], login);

router.post('/google', [
    check('token', 'El argumento token es obligatorio').not().isEmpty(),
    validarCampos,
], loginGoogle);

router.put('/userRecoPass/:id', [
    check('password', 'El argumento pasword es obligatorio').not().isEmpty(),
    check('password2', 'El argumento pasword es obligatorio').not().isEmpty(),
], updateRecoPass);

module.exports = router;