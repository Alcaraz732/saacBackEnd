/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 18-10-2021

Creacion del fichero donde se encuentran los controladores de usuario.
Altas: metodo de obtener usuario y metodo de crear usuario.
Modificacion: comprobar en el getUsers que un administrador o uno mismo puede verse su perfil
*/

const { response } = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/user');
const Place = require('../models/place');
const Review = require('../models/review');
const Travel = require('../models/travel');
const { infoToken } = require('../helpers/infotoken');
const { generarJWT } = require('../helpers/jwt');
const { sendEmail, sendEmailAdmin } = require('../helpers/message_normal_user');
const { deleteREVW } = require('../helpers/delete_info_revw');
const { deleteTRV } = require('../helpers/delete_info_travel');
const fs = require('fs');
const Town = require('../models/town');

const getUsers = async(req, res) => {

    const since = Number(req.query.since) || 0;
    const registerpp = Number(process.env.DOCSPERPAGE);
    let text_search = '';
    const text = req.query.texto || '';
    if (text !== '') {
        text_search = new RegExp(text, 'i');
    }

    const id = req.query.id || '';
    //const email = req.query.email || '';
    const rol = req.query.role || '';
    let query = {};

    try {

        const token = req.header('x-token');

        if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }

        let users, total, allusers;
        

        if (id) {
            [users, total] = await Promise.all([
                User.findById(id).populate('favorites').populate('reviews').populate('travels'),
                User.countDocuments(total)
            ]);
        } /*else if (email) {
            [users, total] = await Promise.all([
                User.find({ email: email }).populate('favorites').populate('reviews').populate('travels'),
                User.countDocuments()
            ]);
        }*/ else {
            
            if (text !== '') {
                if(rol !== ''){
                    query = {rol:rol, $or: [{ name: text_search }, { email: text_search }] };
                }
                else{
                    query = {$or: [{ name: text_search }, { email: text_search }] };
                }
            }
            else{
                if(rol !== ''){
                    query = { rol:rol };
                } 
            }

            [users, total] = await Promise.all([
                User.find(query).skip(since).limit(registerpp).populate('favorites').populate('reviews').populate('travels').collation({ locale: 'es' }).sort({ name: 1 }),
                User.countDocuments(query)
            ]);
        }

            [allusers] = await Promise.all([
                User.find(query).sort({ registerDate: -1 })
            ]);


        res.json({
            ok: true,
            message: 'Here are all the users',
            users,
            allusers,
            page: {
                since,
                registerpp,
                total
            }
        });
    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error obteniendo los usuarios'
        });
    }

}

const checkPassword = async(req, res) => {

    const { password, repassword, ...object } = req.body;

    try {
        //comprobamos que la password contenga menos de 8 y mas de 15 caracteres
        if (password.length < 8 || password.length > 15) {
            return res.status(400).json({
                ok: false,
                msg: 'La contraseña debe tener entre 8 y 15 caracteres'
            });
        }

        //comprobamos que la password contenga al menos un numero
        var contain_number = false;
        var separator = password.split('');

        /*
             ^(?=\w\d)(?=\w[A-Z])(?=\w*[a-z])\S{8,16}$
             La contraseña debe tener al entre 8 y 16 caracteres, al menos un dígito, al menos una minúscula y al menos una mayúscula.
         */
        for (let i = 0; i < separator.length && !contain_number; i++) {
            if (separator[i].charCodeAt(0) >= 48 && separator[i].charCodeAt(0) <= 57) {
                contain_number = true;
            }
        }

        if (!contain_number) {
            return res.status(400).json({
                ok: false,
                msg: 'La contraseña tiene que tener un número como mínimo'
            });
        }

        //Comprobamos que la password tenga un caracter en mayuscula
        var contain_mayus = false;

        for (let i = 0; i < separator.length && !contain_mayus; i++) {
            if (separator[i].charCodeAt(0) >= 65 && separator[i].charCodeAt(0) <= 90) {
                contain_mayus = true;
            }
        }

        if (!contain_mayus) {
            return res.status(400).json({
                ok: false,
                msg: 'la contraseña debe contener una letra mayúscula como mínimo'
            });
        }

        //Comprobamos que la password tenga un caracter en minuscula
        var contain_minus = false;
        for (let i = 0; i < separator.length && !contain_minus; i++) {
            if (separator[i].charCodeAt(0) >= 97 && separator[i].charCodeAt(0) <= 122) {
                contain_minus = true;
            }
        }

        if (!contain_minus) {
            return res.status(400).json({
                ok: false,
                msg: 'La contraseña debe tener una letra minúscula como mínimo'
            });
        }

        //comprobamos que la contraseña contiene uno de los siguientes caracteres
        var characters_ascii = '!¡¿?_->%&·"@#][.';
        separator = characters_ascii.split('');
        var special_character = false
        for (let i = 0; i < separator.length && !special_character; i++) {
            if (password.includes(separator[i])) special_character = true;
        }

        if (!special_character) {
            return res.status(400).json({
                ok: false,
                msg: 'La contraseña debe contener como mínimo uno de los siguientes carácteres: ' + characters_ascii
            });
        }

        if (password != repassword) {
            return res.status(400).json({
                ok: false,
                msg: 'Los campos contraseña y repetir contraseña tienen que ser iguales'
            });
        }

        return res.json({
            ok: true,
            msg: 'La contraseña es válida'
        });


    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'La contraseña no es válida'
        });
    }
}


