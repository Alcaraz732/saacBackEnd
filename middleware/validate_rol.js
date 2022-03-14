const { response } = require('express');
const allowed_roles = ['ROL_USER', 'ROL_COMMERCE', 'ROL_ADMIN'];

const validate_rol = (req, res = response, next) => {

    const rol = req.body.rol;

    if (rol && !allowed_roles.includes(rol)) {
        return res.status(400).json({
            ok: false,
            msg: 'Invalid rol, allowed: ROL_USER, ROL_COMMERCE, ROL_ADMIN'
        });
    }
    
    next();
}

module.exports = { validate_rol }