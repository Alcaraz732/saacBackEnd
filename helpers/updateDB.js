const User = require('../models/user');
const Event = require('../models/event');
const Review = require('../models/review');
const Place = require('../models/place');
const Travel = require('../models/travel');
const Town = require('../models/town');

const fs = require('fs');
const { infoToken } = require('../helpers/infotoken');

const updateDB = async(tipo, path, fileName, id, token) => {

    switch (tipo) {
        case 'fotoperfil':

            const user = await User.findById(id);
            if (!user) {
                return false;
            }

            // Comprobar que el id de usuario que actualiza es el mismo id del token
            // solo el usuario puede cambiar su foto
            if (infoToken(token).uid !== id) {
                console.log('el usuario que actualiza no es el propietario de la foto')
                return false;
            }

            const fotoVieja = user.picture;
            const pathFotoVieja = `${path}/${fotoVieja}`;
            
            if (fotoVieja && fs.existsSync(pathFotoVieja) && fotoVieja !== 'default_picture.jpg') {
                fs.unlinkSync(pathFotoVieja);
            }
            user.picture = fileName;
            await user.save();

            return true;

            break;

        case 'fotoevento':

            const event = await Event.findById(id);
            
            if (!event) {
                return false;
            }

            //event.pictures = [];
            await event.pictures.push(fileName);
            await event.save();

            return true;
            break;
        
            case 'fotoreview':

                const review = await Review.findById(id);
                if (!review) {
                    return false;
                }
    
                //review.pictures = [];
                await review.pictures.push(fileName);
                await review.save();
    
                return true;
                break;
            
            case 'fotoplace':

                const place = await Place.findById(id);
                if (!place) {
                    return false;
                }
        
                    //review.pictures = [];
                await place.pictures.push(fileName);
                await place.save();
        
                return true;
                break;

            case 'fototravel':

                const travel = await Travel.findById(id);
                if (!travel) {
                    return false;
                }
            
                        //review.pictures = [];
                await travel.pictures.push(fileName);
                await travel.save();
            
                return true;
                break;

            case 'fototown':

                const town = await Town.findById(id);
                if (!town) {
                    return false;
                }
                
                //review.pictures = [];
                await town.pictures.push(fileName);
                await town.save();
                
                return true;
                break;
    
        default:
            return false;
            break;
    }

}

module.exports = { updateDB }