const createUser = async(req, res = response) => {

    const { email, password, name, repassword, accept } = req.body;

    try {

        // Comrprobar que no existe un usuario con ese email registrado
        const exists_email = await User.findOne({ email: email });

        if (exists_email) {
            return res.status(400).json({
                ok: false,
                msg: 'Este email no es válido, por favor, use otro'
            });
        }

        if (!accept) {
            return res.status(400).json({
                ok: false,
                msg: 'Debes aceptar los términos y condiciones del sistema para acceder al servicio'
            });
        }

        // Cifrar la contraseña, obtenemos el salt y ciframos
        const salt = bcrypt.genSaltSync();
        const cpassword = bcrypt.hashSync(password, salt);
        //Creamos nuevo usuario
        const user = new User(req.body);
        user.activation_code = uuidv4();
        user.password = cpassword;
        // Almacenar en BD
        //const token = await generarJWT(user._id, user.rol);

        await sendEmail(user.email, user.name, user.activation_code, user._id);

        await user.save();
        
        res.json({
            ok: true,
            msg: 'The user: ' + name + ' has been created',
            usuario: user
            //token
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error creando el usuario'
        });
    }
}


const createCommerce = async(req, res = response) => {

    const { email, password, name, repassword, cif, accept } = req.body;

    try {

        // Comrprobar que no existe un usuario con ese email registrado
        const exists_email = await User.findOne({ email: email });

        if (exists_email) {
            return res.status(400).json({
                ok: false,
                msg: 'Este email no es válido, por favor, use otro'
            });
        }

        if (!accept) {
            return res.status(400).json({
                ok: false,
                msg: 'Debes aceptar los términos y condiciones del sistema para acceder al servicio'
            });
        }

        if(!cif){
            return res.status(400).json({
                ok: false,
                msg: 'Debes añadir un CIF para poder loguearte como empresario'
            });
        }

        if(cif.length != 9){
            return res.status(400).json({
                ok: false,
                msg: 'Un CIF válido contiene unicamente 9 caracteres'
            });
        }

        let cif_array = cif.split('');
        if( (cif_array[0].charCodeAt(0) <= 64 || cif_array[0].charCodeAt(0) >= 87) ){
            return res.status(400).json({
                ok: false,
                msg: 'El primer carácter de un CIF debe ser una letra mayúscula que no sea: I, K, L, M, Ñ, T, X, Y, Z'
            });
        }

        if(cif_array[0] == 'I' || cif_array[0] == 'K' || cif_array[0] == 'L' || cif_array[0] == 'M' ||
        cif_array[0] == 'Ñ' || cif_array[0] == 'T' || cif_array[0] == 'X' || cif_array[0] == 'Y' || cif_array[0] == 'Z' ){
            return res.status(400).json({
                ok: false,
                msg: 'El primer carácter de un CIF debe ser una letra mayúscula que no sea: I, K, L, M, Ñ, T, X, Y, Z'
            });
        }

        for(let i = 0; i < cif_array.length; i++){
            if (i >= 1 && i<= 7){
                if(cif_array[i].charCodeAt(0) < 48 || cif_array[i].charCodeAt(0) > 57 ){
                    return res.status(400).json({
                        ok: false,
                        msg: 'Los 7 dígitos centrales del CIF deben de ser números'
                    });
                }
            }
        }
        // Cifrar la contraseña, obtenemos el salt y ciframos
        const salt = bcrypt.genSaltSync();
        const cpassword = bcrypt.hashSync(password, salt);
        //Creamos nuevo usuario
        const user = new User(req.body);
        user.activation_code = uuidv4();
        user.password = cpassword;
        user.CIF = cif;
        // Almacenar en BD
        //const token = await generarJWT(user._id, user.rol);

        await sendEmail(user.email, user.name, user.activation_code, user._id);
        user.rol = 'ROL_COMMERCE';

        await user.save();

        res.json({
            ok: true,
            msg: 'The commerciant: ' + name + ' has been created',
            usuario: user
            //token
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error creando comerciante'
        });
    }
}

