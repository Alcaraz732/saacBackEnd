const { response } = require('express');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { updateDB } = require('../helpers/updateDB');
const fs = require('fs');
const { namePhoto } = require('../helpers/namePhoto');
const Review = require('../models/review');
const Event = require('../models/event');
const Place = require('../models/place');
const Travel = require('../models/travel');
const Town = require('../models/town');

const subirArchivo = async(req, res = repsonse) => {

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
            ok: false,
            msg: 'No se ha enviado archivo',
        });
    }

    if (!req.files.file) {
        return res.status(400).json({
            ok: false,
            msg: `Debe enviarse el archivo como form-data llamado 'file'`,
        });
    }

    const id = req.params.id;
    const tipo = req.params.tipo;

    const files_valids = {
        fotoperfil: ['jpeg', 'jpg', 'png', 'PNG'],
        fotoevento: ['jpeg', 'jpg', 'png', 'PNG'],
        fotoreview: ['jpeg', 'jpg', 'png', 'PNG'],
        fotoplace:  ['jpeg', 'jpg', 'png', 'PNG'],
        fototravel: ['jpeg', 'jpg', 'png', 'PNG'],
        fototown: ['jpeg', 'jpg', 'png', 'PNG']
    }

    if(!Array.isArray(req.files.file)){

        if (req.files.file.truncated) {
            return res.status(400).json({
                ok: false,
                msg: `El archivo es demasiado grande, permitido hasta ${process.env.MAXSIZEUPLOAD}MB`
            });
        }

        const File = req.files.file;
        const nombrePartido = File.name.split('.');
        const extension = nombrePartido[nombrePartido.length - 1];

        switch (tipo) {
            case 'fotoperfil':
                if (!files_valids.fotoperfil.includes(extension)) {
                    return res.status(400).json({
                        ok: false,
                        msg: `El tipo de archivo '${extension}' no está permtido (${files_valids.fotoperfil})`
                    });
                }
                // Comprobar que solo el usuario cambia su foto de usuario
                break;
            case 'fotoevento':
                if (!files_valids.fotoevento.includes(extension)) {
                    return res.status(400).json({
                        ok: false,
                        msg: `El tipo de archivo '${extension}' no está permtido (${files_valids.fotoevento})`
                    });
                }
                break;

            case 'fotoreview':
                if (!files_valids.fotoreview.includes(extension)) {
                    return res.status(400).json({
                        ok: false,
                        msg: `El tipo de archivo '${extension}' no está permtido (${files_valids.fotoreview})`
                    });
                }
                break;
            
            case 'fotoplace':
                if (!files_valids.fotoplace.includes(extension)) {
                    return res.status(400).json({
                        ok: false,
                        msg: `El tipo de archivo '${extension}' no está permtido (${files_valids.fotoplace})`
                    });
                }
                break;

            case 'fototravel':
                if (!files_valids.fototravel.includes(extension)) {
                    return res.status(400).json({
                        ok: false,
                        msg: `El tipo de archivo '${extension}' no está permtido (${files_valids.fototravel})`
                    });
                }
                break;
            
            case 'fototown':
                if (!files_valids.fototown.includes(extension)) {
                    return res.status(400).json({
                        ok: false,
                        msg: `El tipo de archivo '${extension}' no está permtido (${files_valids.fototown})`
                    });
                }

                const town = Town.findById(id);

                if(!town){
                    return res.status(400).json({
                        ok: false,
                        msg: 'no existe esta ciudad'
                    });
                }

                break;

            default:
                return res.status(400).json({
                    ok: false,
                    msg: `El tipo de operacion no está permtida`,
                    tipoOperacion: tipo
                });
                break;
        }
        
        //console.log(File);
        //uploadPath = __dirname + '/somewhere/on/your/server/' + file.name;
        const path = `${process.env.PATH_UPLOAD}/${tipo}`;

        const fileName = `${uuidv4()}.${extension}`;

    /* const path = `${process.env.PATHUPLOAD}/${tipo}`;
        const nombreArchivo = `${uuidv4()}.${extension}`;*/
        const path_file = `${path}/${fileName}`;

        // Use the mv() method to place the file somewhere on your server
        File.mv(path_file, err =>{
            if (err){
                return res.status(400).json({
                    ok: false,
                    msg: `El archivo no se ha subido con éxito al servidor`
                });
            }
            
            const token = req.header('x-token');

            updateDB(tipo, path, fileName, id, token).then(valor => {
                if (!valor) {
                    fs.unlinkSync(path_file);
                    return res.status(400).json({
                        ok: false,
                        msg: `No se pudo subir la foto`,
                    });
                } else {
                    res.json({
                        ok: true,
                        msg: 'subirArchivo',
                        fileName
                    });
                }
                // controlar valor
            }).catch(error => {
                console.log(error);
                fs.unlinkSync(path_file);
                return res.status(400).json({
                    ok: false,
                    msg: `Error al cargar archivo`,
                });
            });
    
        });
    
    }
    else{

        var arr = new Array();

        for(let i = 0; i< req.files.file.length; i++){
    
            const File = req.files.file[i];
            
            const nombrePartido = File.name.split('.');
            const extension = nombrePartido[nombrePartido.length - 1];
    
            switch (tipo) {
                case 'fotoevento':
                    if (!files_valids.fotoevento.includes(extension)) {
                        return res.status(400).json({
                            ok: false,
                            msg: `Error al subir las imágenes, el tipo de archivo '${extension}' no está permtido (${files_valids.fotoevento})`
                        });
                    }

                    const event = await Event.findById(id);

                    if(!event){
                        return res.status(400).json({
                            ok: false,
                            msg: 'no existe este evento'
                        });
                    }
                    break;
                
                case 'fotoreview':
                    if (!files_valids.fotoreview.includes(extension)) {
                        return res.status(400).json({
                            ok: false,
                            msg: `Error al subir las imágenes, el tipo de archivo '${extension}' no está permtido (${files_valids.fotoreview})`
                        });
                    }

                    const review = await Review.findById(id);

                    if(!review){
                        return res.status(400).json({
                            ok: false,
                            msg: 'no existe esta valoración'
                        });
                    }

                    break;

                case 'fotoplace':
                    if (!files_valids.fotoplace.includes(extension)) {
                        return res.status(400).json({
                            ok: false,
                            msg: `Error al subir las imágenes, el tipo de archivo '${extension}' no está permtido (${files_valids.fotoplace})`
                        });
                    }

                    const place = await Place.findById(id);

                    if(!place){
                        return res.status(400).json({
                            ok: false,
                            msg: 'no existe este lugar'
                        });
                    }

                    break;
                
                case 'fototravel':
                    if (!files_valids.fototravel.includes(extension)) {
                        return res.status(400).json({
                            ok: false,
                            msg: `Error al subir las imágenes, el tipo de archivo '${extension}' no está permtido (${files_valids.fototravel})`
                        });
                    }

                    const travel = await Travel.findById(id);

                    if(!travel){
                        return res.status(400).json({
                            ok: false,
                            msg: 'no existe este viaje'
                        });
                    }

                    break;
                
                case 'fototown':
                    if (!files_valids.fototown.includes(extension)) {
                        return res.status(400).json({
                            ok: false,
                            msg: `Error al subir las imágenes, el tipo de archivo '${extension}' no está permtido (${files_valids.fototown})`
                        });
                    }

                    const town = await Town.findById(id);

                    if(!town){
                        return res.status(400).json({
                            ok: false,
                            msg: 'no existe esta ciudad'
                        });
                    }
                    
                    break;
                
                default:
                    return res.status(400).json({
                        ok: false,
                        msg: `El tipo de operacion no está permtida`,
                        tipoOperacion: tipo
                    });
                    break;
            }

            if (req.files.file[i].truncated) {
                return res.status(400).json({
                    ok: false,
                    msg: `El archivo es demasiado grande, permitido hasta ${process.env.MAXSIZEUPLOAD}MB`
                });
            }
        }

        for(let i = 0; i< req.files.file.length; i++){
    
            const File = req.files.file[i];
            
            const nombrePartido = File.name.split('.');
            const extension = nombrePartido[nombrePartido.length - 1];
            //console.log(File);
            //uploadPath = __dirname + '/somewhere/on/your/server/' + file.name;
            const path = `${process.env.PATH_UPLOAD}/${tipo}`;
    
            const fileName = `${uuidv4()}.${extension}`;
    
    
            const path_file = `${path}/${fileName}`;
    
            // Use the mv() method to place the file somewhere on your server
            File.mv(path_file, err =>{
                if (err){
                    return res.status(400).json({
                        ok: false,
                        msg: `El archivo no se ha subido con éxito al servidor`
                    });
                }

                const token = req.header('x-token');

            updateDB(tipo, path, fileName, id, token).then(valor => {
                if (!valor) {
                    if(fs.existsSync(path_file)) { fs.unlinkSync(path_file); }
                    return res.status(400).json({
                        ok: false,
                        msg: `No se pudo subir la foto`,
                    });
                }
                else{
                    arr.push(fileName);
                    if(i == req.files.file.length -1 ){
                        res.json({
                            ok: true,
                            msg: 'subirArchivo',
                            arr
                            //fileName
                        });
                    }
                }

                // controlar valor
            }).catch(error => {
                console.log(error);
                if(fs.existsSync(path_file)) {
                    fs.unlinkSync(path_file);
                }
                return res.status(400).json({
                    ok: false,
                    msg: `Error al cargar archivo`,
                });
            });
        
            });
        } 
    }   // controlar valor     
}


