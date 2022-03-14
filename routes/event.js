const { Router } = require('express');
const { check } = require('express-validator');
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/event');
const { validarCampos } = require('../middleware/validar-campos');
const { validateJWT } = require('../middleware/validate_jwt');
const router = Router();

router.get('/', [
    check('id', 'El id del evento debe ser válido').optional().isMongoId(),
    check('text', 'La busqueda debe contener texto').optional().trim(),
    validarCampos
], getEvents);
router.post('/', [
    validateJWT,
    check('name', 'El argumento nombre es obligatorio').not().isEmpty(),
    check('pictures', 'El argumento fotos es obligatorio').not().isEmpty(),
    check('date', 'El argumento fecha es obligatorio').not().isEmpty(),
    check('date', 'La fecha no es válida').isDate(),
    check('description', 'El argumento descripción es obligatorio').not().isEmpty(),
    validarCampos
], createEvent);

router.put('/:id', [
    validateJWT,
    check('id', 'El identificador no es válido').isMongoId(),
    check('date', 'La fecha no es válida').isDate().optional(),
    validarCampos
], updateEvent);

router.delete('/:id', [
    validateJWT,
    check('id', 'El identificador no es válido').isMongoId(),
    validarCampos
], deleteEvent);


module.exports = router;