const verifyUser = async(req, res) => {

    const id = req.query.id;
    const token = req.query.code;

    try {
        //console.log(localStorage(x-token));
        // Obtener el token
        if (!id) {
            return res.status(400).json({
                ok: false,
                msg: 'Ha habido un error de verificación de usuario'
            });
            //return res.redirect('');
        }

        if (!token) {
            return res.status(400).json({
                ok: false,
                msg: 'El token de usuario es erróneo'
            });

        }
        // Verificar existencia del usuario
        const user = await User.findById(id);

        if (!user) {
            return res.status(400).json({
                ok: false,
                msg: 'No se ha podido verificar el usuario'
            });
        }

        if (user.active) {
            return res.status(400).json({
                ok: false,
                msg: 'Ya has activado tu cuenta de usuario previamente'
            });
        }
        // Actualizar usuario
        user.active = true;

        //const tok = await generarJWT(user._id, user.rol);

        await user.save();

        res.json({
            ok: true,
            msg: 'The user ' + user.name + ' is already active in the database',
            usuario: user,
            //tok
        });
        // Redireccionar a la confirmación
        //return res.redirect('/');

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error al verificar el usuario'
        });
    }
}

const verifyLinkAdmin = async(req, res) => {

    const id = req.query.id;
    const code = req.query.code;
    const token = req.params.token;

    try {
        // Obtener el token
        if (!id) {
            return res.status(400).json({
                ok: false,
                msg: 'Ha habido un error de verificación de usuario'
            });
            //return res.redirect('');
        }

        if (!code) {
            return res.status(400).json({
                ok: false,
                msg: 'El código de activación de usuario es erróneo'
            });

        }

        if(!token){
            return res.status(400).json({
                ok: false,
                msg: 'El token es incorrecto'
            });
        }
        // Verificar existencia del usuario
        const user = await User.findById(id);

        if (!user) {
            return res.status(400).json({
                ok: false,
                msg: 'No se ha podido verificar el usuario'
            });
        }

        if (user._id != id) {
            return res.status(400).json({
                ok: false,
                msg: 'Usuario erróneo'
            });
        }

        if(user.activation_code != code){
            return res.status(400).json({
                ok: false,
                msg: 'Código de activación erroneo'
            });
        }

        if (user.active) {
            return res.status(400).json({
                ok: false,
                msg: 'Ya has activado tu cuenta de usuario previamente'
            });
        }
        // Redireccionar a la confirmación
        //return res.redirect('/');
        res.json({
            ok: true,
            msg: 'El enlace es correcto'
            //tok
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'El link no es válido'
        });
    }
}

