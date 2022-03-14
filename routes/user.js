/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 18-10-2021

Creacion de fichero de rutas de la aplicacion, se anyaden las rutas para obtener, crear, modificar
y eliminar un usuario.

*/

const { Router } = require('express');
const { getUsers, createUser, deleteUser, updateUser, updatePassword, createAdmin, checkPassword, verifyLinkAdmin, updatePWDadmin, updateTravelFavorites, deleteTravelFavorites, verifyUser, createUserGoogle, createCommerce } = require('../controllers/user');
const { check } = require('express-validator');
const { validarCampos } = require('../middleware/validar-campos');
const { validateJWT } = require('../middleware/validate_jwt');
const { check_password } = require('../middleware/check_password');
const { validate_rol } = require('../middleware/validate_rol');
const router = Router();

router.get('/', [
    validateJWT,
    // Campos opcionales, si vienen los validamos
    check('id', 'El id de usuario debe ser válido').optional().isMongoId(),
    check('since', 'El desde debe ser un número').optional().isNumeric(),
    check('text', 'La busqueda debe contener texto').optional().trim(),
    validarCampos
], getUsers);

router.get('/validate/verifyAdmin/:token', [
    validateJWT
], verifyLinkAdmin);

router.post('/getpwd', checkPassword);

router.post('/',[
    //validateJWT, //validar el token
    check('name', 'El argumento nombre es obligatorio').not().isEmpty().trim(),
    check('email', 'El argumento email debe ser un email').isEmail(),
    check('password', 'El argumento password es obligatorio').not().isEmpty(),
    validarCampos,
    validate_rol,
], createUser);

router.post('/google', createUserGoogle);

router.post('/admin',[
    validateJWT,
    check('email', 'El argumento email debe ser un email').isEmail(),
    check('active', 'El estado activo debe ser true/false').optional().isBoolean(),
    validarCampos,
    validate_rol,
], createAdmin);

router.post('/singupcommerce',[
    check('email', 'El argumento email debe ser un email').isEmail(),
    check('password', 'El argumento password es obligatorio').not().isEmpty(),
    check('cif', 'El argumento cif es obligatorio').not().isEmpty(),
    validarCampos,
    //check_password,
    validate_rol,
], createCommerce);

router.put('/:id', [
    validateJWT,
    check('name', 'El argumento nombre es obligatorio').not().isEmpty().trim(),
    check('email', 'El argumento email es obligatorio').not().isEmpty(),
    check('email', 'El argumento email debe ser un email').isEmail(),
    check('id', 'El identificador no es válido').isMongoId(),
    // campos que son opcionales que vengan pero que si vienen queremos validar el tipo
    check('active', 'El estado activo debe ser true/false').optional().isBoolean(),
    validarCampos
], updateUser);

router.put('/validate/validar_normal', verifyUser);

router.put('/validate/verifyAdmin/:token', [
    validateJWT,
    check('password', 'El argumento password es obligatorio').not().isEmpty().trim(),
    check('repassword', 'El argumento repetir password es obligatorio').not().isEmpty().trim(),
    validarCampos,
], updatePWDadmin);

router.put('/newpassword/:id', [
    validateJWT,
    check('id', 'El identificador no es válido').isMongoId(),
    check('email', 'El argumento email es obligatorio').not().isEmpty(),
    check('email', 'El argumento email debe ser un email').isEmail(),
    check('old_password', 'El argumento password es obligatorio').not().isEmpty().trim(),
    check('password', 'El argumento nuevopassword es obligatorio').not().isEmpty().trim(),
    check('repassword', 'El argumento nuevopassword2 es obligatorio').not().isEmpty().trim(),
    validarCampos
], updatePassword);

router.put('/updatefavouriteplaces/:id/:idplace/:token', [
    validateJWT,
    check('id', 'El identificador de usuario no es válido').isMongoId(),
    check('idplace', 'El identificador de lugar no es válido').isMongoId(),
    validarCampos
], updateTravelFavorites);

router.put('/deletefavouriteplaces/:id/:idplace/:token', [
    validateJWT,
    check('id', 'El identificador de usuario no es válido').isMongoId(),
    check('idplace', 'El identificador de lugar no es válido').isMongoId(),
    validarCampos
], deleteTravelFavorites);

router.delete('/:id', [
    validateJWT,
    check('id', 'El identificador no es válido').isMongoId(),
    validarCampos,
],
deleteUser);

module.exports = router;