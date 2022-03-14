/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 18-10-2021

Creacion del fichero donde se encuentran los controladores de Pueblo.

*/

const { response } = require('express');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const Town = require('../models/town');
const { infoToken } = require('../helpers/infotoken');
const fs = require('fs');
const Place = require('../models/place');
const Review = require('../models/review');
const Travel = require('../models/travel');
const Event = require('../models/event');
const User = require('../models/user');
const { deleteREVW } = require('../helpers/delete_info_revw');
const { deleteTRV } = require('../helpers/delete_info_travel');

const getAllTowns = async(req, res) => {

    try {


        let towns, total;

        [towns, total] = await Promise.all([Town.find({}).populate('province').sort({ province: 1 }),
            Town.countDocuments()
        ]);

        res.json({
            ok: true,
            message: 'Here are all the towns',
            towns,
            total
        });
    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error obteniendo todas las ciudades'
        });
    }

}


const getTowns = async(req, res) => {

    const id = req.query.id;
    const province = req.query.province || '';
    const text = req.query.texto || '';

    const desde = Number(req.query.desde) || 0;
    const registropp = Number(process.env.DOCSPERPAGE);
    let texto = '';
    let query = {};

    try {

        /*const token = req.header('x-token');

        if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }*/

        let towns = '';

        if (id) {
            [towns, total] = await Promise.all([Town.findById(id).populate('province'),
                Town.countDocuments()
            ]);

        }
        /* else if (province) {
                    [towns, total] = await Promise.all([
                        Town.find({ province: province }),
                        Town.countDocuments()
                    ]);

                } else if (name) {
                    let query = { "name": { $regex: ".*" + name + ".*", $options: 'i' } };
                    [towns, total] = await Promise.all([
                        Town.find(query),
                        Town.countDocuments(query)
                    ]);

                }*/
        else {

            if (text !== '') {
                texto = new RegExp(text, 'i');
                if (province !== '') {
                    //lugar y texto
                    query = { province: province, $or: [{ name: texto }] }
                } else {
                    //solo texto
                    query = { $or: [{ name: texto }] }
                }
            } else {
                if (province !== '') {
                    //solo lugar
                    query = { province: province }
                }
            }

            [towns, total] = await Promise.all([Town.find(query).sort({ name: 1 }).skip(desde).limit(registropp).populate('province'),
                Town.countDocuments(query)
            ]);

        }

        [alltowns] = await Promise.all([
            (await Town.find(query).populate('province').collation({ locale: 'es' }).sort({ name: 1 }))
        ]);


        //console.log(alltowns);


        res.json({
            ok: true,
            message: 'Here are all the towns',
            towns,
            alltowns,
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
            msg: 'Error obteniendo las ciudades'
        });
    }

}

const getTownsByVisits = async(req, res) => {


    const registropp = Number(process.env.DOCSPERPAGE);

    try {

        const token = req.header('x-token');

        if (!((infoToken(token).rol === 'ROL_ADMIN') /* || (infoToken(token).uid === id)*/ )) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }

        let towns = '';


        [towns] = await Promise.all([Town.find({}).sort({ visits: -1 }).limit(registropp).populate('province'),

        ]);

        res.json({
            ok: true,
            message: 'Here are all the towns',
            towns
        });
    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error obteniendo las ciudades'
        });
    }

}


const createTown = async(req, res = response) => {

    const { name, province } = req.body;

    try {

        // Comrprobar que no existe una provincia con ese nombre
        const exists_town = await Town.findOne({ name: name, province: province });

        if (exists_town) {
            return res.status(400).json({
                ok: false,
                msg: 'Esta ciudad ya existe en la aplicación'
            });
        }
        //Creamos nuevo pueblo
        const town = new Town(req.body);
        town.pictures = [];
        // Almacenar en BD
        await town.save();

        res.json({
            ok: true,
            msg: 'The town: ' + name + ' has been created',
            town,
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error creando ciudades'
        });
    }
}

const updateTown = async(req, res = response) => {


    const { name, province, ...object } = req.body;
    const uid = req.params.id;

    try {

        // Para actualizar pueblo o eres admin o eres usuario del token y el uid que nos llega es el mismo
        const token = req.header('x-token');
        if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }

        // Comprobar si está intentando cambiar el nombre, que no coincida con alguno que ya esté en BD
        // Obtenemos si hay una provincia en BD con el nombre que nos llega en post
        const exists_pueblo = await Town.findOne({ name: name, province: province });

        if (exists_pueblo) {

            if (exists_pueblo._id != uid) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Ya existe el pueblo con encanto'
                });
            }
        }
        // Comprobar si existe la provincia que queremos actualizar
        const exists_t = await Town.findById(uid);

        if (!exists_t) {
            return res.status(400).json({
                ok: false,
                msg: 'Este pueblo con encanto no existe'
            });
        }

        object.name = name;
        object.province = province;

        const town = await Town.findByIdAndUpdate(uid, object, { new: true });

        res.json({
            ok: true,
            msg: 'town updated',
            town
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error modificando el pueblo con encanto'
        });
    }

}

