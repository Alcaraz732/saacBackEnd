/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 26-10-2021

Creacion del fichero donde se encuentran los controladores de Pueblo.

*/

const { response } = require('express');
const validator = require('validator');

const Review = require('../models/review');
const { infoToken } = require('../helpers/infotoken');
const { deleteREVW } = require('../helpers/delete_info_revw');
const User = require('../models/user');
const fs = require('fs');
const Place = require('../models/place');




const getReviews = async(req, res) => {

    const id = req.query.id;


    const desde = Number(req.query.desde) || 0;
    const registropp = Number(process.env.DOCSPERPAGE);

    let texto = '';
    let query = {};

    const text = req.query.texto || '';
    const place = req.query.place || '';

    try {

        //const token = req.header('x-token');

        /* Revisar
                const token = req.header('x-token');

                if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
                    return res.status(400).json({
                        ok: false,
                        msg: 'You do not having permissions to list reviews',
                    });
                }*/

        let revws = "";

        if (id) {

            [revws, total] = await Promise.all([Review.findById(id).populate('place').populate('user', '-v -password -activation_code'),
                Review.countDocuments()
            ]);

        } else { //Revisar sort y populate


            if (text !== '') {
                texto = new RegExp(text, 'i');
                if (place !== '') {
                    //lugar y texto
                    query = { place: place, $or: [{ comment: texto }] }
                } else {
                    //solo texto
                    query = { $or: [{ comment: texto }] }
                }
            } else {
                if (place !== '') {
                    //solo lugar
                    query = { place: place }
                }
            }

            [revws, total] = await Promise.all([
                Review.find(query).skip(desde).limit(registropp).collation({ locale: 'es' }).sort({ name: 1 }).populate('place').populate('user', '-v -password -activation_code'),
                Review.countDocuments(query)
            ]);

        }

        [allreviews] = await Promise.all([
            Review.find(query).populate('place').populate('user', '-v -password -activation_code').sort({ registerDate: -1 })
        ]);


        res.json({
            ok: true,
            message: 'Here are all the reviews',
            revws,
            allreviews,
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
            msg: 'Error obteniendo las valoraciones'
        });
    }

}

const getReviewsbyCommerce = async(req, res) => {

    const user = req.query.user || '';

    //console.log("params: " + req.params);




    const desde = Number(req.query.desde) || 0;
    const registropp = Number(process.env.DOCSPERPAGE);

    let texto = '';
    let query = {};

    const text = req.query.texto || '';
    const place = req.query.place || '';

    try {

        //const token = req.header('x-token');

        /* Revisar
                const token = req.header('x-token');

                if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
                    return res.status(400).json({
                        ok: false,
                        msg: 'You do not having permissions to list reviews',
                    });
                }*/

        let revws = "";

        let revwscom = new Array;
        let places = "";
        let total_revs = 0;
        let numrevs = 0

        if (place) {

            //BUSCAMOS LOS LUGARES DEL USUARIO PASADO POR PARÁMETRO

            query = { place: place };
            [revws, numrevs] = await Promise.all([Review.find(query).populate('place').populate('user', '-v -password -activation_code'),
                Review.countDocuments()
            ]);

            for (let j = 0; j < revws.length; j++) {
                revwscom.push(revws[j]);
            }

            revws = "";

        } else {







            if (user) {

                //BUSCAMOS LOS LUGARES DEL USUARIO PASADO POR PARÁMETRO

                let query = { user: user };

                [places, total] = await Promise.all([Place.find(query),
                    Place.countDocuments(query)
                ]);

                //BUSCAMOS LAS REVIEWS DE ESOS LUGARES

                for (let i = 0; i < places.length; i++) {
                    query = { place: places[i] };
                    [revws, numrevs] = await Promise.all([Review.find(query).populate('place').populate('user', '-v -password -activation_code'),
                        Review.countDocuments()
                    ]);

                    for (let j = 0; j < revws.length; j++) {
                        revwscom.push(revws[j]);
                    }

                    revws = "";
                }
            }
        }



        res.json({
            ok: true,
            message: 'Here are all the reviews',
            numrevs,
            revwscom
        });
    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error obteniendo las valoraciones'
        });
    }

}


const getAllReviews = async(req, res) => {

    try {
        const token = req.header('x-token');

        /*if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
            return res.status(400).json({
                ok: false,
                msg: 'You do not having permissions to list reviews',
            });
        }*/

        let revws = "";

        [revws] = await Promise.all([Review.find({}).sort({ name: 1 }).populate('user').populate('place')]);


        res.json({
            ok: true,
            message: 'Here are all the reviews',
            revws
        });
    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error obteniendo todas las valoraciones'
        });
    }

}

