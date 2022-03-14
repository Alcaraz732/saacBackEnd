/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 25-10-2021

Creacion del fichero donde se encuentran los controladores de viajes.
Altas: metodo de obtener viaje y metodo de crear viaje.
*/

const Travel = require('../models/travel');
const { response } = require('express');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { infoToken } = require('../helpers/infotoken');
const { deleteTRV } = require('../helpers/delete_info_travel');
const User = require('../models/user');
const Place = require('../models/place');
const fs = require('fs');


const getTravels = async(req, res) => {

    const id = req.query.id;

    const desde = Number(req.query.desde) || 0;
    const registropp = Number(process.env.DOCSPERPAGE);

    //FALTARA PONER ALGO TIPO FILTRO, DAME UN VIAJE SEGUN PUEBLO O LUGAR
    /*
    let text_search = '';
    const text = req.query.text || '';
    if (text !== '') {
        text_search = new RegExp(text, 'i');
    }
    */
    let texto = '';
    const text = req.query.texto || '';
    const place = req.query.place || '';



    let query = {};


    try {

        const token = req.header('x-token');

        if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }

        let travels = '';

        if (id) {
            [travels, total] = await Promise.all([Travel.findById(id).populate('places').populate('user', '-v -password -activation_code'),
                Travel.countDocuments()
            ]);

        } else {


            if (text !== '') {
                texto = new RegExp(text, 'i');
                if (place !== '') {
                    //lugar y texto
                    query = { places: place, $or: [{ name: texto }] }
                } else {
                    //solo texto
                    query = { $or: [{ name: texto }] }
                }
            } else {
                if (place !== '') {
                    //solo lugar
                    query = { places: place }
                }
            }

            [travels, total] = await Promise.all([Travel.find(query).sort({ name: 1 }).skip(desde).limit(registropp).populate('places').populate('user', '-v -password -activation_code'),
                Travel.countDocuments(query)
            ]);
        }


        [alltravels] = await Promise.all([
            Travel.find(query).populate('places').populate('user', '-v -password -activation_code').collation({ locale: 'es' }).sort({ name: 1 })
        ]);

        res.json({
            ok: true,
            message: 'Here are all the travels',
            travels,
            alltravels,
            page: {
                desde,
                registropp,
                total
            }
        });
    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error obteniendo las rutas'
        });
    }
}
const getAllTravels = async(req, res) => {



    try {


        let travels = '';


        [travels, total] = await Promise.all([Travel.find({}).sort({ name: 1 }).populate('places').populate('user'),
            Travel.countDocuments()
        ]);


        res.json({
            ok: true,
            message: 'Here are all the travels',
            travels,
            page: {
                total
            }
        });
    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error obteniendo todas las rutas'
        });
    }
}

const createTravel = async(req, res = response) => {

    const { name, ...object } = req.body;

    try {
        const token = req.header('x-token');
        const user = await User.findById(infoToken(token).uid);
        // Comrprobar que no existe un viaje con ese nombre
        // PROBLEMA CON ESTO POR EL TEMA DEL NOMBRE AL VIAJE
        const exists_travel = await Travel.findOne({ name: name });

        if (exists_travel) {
            return res.status(400).json({
                ok: false,
                msg: 'Esta ruta ya existe en la aplicación web'
            });
        }

        if (object.description.length < 30) {
            return res.status(400).json({
                ok: false,
                msg: 'Debe haber una descripción y tiene que superar los 30 caracteres'
            });
        }

        if (object.places.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'Las rutas tienen que tener un lugar o más'
            });
        }
        
        for(let i = 0; i< object.places.length; i++){
            const place = await Place.findById(object.places[i]);
            if(!place){
                return res.status(400).json({
                    ok: false,
                    msg: 'Uno de los lugares no existe'
                }); 
            } 
        }
        //Creamos nuevo viaje
        const travel = new Travel(req.body);
        travel.user = user;
        //user.reviews = [];
        // Almacenar en BD
        //await travel.save();
        await user.travels.push(travel._id);
        await user.save();
        // Almacenar en BD
        travel.pictures = [];
        await travel.save();

        res.json({
            ok: true,
            msg: 'The travel: ' + name + ' has been created',
            travel,
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error creando la ruta'
        });
    }
}