const enviarArchivo = async(req, res = response) => {

    const tipo = req.params.tipo; // fotoperfil   evidencia
    const nombreArchivo = req.params.filename;
    //console.log(req.params);
    const path = `${process.env.PATH_UPLOAD}/${tipo}`;
    let pathArchivo = `${path}/${nombreArchivo}`;
    //console.log(pathArchivo);
    //console.log(pathArchivo);
    if (!fs.existsSync(pathArchivo)) {
        if (tipo !== 'fotoperfil') {
            return res.status(400).json({
                ok: false,
                msg: 'Archivo no existe'
            });
        }
        pathArchivo = `${path}/default_picture.jpg`;
    }
    //console.log(pathArchivo);
    res.sendFile(pathArchivo);
}


const enviarArchivos = async(req, res = response) => {

    const tipo = req.params.tipo; // fotoperfil   evidencia
    //const nombreArchivo = req.params.filename;
    const id = req.params.id;
    //console.log(req.params);

    const numfoto = req.query.photo;

    //console.log(req.query);
    //console.log(req.params);
    
    if(!numfoto){
        return res.status(400).json({
            ok: false,
            msg: 'No hay foto'
        });
    }

    if(tipo != 'fotoevento' && tipo != 'fotoreview' && tipo != 'fotoplace'
    && tipo != 'fototravel' && tipo != 'fototown'){
        return res.status(400).json({
            ok: false,
            msg: 'Solo pueden haber eventos, valoraciones, lugares, viajes y ciudades'
        });
    }
    
    if(tipo == 'fotoevento'){
        const event = await Event.findById(id);
        
        if(!event){
            return res.status(400).json({
                ok: false,
                msg: 'No existe este evento'
            });
        }

        if(!Array.isArray(event.pictures)){
            return res.status(400).json({
                ok: false,
                msg: 'Esto debe ser un array'
            });
        }
        
        if(event.pictures.length == 0){
            return res.status(400).json({
                ok: false,
                msg: 'No hay imágenes en el array'
            });
        }

        if(numfoto <= 0 || numfoto > event.pictures.length){
            return res.status(400).json({
                ok: false,
                msg: 'No existe la foto'
            });
        }

        // como siempre le vamos a enviar la foto con un número superior le reducimos uno 
        // para que coincida con la posición del array
        let numfotobueno = numfoto - 1;

        //const path = `${process.env.PATH_UPLOAD}/${tipo}`;
        let nombrefoto = await namePhoto(numfotobueno, event, tipo);
        let long = event.pictures.length;

        return res.json({
            ok: true,
            msg: 'Está hecho',
            nombrefoto,
            long
        });  
    }

    else if(tipo === 'fotoreview'){
        const review = await Review.findById(id);
        
        if(!review){
            return res.status(400).json({
                ok: false,
                msg: 'No existe esta valoración'
            });
        }

        if(!Array.isArray(review.pictures)){
            return res.status(400).json({
                ok: false,
                msg: 'Esto debe ser un array'
            });
        }
        
        if(review.pictures.length == 0){
            return res.status(400).json({
                ok: false,
                msg: 'No hay imágenes en el array'
            });
        }

        if(numfoto <= 0 || numfoto > review.pictures.length){
            return res.status(400).json({
                ok: false,
                msg: 'No existe la foto'
            });
        }

        // como siempre le vamos a enviar la foto con un número superior le reducimos uno 
        // para que coincida con la posición del array
        let numfotobueno = numfoto - 1;

        //const path = `${process.env.PATH_UPLOAD}/${tipo}`;
        let nombrefoto = await namePhoto(numfotobueno, review, tipo);
        let long = review.pictures.length;

        return res.json({
            ok: true,
            msg: 'Está hecho',
            nombrefoto,
            long
        });
    }

    else if(tipo === 'fotoplace'){
        const place = await Place.findById(id);
        
        if(!place){
            return res.status(400).json({
                ok: false,
                msg: 'No existe este lugar'
            });
        }

        if(!Array.isArray(place.pictures)){
            return res.status(400).json({
                ok: false,
                msg: 'Esto debe ser un array'
            });
        }
        
        if(place.pictures.length == 0){
            return res.status(400).json({
                ok: false,
                msg: 'No hay imágenes en el array'
            });
        }

        if(numfoto <= 0 || numfoto > place.pictures.length){
            return res.status(400).json({
                ok: false,
                msg: 'No existe la foto'
            });
        }

        // como siempre le vamos a enviar la foto con un número superior le reducimos uno 
        // para que coincida con la posición del array
        let numfotobueno = numfoto - 1;

        //const path = `${process.env.PATH_UPLOAD}/${tipo}`;
        let nombrefoto = await namePhoto(numfotobueno, place, tipo);
        let long = place.pictures.length;

        return res.json({
            ok: true,
            msg: 'Está hecho',
            nombrefoto,
            long
        });
    }

    else if(tipo === 'fototravel'){
        const travel = await Travel.findById(id);
        
        if(!travel){
            return res.status(400).json({
                ok: false,
                msg: 'No existe este viaje'
            });
        }

        if(!Array.isArray(travel.pictures)){
            return res.status(400).json({
                ok: false,
                msg: 'Esto debe ser un array'
            });
        }
        
        if(travel.pictures.length == 0){
            return res.status(400).json({
                ok: false,
                msg: 'No hay imágenes en el array'
            });
        }

        if(numfoto <= 0 || numfoto > travel.pictures.length){
            return res.status(400).json({
                ok: false,
                msg: 'No existe la foto'
            });
        }

        // como siempre le vamos a enviar la foto con un número superior le reducimos uno 
        // para que coincida con la posición del array
        let numfotobueno = numfoto - 1;

        //const path = `${process.env.PATH_UPLOAD}/${tipo}`;
        let nombrefoto = await namePhoto(numfotobueno, travel, tipo);
        let long = travel.pictures.length;

        return res.json({
            ok: true,
            msg: 'Está hecho',
            nombrefoto,
            long
        });
    }
    
    else if(tipo === 'fototown'){
        const town = await Town.findById(id);
        
        if(!town){
            return res.status(400).json({
                ok: false,
                msg: 'No existe esta ciudad'
            });
        }

        if(!Array.isArray(town.pictures)){
            return res.status(400).json({
                ok: false,
                msg: 'Esto debe ser un array'
            });
        }
        
        if(town.pictures.length == 0){
            return res.status(400).json({
                ok: false,
                msg: 'No hay imágenes en el array'
            });
        }

        if(numfoto <= 0 || numfoto > town.pictures.length){
            return res.status(400).json({
                ok: false,
                msg: 'No existe la foto'
            });
        }

        // como siempre le vamos a enviar la foto con un número superior le reducimos uno 
        // para que coincida con la posición del array
        let numfotobueno = numfoto - 1;

        //const path = `${process.env.PATH_UPLOAD}/${tipo}`;
        let nombrefoto = await namePhoto(numfotobueno, town, tipo);
        let long = town.pictures.length;

        return res.json({
            ok: true,
            msg: 'Está hecho',
            nombrefoto,
            long
        });
    }
}

