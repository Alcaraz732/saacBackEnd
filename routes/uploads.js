/*
Ruta base: /api/upload
*/

const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middleware/validar-campos');
const { subirArchivo, enviarArchivo, enviarArchivos, borrarArchivo } = require('../controllers/uploads');
const { validateJWT } = require('../middleware/validate_jwt');
const router = Router();

router.get('/:tipo/:filename', [
    //  validateJWT,
    check('filename', 'El nombrearchivo debe ser válido').trim(),
    validarCampos,
], enviarArchivo);

router.get('/multifiles/:tipo/:id', [
    //validateJWT,
    check('tipo', 'El tipo de archivo es obligatorio').trim(),
    check('id', 'El identificador no es válido').isMongoId(),
    //check('filename', 'El nombrearchivo debe ser válido').trim(),
    validarCampos,
], enviarArchivos);


router.post('/:tipo/:id', [
    validateJWT,
    check('id', 'El identificador no es válido').isMongoId(),
    validarCampos,
], subirArchivo);

router.delete('/deletefile/:tipo/:id', [
    validateJWT,
    check('id', 'El identificador no es válido').isMongoId(),
    validarCampos,
], borrarArchivo);

module.exports = router;