const updatePWDadmin = async(req, res) => {

    const id = req.query.id;
    const code = req.query.code;
    const token = req.params.token;
    console.log(req.query);
    const { password, repassword} = req.body;

    try {
        // Obtener el token
        if (!id) {
            return res.status(400).json({
                ok: false,
                msg: 'Ha habido un error de verificación de usuario'
            });
            //return res.redirect('');
        }

        if (!code) {
            return res.status(400).json({
                ok: false,
                msg: 'El código de activación de usuario es erróneo'
            });

        }

        if(!token){
            return res.status(400).json({
                ok: false,
                msg: 'El token es incorrecto'
            });
        }
        // Verificar existencia del usuario
        const user = await User.findById(id);

        if (!user) {
            return res.status(400).json({
                ok: false,
                msg: 'No se ha podido verificar el usuario'
            });
        }

        if (user._id != id) {
            return res.status(400).json({
                ok: false,
                msg: 'Usuario erróneo'
            });
        }

        if(user.activation_code != code){
            return res.status(400).json({
                ok: false,
                msg: 'Código de activación erroneo'
            });
        }

        if (user.active) {
            return res.status(400).json({
                ok: false,
                msg: 'Ya has activado tu cuenta de usuario previamente'
            });
        }
        // Actualizar usuario

        const salt = bcrypt.genSaltSync();
        const cpassword = bcrypt.hashSync(password, salt);
        //Creamos nuevo usuario
        user.password = cpassword;
        user.active = true;

        //const tok = await generarJWT(user._id, user.rol);

        await user.save();

        res.json({
            ok: true,
            msg: 'Enhorabuena has activado la cuenta y ya puedes administrar la web',
            user
            //tok
        }); 

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error al verificar el usuario'
        });
    }
}

const createAdmin = async(req, res = response) => {

    const { email, rol } = req.body;

    try {

        const token = req.header('x-token');
        if (!((infoToken(token).rol === 'ROL_ADMIN'))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }

        if (rol != 'ROL_ADMIN') {
            return res.status(400).json({
                ok: false,
                msg: 'No puedes crear un usuario que no sea un administrador',
            });
        }

        // Comrprobar que no existe un usuario con ese email registrado
        const exists_email = await User.findOne({ email: email });

        if (exists_email) {
            return res.status(400).json({
                ok: false,
                msg: 'Este email no es válido, por favor, use otro'
            });
        }
        //Creamos nuevo usuario
        const user = new User(req.body);
        
        const tok = await generarJWT(user._id, user.rol);
        user.activation_code = uuidv4();
        user.name = 'Administrador';

        console.log(user);

        await sendEmailAdmin(user.email, user.name, tok, user.activation_code,  user._id);
        // Almacenar en BD
        await user.save();
        res.json({
            ok: true,
            msg: 'The Admin: ' + email + ' has been created',
            usuario: user,
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error creando administrador'
        });
    }
}

const updateUser = async(req, res = response) => {

    // Asegurarnos de que aunque venga el password no se va a actualizar, la modificaciñon del password es otra llamada
    // Comprobar que si cambia el email no existe ya en BD, si no existe puede cambiarlo
    const { email, active, ...object } = req.body;
    const uid = req.params.id;

    try {

        // Para actualizar usuario o eres admin o eres usuario del token y el uid que nos llega es el mismo
        const token = req.header('x-token');
        if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === uid))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }

        // Comprobar si está intentando cambiar el email, que no coincida con alguno que ya esté en BD
        // Obtenemos si hay un usuaruio en BD con el email que nos llega en post
        const exists_email = await User.findOne({ email: email });

        if (exists_email) {
            // Si existe un usuario con ese email
            // Comprobamos que sea el suyo, el UID ha de ser igual, si no el email est en uso
            if (exists_email._id != uid) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Este email no es válido, por favor, use otro'
                });
            }
        }

        // Comprobar si existe el usuario que queremos actualizar
        const exists_user = await User.findById(uid);

        if (!exists_user) {
            return res.status(400).json({
                ok: false,
                msg: 'El usuario que estás intentando modificar no existe'
            });
        }

        // llegadoa aquí el email o es el mismo o no está en BD, es obligatorio que siempre llegue un email
        object.email = email;

        if(object.picture == ""){
            object.picture = exists_user.picture;
        }

        // Si existe el cif que lo modifique
        if("ciff" in object){
            //COMPROBAR QUE EL CIF SEA CORRECTO
            if(object["ciff"].length != 9){
                return res.status(400).json({
                    ok: false,
                    msg: 'Un CIF válido contiene unicamente 9 caracteres'
                });
            }
    
            let cif_array = object["ciff"].split('');
            if( (cif_array[0].charCodeAt(0) <= 65 || cif_array[0].charCodeAt(0) >= 87) ){
                return res.status(400).json({
                    ok: false,
                    msg: 'El primer carácter de un CIF debe ser una letra mayúscula que no sea: I, K, L, M, Ñ, T, X, Y, Z'
                });
            }
    
            if(cif_array[0] == 'I' || cif_array[0] == 'K' || cif_array[0] == 'L' || cif_array[0] == 'M' ||
            cif_array[0] == 'Ñ' || cif_array[0] == 'T' || cif_array[0] == 'X' || cif_array[0] == 'Y' || cif_array[0] == 'Z' ){
                return res.status(400).json({
                    ok: false,
                    msg: 'El primer carácter de un CIF debe ser una letra mayúscula que no sea: I, K, L, M, Ñ, T, X, Y, Z'
                });
            }
    
            for(let i = 0; i < cif_array.length; i++){
                if (i >= 1 && i<= 7){
                    if(cif_array[i].charCodeAt(0) < 48 || cif_array[i].charCodeAt(0) > 57 ){
                        return res.status(400).json({
                            ok: false,
                            msg: 'Los 7 dígitos centrales del CIF deben de ser números'
                        });
                    }
                }
            }

            object.CIF = object["ciff"];
        }

        // Si el rol es de administrador, entonces si en los datos venía el campo activo lo dejamos
        if ((infoToken(token).rol === 'ROL_ADMIN') && active !== undefined) {
            object.active = active;
        }
        // al haber extraido password del req.body nunca se va a enviar en este put
        const user = await User.findByIdAndUpdate(uid, object, { new: true });

        res.json({
            ok: true,
            msg: 'User updated',
            user: user
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error modificando usuario'
        });
    }

}

