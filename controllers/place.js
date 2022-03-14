/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 18-10-2021

Creacion del fichero donde se encuentran los controladores de Pueblo.

*/

const { response } = require('express');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const Place = require('../models/place');
const { infoToken } = require('../helpers/infotoken');
const User = require('../models/user');
const Travel = require('../models/travel');
const fs = require('fs');
const Review = require('../models/review');
const { deleteREVW } = require('../helpers/delete_info_revw');
const { deleteTRV } = require('../helpers/delete_info_travel');
const Town = require('../models/town');
const place = require('../models/place');

const getPlaces = async(req, res) => {

    const id = req.query.id;
    const name = req.query.name;
    const town = req.query.town;

    const desde = Number(req.query.since) || 0;
    const registropp = Number(process.env.DOCSPERPAGE);

    let text_search = '';
    const text = req.query.texto || '';
    if (text !== '') {
        text_search = new RegExp(text, 'i');
    }


    try {

        const token = req.header('x-token');
        const userr = await User.findById(infoToken(token).uid);

        /*
                if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
                    return res.status(400).json({
                        ok: false,
                        msg: 'You do not having permissions to list places',
                    });
                }
        */
        let places = '';
        let query = {};

        //console.log(userr);
        //console.log("VERGAAAAAAA: "+infoToken(token).rol);

        if ( /*userr.rol*/ infoToken(token).rol === 'ROL_COMMERCE') {

            if (id) {

                [places, total] = await Promise.all([Place.findById(id).populate('town').populate('user', '-v -password -activation_code'),
                    Place.countDocuments()
                ]);

            } else {
                if (text) {
                    query = { $or: [{ name: text_search }, { description: text_search }] };
                }
                [places, total] = await Promise.all([
                    Place.find({ user: userr }, query).skip(desde).limit(registropp).collation({ locale: 'es' }).sort({ name: 1 }).populate('town').populate('user', '-v -password -activation_code'),
                    Place.countDocuments(query)
                ]);

            }
        } else {

            if (id) {


                [places, total] = await Promise.all([Place.findById(id),
                    Place.countDocuments()
                ]);



                if (infoToken(token).rol === 'ROL_USER') {


                    //SUMAR VISITAS CUANDO UN USER HACE UN GET CON ID

                    var object = new Object();

                    var fecha = new Date();

                    var mes = fecha.getMonth();

                    let lugar = await Place.findById(id);

                    object = lugar;

                    object.visits[mes] = lugar.visits[mes] + 1;



                    lugar = await Place.findByIdAndUpdate(id, object, { new: true });

                    await lugar.save();

                    console.log("mes");

                }



            } else if (town) {
                [places, total] = await Promise.all([
                    Place.find({ town: town }),
                    Place.countDocuments()
                ]);

            } else {
                let query = {};
                if (text) {
                    query = { $or: [{ name: text_search }, { description: text_search }] };
                }
                [places, total] = await Promise.all([
                    Place.find(query).skip(desde).limit(registropp).collation({ locale: 'es' }).sort({ name: 1 }).populate('town').populate('user', '-v -password -activation_code'),
                    Place.countDocuments(query)
                ]);
            }
        }

        [allplaces] = await Promise.all([
            Place.find(query).collation({ locale: 'es' }).sort({ name: 1 }).populate('town')
        ]);

        res.json({
            ok: true,
            message: 'Here are all the places',
            places,
            allplaces,
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
            msg: 'Error obteniendo todos los lugares de interés'
        });
    }

}



const getAllPlaces = async(req, res) => {


    try {

        const token = req.header('x-token');

        /*if (!((infoToken(token).rol === 'ROL_ADMIN') || !((infoToken(token).rol === 'ROL_USER') || (infoToken(token).uid === id))) {
                return res.status(400).json({
                    ok: false,
                    msg: 'You do not having permissions to list places',
                });
            }*/

        let places = '';


        [places] = await Promise.all([Place.find({}).sort({ name: 1 }).populate('town').populate('user')]);


        res.json({
            ok: true,
            message: 'Here are all the places',
            places,

        });
    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error obteniendo todos los lugares de interés'
        });
    }

}