const deleteTown = async(req, res = response) => {

    const uid = req.params.id;

    try {

        const token = req.header('x-token');
        if (!((infoToken(token).rol === 'ROL_ADMIN'))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }

        // Comprobamos si existe el pueblo que queremos borrar
        const exists_t = await Town.findById(uid);

        //eliminar lugares

        if (!exists_t) {
            return res.status(400).json({
                ok: true,
                msg: 'El pueblo con encanto seleccionado no existe'
            });
        }

        //vamos a eliminar los eventos

        let query_events = { town: exists_t };

        let events, total_events;

        [events, total_events] = await Promise.all([
            Event.find(query_events).collation({ locale: 'es' }),
            Event.countDocuments(query_events)
        ]);

        if (total_events > 0) {
            for (let i = 0; i < events.length; i++) {
                if (events[i].pictures.length > 0) {
                    const path = `${process.env.PATH_UPLOAD}/fotoevento`;
                    if (events[i].pictures.length > 0) {
                        for (let j = 0; j < events[i].pictures.length; j++) {
                            const path_file = `${path}/${events[i].pictures[j]}`;
                            if (fs.existsSync(path_file)) {
                                fs.unlinkSync(path_file);
                            }
                        }
                    }
                }
                await Event.findByIdAndRemove(events[i]._id);
            }
        }

        // vamos a ver los lugares los pueblos

        let query_place = { town: exists_t };

        let places, total;
        [places, total] = await Promise.all([
            Place.find(query_place).collation({ locale: 'es' }),
            Place.countDocuments(query_place)
        ]);

        if (total > 0) {
            for (let i = 0; i < places.length; i++) {
                let query_revws = { place: places[i]._id };

                let revws, total_revws;
                [revws, total_revws] = await Promise.all([
                    Review.find(query_revws).collation({ locale: 'es' }),
                    Review.countDocuments(query_revws)
                ]);

                if (total_revws > 0) {
                    for (let x = 0; x < revws.length; x++) {
                        const rr = await deleteREVW(revws[x]._id);

                        if (rr !== 'OK') {
                            return res.status(400).json({
                                ok: false,
                                msg: rr
                            });
                        }

                        await Review.findByIdAndRemove(revws[x]._id);
                    }
                }
                //console.log(revws);

                //Aqui vamos a eliminar los viajes de ese lugar
                let query_travels = { places: places[i]._id };

                let travels, totalTravs;
                [travels, totalTravs] = await Promise.all([
                    Travel.find(query_travels).collation({ locale: 'es' }),
                    Travel.countDocuments(query_travels)
                ]);

                if (totalTravs > 0) {
                    for (let n = 0; n < travels.length; n++) {
                        //console.log(travels[i]);
                        const rt = await deleteTRV(travels[n]._id);

                        if (rt !== 'OK') {
                            return res.status(400).json({
                                ok: false,
                                msg: rt
                            });
                        }
                        await Travel.findByIdAndRemove(travels[n]._id);
                    }
                }
                let query_favorites = { favorites: places[i]._id };

                let users, total_favorites;
                [users, total_favorites] = await Promise.all([
                    User.find(query_favorites).populate('favorites').populate('travels').collation({ locale: 'es' }),
                    User.countDocuments(query_favorites)
                ]);
                //console.log(total_favorites);
                //console.log(users);
                //arriba compruebo los usuarios que tienen como favorito este lugar, y abajo los elimino de dichos usuarios
                if (total_favorites > 0) {
                    for (let m = 0; m < users.length; m++) {
                        //if (users[i].favorites.length > 0) {
                        //for (let j = 0; j < users[i].favorites.length; j++) {
                        //if (users[i].favorites[j]._id.toString() == places[i]._id.toString()) {
                        //console.log('Entro 410');
                        await users[m].favorites.remove(places[i]._id);
                        await users[m].save();
                        //}
                        //}
                        //}
                    }
                }
            }

            for (let i = 0; i < places.length; i++) {
                if (places[i].pictures.length > 0) {
                    const path = `${process.env.PATH_UPLOAD}/fotoplace`;
                    if (places[i].pictures.length > 0) {
                        for (let j = 0; j < places[i].pictures.length; j++) {
                            const path_file = `${path}/${places[i].pictures[j]}`;
                            if (fs.existsSync(path_file)) {
                                fs.unlinkSync(path_file);
                            }
                        }
                    }
                }
                //console.log('Entro');
                //console.log(places[i].user);
                let place_user = await Place.findById(places[i]._id).populate('user');
                //console.log(place_user);
                if (place_user.user.rol == 'ROL_COMMERCE' || place_user.user.rol == 'ROL_ADMIN') {
                    //console.log('Entro');
                    await place_user.user.commercePlace.remove(place_user._id);
                    await place_user.user.save();
                }
                await Place.findByIdAndRemove(places[i]._id);
            }
        }



        if (exists_t.pictures.length > 0) {
            const path = `${process.env.PATH_UPLOAD}/fototown`;
            for (let i = 0; i < exists_t.pictures.length; i++) {
                const path_file = `${path}/${exists_t.pictures[i]}`;
                if (fs.existsSync(path_file)) {
                    fs.unlinkSync(path_file);
                }
            }
        }

        const result = await Town.findByIdAndRemove(uid);

        res.json({
            ok: true,
            msg: 'Town has been eliminated',
            result: result,
            places,
            events
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: true,
            msg: 'Error eliminando el pueblo con encanto.'
        });
    }
}



module.exports = { getTowns, getAllTowns, getTownsByVisits, createTown, updateTown, deleteTown, getAllTowns }