const updateTravelFavorites = async(req, res = response) => {

    // Asegurarnos de que aunque venga el password no se va a actualizar, la modificaciñon del password es otra llamada
    // Comprobar que si cambia el email no existe ya en BD, si no existe puede cambiarlo
    //const { ...object } = req.body;
    const uid = req.params.id;
    const uidPlace = req.params.idplace;
    const token = req.params.token;

    try {

        // Para actualizar usuario o eres admin o eres usuario del token y el uid que nos llega es el mismo
        //console.log(infoToken(token));
        
        if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === uid))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }
        
        // Comprobar si existe el usuario que queremos actualizar
        const user = await User.findById(uid);

        if (!user) {
            return res.status(400).json({
                ok: false,
                msg: 'El usuario no existe'
            });
        }

        const place = await Place.findById(uidPlace);

        if (!place) {
            return res.status(400).json({
                ok: false,
                msg: 'Este lugar no existe, no lo puedes añadir a tus favoritos'
            });
        }
        //user.favorites = [];
    
        if(user.favorites.length> 0){
            for(let i = 0; i< user.favorites.length; i++){
                if(user.favorites[i]._id == uidPlace){
                    return res.status(400).json({
                        ok: false,
                        msg: 'Este lugar ya forma parte de tus favoritos'
                    });
                }
            }
        }   

        await user.favorites.push(place._id);
        // al haber extraido password del req.body nunca se va a enviar en este put
        await user.save();
        //const user = await User.findByIdAndUpdate(uid, object, { new: true });

        res.json({
            ok: true,
            msg: 'Place added to user',
            user,
            place
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error modificando usuario'
        });
    }

}

const deleteTravelFavorites = async(req, res = response) => {

    // Asegurarnos de que aunque venga el password no se va a actualizar, la modificaciñon del password es otra llamada
    // Comprobar que si cambia el email no existe ya en BD, si no existe puede cambiarlo
    //const { ...object } = req.body;
    const uid = req.params.id;
    const uidPlace = req.params.idplace;
    const token = req.params.token;

    try {

        // Para actualizar usuario o eres admin o eres usuario del token y el uid que nos llega es el mismo
        //console.log(infoToken(token));
        
        if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === uid))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }
        
        // Comprobar si existe el usuario que queremos actualizar
        const user = await User.findById(uid);

        if (!user) {
            return res.status(400).json({
                ok: false,
                msg: 'Este usuario no existe en la base de datos'
            });
        }

        const place = await Place.findById(uidPlace);

        if (!place) {
            return res.status(400).json({
                ok: false,
                msg: 'Este lugar no existe en la base de datos'
            });
        }
        //user.favorites = [];
        let placeDentroDeArray = false;
        if(user.favorites.length> 0){
            for(let i = 0; i< user.favorites.length && !placeDentroDeArray; i++){
                if(user.favorites[i]._id == uidPlace){
                    placeDentroDeArray = true;
                }
            }
        }   

        if(!placeDentroDeArray){
            return res.status(400).json({
                ok: false,
                msg: 'Este lugar no forma parte de tu array de favoritos'
            });
        }

        await user.favorites.remove(place._id);
        // al haber extraido password del req.body nunca se va a enviar en este put
        await user.save();
        //const user = await User.findByIdAndUpdate(uid, object, { new: true });

        res.json({
            ok: true,
            msg: 'Place removed to user',
            user,
            place
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error modificando el usuario'
        });
    }

}