const createPlace = async(req, res = response) => {

    const { name, ...object } = req.body;

    try {

        const token = req.header('x-token');
        const user = await User.findById(infoToken(token).uid);
        const town = await Town.findById(req.body.town);

        if (object.mobile_number.length !== 9) {
            return res.status(400).json({
                ok: false,
                msg: 'El número de télefono tiene que tener 9 dígitos'
            });
        }

        if (object.mobile_number <= 599999999 || object.mobile_number >= 1000000000) {
            return res.status(400).json({
                ok: false,
                msg: 'El número de télefono tiene que ser mayor que 599999999 y menor que 800000000'
            });
        }

        if (!town) {
            return res.status(400).json({
                ok: false,
                msg: 'La ciudad no existe'
            });
        }
        /* REVISAR


                const exists_place = await Place.findOne({ name: name, province: province });

                if (exists_place) {
                    return res.status(400).json({
                        ok: false,
                        msg: 'This place already exists in the database'
                    });
                }

        */
        if (!user) {
            return res.status(400).json({
                ok: false,
                msg: 'El usuario no existe'
            });
        }

        if (user.rol !== 'ROL_COMMERCE' && user.rol !== 'ROL_ADMIN') {
            return res.status(400).json({
                ok: false,
                msg: 'Solo pueden crear lugares los comerciantes y los administradores'
            });
        }

        const place = new Place(req.body);


        for (let j = 0; j < 12; j++) {
            place.visits[j] = 0;
        }



        place.status = "Pendiente";
        place.user = user;
        await user.commercePlace.push(place._id);
        await user.save();
        place.pictures = [];
        await town.places.push(place._id);
        await town.save();
        //user.commercePlace = [];
        await place.save();

        res.json({
            ok: true,
            msg: 'El lugar de interés: ' + name + ' ha sido creado',
            place,
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error creando un lugar de interés'
        });
    }
}

const updatePlace = async(req, res = response) => {


    const {...object } = req.body;
    const uid = req.params.id;

    try {
        /*
                // Para actualizar pueblo o eres admin o eres usuario del token y el uid que nos llega es el mismo
                const token = req.header('x-token');
                if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
                    return res.status(400).json({
                        ok: false,
                        msg: 'You do not having permissions to update towns',
                    });
                }

                // Comprobar si está intentando cambiar el nombre, que no coincida con alguno que ya esté en BD
                // Obtenemos si hay una provincia en BD con el nombre que nos llega en post
                const exists_lugar = await Place.findOne({ name: name, province: province });

                if (exists_lugar) {

                    if (exists_pueblo._id != uid) {
                        return res.status(400).json({
                            ok: false,
                            msg: 'Place already exists'
                        });
                    }
                }

                */
        if (object.mobile_number.length !== 9) {
            return res.status(400).json({
                ok: false,
                msg: 'El número de télefono tiene que tener 9 dígitos'
            });
        }

        if (object.mobile_number <= 599999999 || object.mobile_number >= 1000000000) {
            return res.status(400).json({
                ok: false,
                msg: 'El número de télefono tiene que ser mayor que 599999999 y menor que 800000000'
            });
        }

        if (!object.town) {
            return res.status(400).json({
                ok: false,
                msg: 'Tienes que seleccionar una ciudad'
            });
        }
        // Comprobar si existe la provincia que queremos actualizar
        const exists_l = await Place.findById(uid);

        if (!exists_l) {
            return res.status(400).json({
                ok: false,
                msg: 'El lugar de interés no existe'
            });
        }
        //este es el pueblo actual al cual pertenece el lugar
        const town1 = await Town.findById(exists_l.town);

        if (!town1) {
            return res.status(400).json({
                ok: false,
                msg: 'La ciudad no existe'
            });
        }
        //si el pueblo que nos llega es distinto del actual, se realiza esta accion
        if (object.town.toString() !== exists_l.town.toString()) {
            //Este es el nuevo pueblo al que pertenece el lugar
            const town2 = await Town.findById(object.town);
            if (!town2) {
                return res.status(400).json({
                    ok: false,
                    msg: 'La ciudad no existe'
                });
            }
            //se realizan los cambios pertinentes
            await town1.places.remove(exists_l._id);
            await town1.save();
            await town2.places.push(exists_l._id);
            await town2.save();
        }
        //object.name = name;

        const place = await Place.findByIdAndUpdate(uid, object, { new: true });

        res.json({
            ok: true,
            msg: 'place updated',
            place
        });

    } catch (error) {


        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error modificando lugar'
        });
    }

}

const acceptPlace = async(req, res = response) => {

    var object = new Object();
    const uid = req.params.id;

    try {


        const exists_l = await Place.findById(uid);

        if (!exists_l) {
            return res.status(400).json({
                ok: false,
                msg: 'El lugar de interés no existe'
            });
        }


        object.published = true;
        object.status = 'Publicado';

        const place = await Place.findByIdAndUpdate(uid, object, { new: true });

        res.json({
            ok: true,
            msg: 'place updated',
            place
        });

    } catch (error) {

        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error modificando lugar'
        });
    }

}


