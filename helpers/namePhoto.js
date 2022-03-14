//const Event = require('../models/event');

/*const fs = require('fs');
const { infoToken } = require('../helpers/infotoken');*/

const namePhoto = async(number, objecto, tipo) => {
    
    let namefoto = '';

    if(tipo == 'fotoevento'){
        for(let i = 0; i < objecto.pictures.length; i++){
            if (i == number){
                namefoto = objecto.pictures[i];
                break;
            }
        }
    }

    else if(tipo == 'fotoreview'){
        for(let i = 0; i < objecto.pictures.length; i++){
            if (i == number){
                namefoto = objecto.pictures[i];
                break;
            }
        }
    }

    else if(tipo == 'fotoplace'){
        for(let i = 0; i < objecto.pictures.length; i++){
            if (i == number){
                namefoto = objecto.pictures[i];
                break;
            }
        }
    }

    else if(tipo == 'fototravel'){
        for(let i = 0; i < objecto.pictures.length; i++){
            if (i == number){
                namefoto = objecto.pictures[i];
                break;
            }
        }
    }

    else if(tipo == 'fototown'){
        for(let i = 0; i < objecto.pictures.length; i++){
            if (i == number){
                namefoto = objecto.pictures[i];
                break;
            }
        }
    }

    else{
        namefoto = 'default_picture.jpg';
    }

    return namefoto;

}

module.exports = { namePhoto }