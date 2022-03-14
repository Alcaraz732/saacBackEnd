const { response } = require('express');

const check_password = async(req, res = response, next) => {

    const {password, repassword, ...object} = req.body;

    try{

        //comprobamos que la password contenga menos de 8 y mas de 15 caracteres
        if(password.length < 8 || password.length > 15){
            return res.status(400).json({
                ok: false,
                msg: 'The password must have between 8 and 15 characters'
            });
        }
        
        //comprobamos que la password contenga al menos un numero
        var contain_number = false;
        var separator = password.split('');
       
       /*
            ^(?=\w\d)(?=\w[A-Z])(?=\w*[a-z])\S{8,16}$
            La contraseña debe tener al entre 8 y 16 caracteres, al menos un dígito, al menos una minúscula y al menos una mayúscula.
        */
        for(let i = 0; i<separator.length && !contain_number; i++){
            if(separator[i].charCodeAt(0) >= 48 && separator[i].charCodeAt(0) <= 57){
                contain_number = true;
            }
        }

        if(!contain_number){
            return res.status(400).json({
                ok: false,
                msg: 'The password must have a number as minimum'
            });
        }

        //Comprobamos que la password tenga un caracter en mayuscula
        var contain_mayus = false;

        for(let i = 0; i<separator.length && !contain_mayus; i++){
            if(separator[i].charCodeAt(0) >= 65 && separator[i].charCodeAt(0) <= 90){
                contain_mayus = true;
            }
        }

        if(!contain_mayus){
            return res.status(400).json({
                ok: false,
                msg: 'The password must have a capital letter as minimum'
            });
        }

        //Comprobamos que la password tenga un caracter en minuscula
        var contain_minus = false;
        for(let i = 0; i<separator.length && !contain_minus; i++){
            if(separator[i].charCodeAt(0) >= 97 && separator[i].charCodeAt(0) <= 122){
                contain_minus = true;
            }
        }

        if(!contain_minus){
            return res.status(400).json({
                ok: false,
                msg: 'The password must have a lowercase letter as minimum'
            });
        }
        
        //comprobamos que la contraseña contiene uno de los siguientes caracteres
        var characters_ascii = '!¡¿?_->%&·"@#][.';
        separator = characters_ascii.split('');
        var special_character = false
        for(let i = 0; i < separator.length && !special_character; i++){
            if(password.includes(separator[i])) special_character = true;
        }

        if(!special_character){
            return res.status(400).json({
                ok: false,
                msg: 'The password must have one of these characters: ' + characters_ascii
            });
        }

        if(password != repassword){
            return res.status(400).json({
                ok: false,
                msg: 'Los campos contraseña y repetir contraseña tienen que ser iguales'
            });
        }

        next();
    }
    catch(error){
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'password is not valid'
        });
    }
}

module.exports = { check_password }