const createReview = async(req, res = response) => {

    const { comment, review, ...object } = req.body;


    try {
        const token = req.header('x-token');
        const user = await User.findById(infoToken(token).uid);
        const place = await Place.findById(req.body.place);

        if (review > 5.0 || review < 1.0) {
            return res.status(400).json({
                ok: false,
                msg: 'La nota tiene que ir del 1 al 5'
            });
        }
        //Creamos nueva review
        const revw = new Review(req.body);
        revw.user = user;
        //user.reviews = [];
        // Almacenar en BD
        revw.pictures = [];
        await revw.save();
        await user.reviews.push(revw._id);
        await user.save();
        await place.reviews.push(revw._id);
        await place.save();

        let number_revs = 0;

        for (let i = 0; i < place.reviews.length; i++) {
            console.log(place.reviews[i]);
            const rvw_place = await Review.findById(place.reviews[i]);
            number_revs += rvw_place.review;
        }

        let med_rvw = number_revs / place.reviews.length;
        med_rvw = med_rvw.toFixed(1);
        place.media_reviews = med_rvw;
        await place.save();

        res.json({
            ok: true,
            msg: 'The review has been created',
            revw,
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error creatingdo la valoración'
        });
    }
}

const updateReview = async(req, res = response) => {

    const { comment, review, ...object } = req.body;
    const uid = req.params.id;

    try {
        // Para actualizar review o eres admin o eres usuario del token y el uid que nos llega es el mismo
        const token = req.header('x-token');
        if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }
        // Comprobamos si existe la review que queremos updatear
        const exists_r = await Review.findById(uid);

        if (exists_r) {
            if (exists_r._id != uid) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Esta valoración ya existe'
                });
            }
        }

        if (review > 5.0 || review < 1.0) {
            return res.status(400).json({
                ok: false,
                msg: 'La nota tiene que ir del 1 al 5'
            });
        }

        const place1 = await Place.findById(exists_r.place);
        //este es el lugar actual de esta valoracion
        if (!place1) {
            return res.status(400).json({
                ok: false,
                msg: 'Este lugar de interés no existe'
            });
        }

        //Evitar comentario vacio y esas cosas
        object.comment = comment;
        object.review = review;
        //si el objeto que nos llega es distinto que el que ya hay se intercambia
        if (object.place.toString() !== exists_r.place.toString()) {
            //este es el nuevo lugar de la valoración
            const place2 = await Place.findById(object.place);
            if (!place2) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Este lugar de interés no existe'
                });
            }
            await place1.reviews.remove(exists_r._id);
            await place1.save();
            await place2.reviews.push(exists_r._id);
            await place2.save();
        }

        const rvw = await Review.findByIdAndUpdate(uid, object, { new: true });

        let number_revs = 0;
        const place_modify = await Place.findById(rvw.place);

        for (let i = 0; i < place_modify.reviews.length; i++) {
            const rvw_place = await Review.findById(place_modify.reviews[i]);
            number_revs += rvw_place.review;
        }

        let med_rvw = number_revs / place_modify.reviews.length;
        med_rvw = med_rvw.toFixed(1);
        place_modify.media_reviews = med_rvw;
        await place_modify.save();

        res.json({
            ok: true,
            msg: 'Review updated',
            rvw
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error modificando la valoración'
        });
    }

}

const deleteReview = async(req, res = response) => {

    const uid = req.params.id;

    try {
        const token = req.header('x-token');
        console.log(infoToken(token));
        
        const user = await User.find({reviews: uid});

        if ((infoToken(token).rol !== 'ROL_ADMIN') && (infoToken(token).uid != user[0]._id)) {
            //console.log('Entro 389');
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }
        // Comprobamos si existe la review que queremos borrar
        /*const user = await User.findById(exists_t.user);
        
        if(!user){
            return res.status(400).json({
                ok: true,
                msg: 'This user does not exists'
            });
        }

        if(user.reviews.length > 0){
            await user.reviews.remove(exists_t._id);
            await user.save();
        }
        

        if(exists_t.pictures.length > 0){
            const path = `${process.env.PATH_UPLOAD}/fotoreview`;
            for (let i = 0; i < exists_t.pictures.length; i++){
                const path_file = `${path}/${exists_t.pictures[i]}`;
                if(fs.existsSync(path_file)){
                    fs.unlinkSync(path_file);
                }
            }
        }
        */

        const rr = await deleteREVW(uid);

        if (rr !== 'OK') {
            return res.status(400).json({
                ok: false,
                msg: rr
            });
        }

        const result = await Review.findByIdAndRemove(uid);

        res.json({
            ok: true,
            msg: 'Review has been eliminated',
            result: result
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error eliminando valoración'
        });
    }
}



module.exports = { getReviews, getAllReviews, createReview, updateReview, deleteReview, getReviewsbyCommerce }