const updatePassword = async(req, res = response) => {
    const uid = req.params.id;
    const { email, old_password, password, repassword } = req.body;

    try {
        
        const token = req.header('x-token');
        const userBD = await User.findById(uid);
        
        // Solo puede actualizar la contraseña el usuario del token
        if (infoToken(token).uid !== uid) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }
        //Si el usuario no existe no se puede cambiar la contraseña
        if (!userBD) {
            return res.status(400).json({
                ok: false,
                msg: 'Usuario incorrecto',
            });
        }
        //comprobamos el email.
        //const userBD2 = await User.findById(infoToken(token).uid);
    
        if (userBD.email != email /*&& (!(infoToken(token).rol === 'ROL_ADMIN') && email !== userBD2.email)*/) {
            return res.status(400).json({
                ok: false,
                msg: 'Este email no es el tuyo',
            });
        }
        
        //if((infoToken(token).rol !== 'ROL_ADMIN')){
            const validPassword = bcrypt.compareSync(old_password, userBD.password);
            // Si es el el usuario del token el que trata de cambiar la contraseña, se comprueba que sabe la contraseña vieja y que ha puesto 
            // dos veces la contraseña nueva
            //if (infoToken(token).uid === uid) {
                //comprobamos que la contraseña actual sea cierta
                if (!validPassword) {
                    return res.status(400).json({
                        ok: false,
                        msg: 'Contraseña no válida',
                        token: ''
                    });
                }
            //}
        //}
        //Comprobamos que las dos contraseñas son iguales
        if (password !== repassword) {
            return res.status(400).json({
                ok: false,
                msg: 'La primera contraseña es diferente de la segunda',
            });
        }

        // tenemos todo OK, ciframos la nueva contraseña y la actualizamos
        const salt = bcrypt.genSaltSync();
        const cpassword = bcrypt.hashSync(password, salt);
        userBD.password = cpassword;

        // Almacenar en BD
        await userBD.save();

        res.json({
            ok: true,
            msg: 'Password updated'
        });

    } catch (error) {
        return res.status(400).json({
            ok: false,
            msg: 'Error modificando la contraseña',
        });
    }
}