const deletePlace = async(req, res = response) => {

    const uid = req.params.id;

    try {

        const token = req.header('x-token');
        //solo un admin o el propio usuario puede eliminar un lugar
        if (!((infoToken(token).rol === 'ROL_ADMIN') /* || (infoToken(token).uid === uid)*/ )) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }
        /*
                
        */
        // Comprobamos si existe el lugar que queremos borrar
        const exists_t = await Place.findById(uid);
        let userID = exists_t.user;
        let townID = exists_t.town;

        const user = await User.findById(userID);

        if (!user) {
            return res.status(400).json({
                ok: true,
                msg: 'Este usuario no existe'
            });
        }

        if (!exists_t) {
            return res.status(400).json({
                ok: true,
                msg: 'El lugar de interés no existe'
            });
        }

        //buscamos la ciudad a la que pertenece este lugar
        const town = await Town.findById(townID);
        //comprobamos que el lugar existe
        if (!town) {
            return res.status(400).json({
                ok: true,
                msg: 'La ciudad no existe'
            });
        }

        //Eliminamos el lugar del array de lugares de la ciudad a la que pertene
        await town.places.remove(exists_t._id);
        await town.save();


        //Eliminamos del array de comerciantes el lugar en caso de que no haya sido desarrollado por un administrador
        if (user.rol == 'ROL_COMMERCE' || user.rol == 'ROL_ADMIN') {
            await user.commercePlace.remove(exists_t._id);
            await user.save();
        }

        //añadimos a la query el lugar para comprobar cuantos usuarios lo tienen dentro de sus favoritos.
        let query = { favorites: exists_t };

        let users, total;
        [users, total] = await Promise.all([
            User.find(query).populate('favorites').populate('travels').collation({ locale: 'es' }),
            User.countDocuments(query)
        ]);

        //arriba compruebo los usuarios que tienen como favorito este lugar, y abajo los elimino de dichos usuarios
        if (total > 0) {
            for (let i = 0; i < users.length; i++) {
                if (users[i].favorites.length > 0) {
                    for (let j = 0; j < users[i].favorites.length; j++) {
                        if (users[i].favorites[j]._id.toString() == exists_t._id.toString()) {
                            await users[i].favorites.remove(exists_t._id);
                            await users[i].save();
                        }
                    }
                }
            }
        }

        //aqui eliminamos de los viajes el lugar que estamos tratando eliminar

        let query_travels = { places: exists_t };

        let travels, totals;
        [travels, totals] = await Promise.all([
            Travel.find(query_travels).collation({ locale: 'es' }),
            Travel.countDocuments(query_travels)
        ]);

        if (totals > 0) {
            for (let i = 0; i < travels.length; i++) {
                for (let j = 0; j < travels[i].places.length; j++) {
                    if (travels[i].places[j]._id.toString() == exists_t._id.toString()) {
                        await travels[i].places.remove(exists_t._id);
                        await travels[i].save();
                        if (travels[i].places.length === 0) {
                            const rt = await deleteTRV(travels[i]._id);
                            if (rt !== 'OK') {
                                return res.status(400).json({
                                    ok: false,
                                    msg: rt
                                });
                            }
                            await Travel.findByIdAndRemove(travels[i]._id);
                        }
                    }
                }
            }
        }
        //Eliminamos las imagenes de los lugares;
        if (exists_t.pictures.length > 0) {
            const path = `${process.env.PATH_UPLOAD}/fotoplace`;
            for (let i = 0; i < exists_t.pictures.length; i++) {
                const path_file = `${path}/${exists_t.pictures[i]}`;
                console.log(i, ' ', path_file);
                exists_t.pictures.remove(i);
                if (fs.existsSync(path_file)) {
                    fs.unlinkSync(path_file);
                }
            }
        }

        //aqui debemos borrar las valoraciones del lugar que borremos

        let query_place = { place: exists_t };

        let revws, total_revws;
        [revws, total_revws] = await Promise.all([
            Review.find(query_place).collation({ locale: 'es' }),
            Review.countDocuments(query_place)
        ]);

        if (total_revws > 0) {
            for (let i = 0; i < revws.length; i++) {
                if (revws[i].place._id.toString() == exists_t._id.toString()) {
                    const rr = await deleteREVW(revws[i]._id);

                    if (rr !== 'OK') {
                        return res.status(400).json({
                            ok: false,
                            msg: rr
                        });
                    }
                    await Review.findByIdAndRemove(revws[i]._id);
                }
            }
        }

        const result = await Place.findByIdAndRemove(uid);

        res.json({
            ok: true,
            msg: 'Place has been eliminated',
            result: result,
            users,
            revws
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: true,
            msg: 'Error eliminando el lugar de interés'
        });
    }
}

const searchPlace = async(req, res) => {


    const text_search = req.params.name;
    console.log(text_search);
    const var1 = text_search.toString();

    try {




        //let places = await Promise.all([Place.find(query)]);
        let places2 = await Place.find({ "name": { $regex: ".*" + text_search + ".*", $options: 'i' } });

        //console.log(places);
        console.log(places2);
        if (!places2) {
            return res.status(400).json({
                ok: false,
                msg: 'El lugar de interés no existe'
            });
        }


        res.json({
            ok: true,
            message: 'Here are all the places',
            places2
        });

    } catch (error) {

        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error obteniendo los lugares de interés'
        });
    }

}

module.exports = { getPlaces, getAllPlaces, createPlace, updatePlace, deletePlace, acceptPlace, searchPlace }