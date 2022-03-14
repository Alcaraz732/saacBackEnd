const User = require('../models/user');
const Event = require('../models/event');
const Review = require('../models/review');
const Place = require('../models/place');
const Travel = require('../models/travel');
const Town = require('../models/town');
const fs = require('fs');


const deleteREVW = async(uid) => {

    const exists_t = await Review.findById(uid);

    let bool_user = false;

    if (!exists_t) {/*
        return res.status(400).json({
            ok: true,
            msg: 'The review does not exists'
        });*/
        console.log("La review no existe");
        return 'La review no existe';
    }

    const user = await User.findById(exists_t.user);
        
    if(user){
        //return 'No tiene usuario esta review';
        if(user.reviews.length > 0){
            await user.reviews.remove(exists_t._id);
            await user.save();
        }
        bool_user = true;
    
    }

    if(!bool_user){
        //Si no hay usuario borrar la valoracion del usuario en caso de que exista en el array del usu
        const user = await User.find({reviews: exists_t});
        if(user.length === 1){
            if(user[0].reviews.length > 0){
                await user[0].reviews.remove(exists_t._id);
                await user[0].save();
            }
        }
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
    
    const place = await Place.findById(exists_t.place);

    let number_revs = 0;
    
    if(place){
        for(let i = 0; i<place.reviews.length; i++){
            console.log(place.reviews[i]);
            if(place.reviews[i].toString() !== exists_t._id.toString()){
                const rvw_place = await Review.findById(place.reviews[i]);
                number_revs += rvw_place.review;
            }
        }
        
        let total_revs = place.reviews.length - 1;
        let med_rvw = number_revs / total_revs;
        med_rvw = med_rvw.toFixed(1);
        place.media_reviews = med_rvw;
        await place.save();
    }

    let bool_place = false;
    
    if(place){
        //return 'No existe este lugar';
        if(place.reviews.length > 0){
            await place.reviews.remove(exists_t._id);
            await place.save();
        }
        bool_place = true;
    }

    if(!bool_place){
        //Si no hay lugar borrar la valoracion de este lugar
        const place = await Place.find({reviews: exists_t});
        if(place.length === 1){
            if(place[0].reviews.length > 0){
                console.log('Entro 101');
                await place[0].reviews.remove(exists_t._id);
                await place[0].save();
            }
        }
    }
    return 'OK';

}

module.exports = { deleteREVW }