//Eliminamos usuario de la base de datos
const deleteUser = async(req, res = response) => {
    const uid = req.params.id;
    try {

        // Para actualizar usuario o eres admin o eres usuario del token y el uid que nos llega es el mismo
        const token = req.header('x-token');
        if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }

        // Comprobamos si existe el usuario que queremos borrar
        const exists_users = await User.findById(uid);

        if (!exists_users) {
            return res.status(400).json({
                ok: true,
                msg: 'Este usuario es no existente'
            });
        }

        if(exists_users.rol === 'ROL_COMMERCE' || exists_users.rol === 'ROL_ADMIN'){
            //aqui eliminaremos los lugares
            let query_place = { user: exists_users };

            let places, total;
            [places, total] = await Promise.all([
                Place.find(query_place).collation({ locale: 'es' }),
                Place.countDocuments(query_place)
            ]);
            
            if(total > 0){
                for(let i = 0; i < places.length; i++){

                    let query_revws = { place: places[i]._id };

                    let revws, total_revws;
                    [revws, total_revws] = await Promise.all([
                        Review.find(query_revws).collation({ locale: 'es' }),
                        Review.countDocuments(query_revws)
                    ]);

                    if(total_revws > 0){
                        for (let i = 0; i < revws.length; i++) {
                            const rr = await deleteREVW(revws[i]._id);
                            if(rr !== 'OK'){
                                return res.status(400).json({
                                    ok: false,
                                    msg: 'Error eliminando la valoracion',
                                });
                            }
                            await Review.findByIdAndRemove(revws[i]._id);
                        }
                    }
                    
                    //Aqui vamos a eliminar los viajes de ese lugar
                    let query_travels = { places: places[i]._id };

                    let travels, totalTravs;
                    [travels, totalTravs] = await Promise.all([
                        Travel.find(query_travels).collation({ locale: 'es' }),
                        Travel.countDocuments(query_travels)
                    ]);

                    if(totalTravs > 0){
                        for (let i = 0; i < travels.length; i++) {
                            const rt = await deleteTRV(travels[i]._id);

                            if(rt !== 'OK'){
                                return res.status(400).json({
                                    ok: false,
                                    msg: 'Error eliminando la ruta',
                                });
                            }
                            await Travel.findByIdAndRemove(travels[i]._id);
                        }
                    }

                    const town = await Town.find({places: places[i]._id});
                    if(town.length === 1){
                        if(town[0].places.length > 0){
                            await town[0].places.remove(places[i]._id);
                            await town[0].save();
                        }
                    }
                }

                for(let i = 0; i < places.length; i++){
                    if (places[i].pictures.length > 0) {
                        const path = `${process.env.PATH_UPLOAD}/fotoplace`;
                        if(places[i].pictures.length > 0){
                            for (let j = 0; j < places[i].pictures.length; j++) {
                                    const path_file = `${path}/${places[i].pictures[j]}`;
                                    if (fs.existsSync(path_file)) {
                                        fs.unlinkSync(path_file);
                                    }
                            }
                        }
                    }
                    await Place.findByIdAndRemove(places[i]._id);
                }
            }

        }

        let query_revws = { user: exists_users };

        let revws, total_revws;
        [revws, total_revws] = await Promise.all([
            Review.find(query_revws).collation({ locale: 'es' }),
            Review.countDocuments(query_revws)
        ]);
        
        if (total_revws > 0) {
            for (let i = 0; i < revws.length; i++) {
                //await deleteREVW(revws[i]._id);
                const rr2 = await deleteREVW(revws[i]._id);

                if(rr2 !== 'OK'){
                    return res.status(400).json({
                        ok: false,
                        msg: 'Error eliminando la valoracion',
                    });
                }
                await Review.findByIdAndRemove(revws[i]._id);
            }
        }

        let query_travels = { user: exists_users };

        let travels, total_travs;
        [travels, total_travs] = await Promise.all([
            Travel.find(query_travels).collation({ locale: 'es' }),
            Travel.countDocuments(query_travels)
        ]);
        
        if (total_travs > 0) {
            for (let i = 0; i < travels.length; i++) {
                //await deleteTRV(travels[i]._id);
                const rt2 = await deleteTRV(travels[i]._id);
                if(rt2 !== 'OK'){
                    return res.status(400).json({
                        ok: false,
                        msg: 'Error borrando la ruta',
                    });
                }

                await Travel.findByIdAndRemove(travels[i]._id);
            }
        }
        
        
        // Lo eliminamos y devolvemos el usuaurio recien eliminado
        const result = await User.findByIdAndRemove(uid);

        res.json({
            ok: true,
            msg: 'User has been eliminated',
            result: result,
            revws,
            travels
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: true,
            msg: 'Error eliminando el usuario'
        });
    }
}

const createUserGoogle = async(req, res = response) => {

    const { email, name, googleLogin} = req.body;

    console.log("LEGGO:");
    console.log(email)
    console.log(name)
    console.log(googleLogin)

    try {

        // Comrprobar que no existe un usuario con ese email registrado
        const exists_email = await User.findOne({ email: email });

        if (exists_email) {
            return res.status(400).json({
                ok: false,
                msg: 'Este email no es válido, por favor, use otro'
            });
        }

        //Creamos nuevo usuario
        const user = new User(req.body);
        // Almacenar en BD
        const token = await generarJWT(user._id, user.rol);
        await user.save();

        res.json({
            ok: true,
            msg: 'The user: ' + name + ' has been created',
            usuario: user,
            token
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error creando el usuario'
        });
    }
}

module.exports = { createUserGoogle, getUsers, createUser, deleteUser, updateUser, updatePassword, createAdmin, checkPassword, verifyUser, updateTravelFavorites, deleteTravelFavorites, verifyLinkAdmin, updatePWDadmin, createCommerce }