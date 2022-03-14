
const User = require('../models/user');
const Event = require('../models/event');
const Review = require('../models/review');
const Place = require('../models/place');
const Travel = require('../models/travel');
const Town = require('../models/town');
const fs = require('fs');


const deleteTRV = async(uid) => {


const exists_tra = await Travel.findById(uid);

if (!exists_tra) {/*
    return res.status(400).json({
        ok: true,
        msg: 'The travel does not exists'
    });*/
    console.log("El viaje no existe");
    return 'El viaje no existe';
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

let bool_user = false;

if (user) {
    if(user.travels.length > 0){    
        for(let i = 0; i < user.travels.length; i++){
            if(user.travels[i]._id.toString() === exists_tra._id.toString()){
                user.travels.remove(exists_tra._id);
            }
        }
    }   
    await user.save();
    bool_user = true;
}

if(!bool_user){
    const user = await User.find({travels: exists_tra});
    if(user.length === 1){
        if(user[0].travels.length > 0){
            await user[0].travels.remove(exists_tra._id);
            await user[0].save();
        }
    }
}

return 'OK';

}

module.exports = { deleteTRV }