/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 18-10-2021

En este fichero se valida el token de seguridad.
*/


const jwt = require('jsonwebtoken');

const validateJWT = (req, res, next) => {

    const token = req.header('x-token') || req.query.token || req.params.token;
    
    if (!token) {
        return res.status(400).json({
            ok: false,
            msg: 'Authorization token missing'
        });
    }

    try {
        const { uid, rol, ...object } = jwt.verify(token, process.env.JWTSECRET);

        req.uidToken = uid;
        req.rolToken = rol;

        next();
    } catch (err) {
        return res.status(400).json({
            ok: false,
            msg: 'Token not valid'
        })
    }
}

module.exports = { validateJWT }