const updateTravel = async(req, res = response) => {

    const { name, ...object } = req.body;
    const uid = req.params.id;

    try {
        // Para actualizar el viaje o eres admin o eres usuario del token y el uid que nos llega es el mismo
        const token = req.header('x-token');
        if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }

        // Comprobar si está intentando cambiar el nombre, que no coincida con alguno que ya esté en BD
        //MISMO PROBLEMA COMO ANTES, LA ID
        const exists_viaje = await Travel.findOne({ name: name });

        if (exists_viaje) {

            if (exists_viaje._id != uid) {
                return res.status(400).json({
                    ok: false,
                    msg: 'La ruta ya existe'
                });
            }
        }
        // Comprobar si existe la provincia que queremos actualizar
        const exists_tra = await Travel.findById(uid);

        if (!exists_tra) {
            return res.status(400).json({
                ok: false,
                msg: 'La ruta que desea modificar no existe'
            });
        }

        object.name = name;

        if (object.description.length < 30) {
            return res.status(400).json({
                ok: false,
                msg: 'Debe haber una descripción y tiene que superar los 30 caracteres'
            });
        }

        //puede q de fallo
        const travel = await Travel.findByIdAndUpdate(uid, object, { new: true });

        travel.places = [];
        await travel.save();

        if (object.places.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'Tiene que haber más de un lugar'
            });
        }

        for(let i = 0; i< object.places.length; i++){
            const place = await Place.findById(object.places[i]);
            if(!place){
                return res.status(400).json({
                    ok: false,
                    msg: 'Uno de los lugares no existe'
                }); 
            }
        }

        for (let i = 0; i < object.places.length; i++) {
            await travel.places.push(object.places[i]);
            await travel.save();
        }

        res.json({
            ok: true,
            msg: 'travel updated',
            travel
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error modificando las rutas'
        });
    }

}

const deleteTravel = async(req, res = response) => {

    const uid = req.params.id;

    try {
        const token = req.header('x-token');
        /*if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
            return res.status(400).json({
                ok: false,
                msg: 'You do not having permissions to delete travels',
            });
        }*/

        // Comprobamos si existe el pueblo que queremos borrar
        /*const exists_tra = await Travel.findById(uid);

        if (!exists_tra) {
            return res.status(400).json({
                ok: true,
                msg: 'The travel does not exists'
            });
        }
        //eliminamos sus imágenes
        if(exists_tra.pictures.length > 0){
            const path = `${process.env.PATH_UPLOAD}/fototravel`;
            for (let i = 0; i < exists_tra.pictures.length; i++){
                const path_file = `${path}/${exists_tra.pictures[i]}`;
                console.log(i, ' ', path_file);
                if(fs.existsSync(path_file)){
                    fs.unlinkSync(path_file);
                }
            }
        }

        //Vamos a eliminar de usuarios este viaje
        const user = await User.findById(exists_tra.user);
        
        if(user.travels.length > 0){
            for(let i = 0; i < user.travels.length; i++){
                if(user.travels[i]._id.toString() === exists_tra._id.toString()){
                    user.travels.remove(exists_tra._id);
                }
            }
        }   
        await user.save();*/

        const rr = await deleteTRV(uid);

        if (rr !== 'OK') {
            return res.status(400).json({
                ok: false,
                msg: rr,
            });
        }

        const result = await Travel.findByIdAndRemove(uid);

        res.json({
            ok: true,
            msg: 'Travel has been eliminated',
            result: result
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: true,
            msg: 'Error deleting travel'
        });
    }
}

module.exports = {
    getTravels,
    createTravel,
    updateTravel,
    deleteTravel,
    getAllTravels
}