const borrarArchivo = async(req, res = response) => {

    const tipo = req.params.tipo; // fotoperfil   evidencia
    const uid = req.params.id;
    const numfoto = req.query.photo;
    //console.log(req.params);

    if(!numfoto){
        return res.status(400).json({
            ok: false,
            msg: 'No hay foto'
        });
    }

    if(tipo != 'fotoevento' && tipo != 'fotoreview' && tipo != 'fotoplace'
    && tipo != 'fototravel' && tipo != 'fototown'){
        return res.status(400).json({
            ok: false,
            msg: 'Solo pueden haber fotos de eventos, valoraciones, lugares, viajes y ciudades'
        });
    }

    let objeto = '';

    if(tipo === 'fotoevento'){
        const event = await Event.findById(uid);
        
        if(!event){
            return res.status(400).json({
                ok: false,
                msg: 'No existe este evento'
            });
        }
        objeto = event;
        
    }

    else if(tipo === 'fotoreview'){
        const review = await Review.findById(uid);

        if(!review){
            return res.status(400).json({
                ok: false,
                msg: 'No existe esta valoración'
            });
        }
        objeto = review;
    }

    else if(tipo === 'fotoplace'){
        const place = await Place.findById(uid);

        if(!place){
            return res.status(400).json({
                ok: false,
                msg: 'No existe este lugar'
            });
        }
        objeto = place;
    }

    else if(tipo === 'fototravel'){
        const travel = await Travel.findById(uid);

        if(!travel){
            return res.status(400).json({
                ok: false,
                msg: 'No existe este lugar'
            });
        }
        objeto = travel;
    }

    else if(tipo === 'fototown'){
        const town = await Town.findById(uid);

        if(!town){
            return res.status(400).json({
                ok: false,
                msg: 'No existe esta ciudad'
            });
        }
        objeto = town;
    }

    if(objeto === ''){
        return res.status(400).json({
            ok: false,
            msg: 'Esto no ha funcionado correctamente'
        });
    }

    if(!Array.isArray(objeto.pictures)){
        return res.status(400).json({
            ok: false,
            msg: 'Esto debe ser un array'
        });
    }
    
    if(objeto.pictures.length == 0){
        return res.status(400).json({
            ok: false,
            msg: 'No hay imágenes en el array'
        });
    }

    if(numfoto <= 0 || numfoto > objeto.pictures.length){
        return res.status(400).json({
            ok: false,
            msg: 'No existe la foto'
        });
    }

    // como siempre le vamos a enviar la foto con un número superior le reducimos uno 
    // para que coincida con la posición del array
    let numfotobueno = numfoto - 1;

    //const path = `${process.env.PATH_UPLOAD}/${tipo}`;
    let nombrefoto = await namePhoto(numfotobueno, objeto, tipo);
    //let long = event.pictures.length;
    if(nombrefoto === 'default_picture.jpg'){
        return res.status(400).json({
            ok: false,
            msg: 'Se ha producido un error con la foto'
        });
    }
    const path = `${process.env.PATH_UPLOAD}/${tipo}`;             
    const path_file = `${path}/${nombrefoto}`;
    
    if (fs.existsSync(path_file)) {
        await objeto.pictures.splice(numfotobueno, 1);
        await objeto.save();
        fs.unlinkSync(path_file);
    }

    return res.json({
        ok: true,
        msg: 'El fichero se ha borrado correctamente',
        nombrefoto,
        //long
    });

    

}

module.exports = { subirArchivo, enviarArchivo, enviarArchivos, borrarArchivo }