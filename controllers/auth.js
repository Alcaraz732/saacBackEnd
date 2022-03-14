/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 18-10-2021

Creacion del fichero donde se encuentran los controladores de autenticacion.
Modificacion 18-10-2021 - 22:17 generar token y asociarselo a un usuario, para comprobaciones de mas tarde
*/

const { response } = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { generarJWT } = require('../helpers/jwt');
const { googleVerify } = require('../helpers/google-verify');
const { createUserGoogle } = require('../controllers/user');
const jwt = require('jsonwebtoken');

const token = async(req, res = response) => {

    const token = req.headers['x-token'];

    try {
        const { uid, rol, ...object } = jwt.verify(token, process.env.JWTSECRET);

        const userBD = await User.findById(uid);
        if (!userBD) {
            return res.status(400).json({
                ok: false,
                msg: 'Token no válido',
                token: ''
            });
        }
        const rolBD = userBD.rol;

        const new_token = await generarJWT(uid, rol);

        res.json({
            ok: true,
            msg: 'Token',
            uid: uid,
            name: userBD.name,
            email: userBD.email,
            rol: rolBD,
            networks: userBD.networks,
            registerDate: userBD.registerDate,
            active: userBD.active,
            picture: userBD.picture,
            activation_code: userBD.activation_code,
            reviews: userBD.reviews.review,
            CIF: userBD.CIF,
            token: new_token
        });
    } catch {
        return res.status(400).json({
            ok: false,
            msg: 'Token no válido',
            token: ''
        });
    }
}


const login = async(req, res = response) => {

    const { email, password } = req.body;

    try {

        const userBD = await User.findOne({ email });
        if (!userBD) {
            return res.status(400).json({
                ok: false,
                msg: 'Usuario o contraseña incorrecta',
                token: ''
            });
        }

        if(userBD.googleLogin){
            return res.status(400).json({
                ok: false,
                msg: 'Try google login',
                token: ''
            });
        }

        const validPassword = bcrypt.compareSync(password, userBD.password);
        if (!validPassword) {
            return res.status(400).json({
                ok: false,
                msg: 'Usuario o contraseña incorrecta',
                token: ''
            });
        }

        if(!userBD.active){
            return res.status(400).json({
                ok: false,
                msg: 'Tienes que verificar la cuenta de usuario para poder acceder al servicio',
                token: ''
            });
        }

        const { _id, rol, name, picture } = userBD;
        const token = await generarJWT(userBD._id, userBD.rol);

        res.json({
            ok: true,
            msg: 'login',
            uid: _id,
            name,
            rol,
            picture,
            token
        });
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error haciendo login',
            token: ''
        });
    }

}

const loginGoogle = async(req, res = response) => {

    const tokenGoogle = req.body.token;

    console.log(req.body);

    try {

        const { email, ...payload } = await googleVerify(tokenGoogle);
        console.log("GOOGLE");
        console.log(payload);
        console.log(email);

        const userBD = await User.findOne({ email });
        if (!userBD) {
            /*return res.status(400).json({
                ok: false,
                msg: 'Google Auth Incorrect',
                token: ''
            });*/
            //Registrar automaticamente el usuario
            console.log(payload);
            req.body.email = email;
            req.body.name = payload.name;
            req.body.googleLogin = true;
            createUserGoogle(req, res);
        }else{
            const { _id, rol, picture } = userBD;
            const token = await generarJWT(userBD._id, userBD.rol);

            res.json({
                ok: true,
                msg: 'login google',
                uid: _id,
                rol,
                picture,
                token
            });
        }

        
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error in login google',
            token: ''
        });
    }

}

const getUserRecovery = async(req, res) => {


    const email = req.query.email || '';
    try {


        let users, total;

        if (email) {
            [users, total] = await Promise.all([
                User.find({ email: email }),

            ]);
        }
        res.json({
            ok: true,
            message: 'Here are all the users',
            usuario: users

        });
    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error getting all the users'
        });
    }

}

const updateRecoPass = async(req, res = response) => {

    // Asegurarnos de que aunque venga el password no se va a actualizar, la modificaciñon del password es otra llamada
    // Comprobar que si cambia el email no existe ya en BD, si no existe puede cambiarlo
    const { password, password2, ...object } = req.body;
    const uid = req.params.id;

    try {
        const salt = bcrypt.genSaltSync();


        if (password == password2) {
            const cpassword = bcrypt.hashSync(password, salt);
            object.password = cpassword;
        }

        // Comprobar si existe el usuario que queremos actualizar
        const exists_user = await User.findById(uid);

        if (!exists_user) {
            return res.status(400).json({
                ok: false,
                msg: 'The user does not exist'
            });
        }


        const user = await User.findByIdAndUpdate(uid, object, { new: true });

        res.json({
            ok: true,
            msg: 'Password Update',
            user: user
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error updating user'
        });
    }

}

module.exports = { login, loginGoogle, token, getUserRecovery, updateRecoPass }