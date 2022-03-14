/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 18-10-2021

Creacion de fichero del modelo de datos de usuario
*/


const { Schema, model } = require('mongoose');

const UserSchema = Schema({
    name: {
        type: String,
        require: true
    },

    email: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String/*,
        require: true*/
    },
    picture: {
        type: String,
        default: 'default_picture.jpg'
    },
    rol: {
        type: String,
        require: true,
        default: 'ROL_USER'
    },
    networks: {
        type: String,
    },
    travels: [{
        type: Schema.Types.ObjectId,
        ref: 'Travel',
        require: true
    }],
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review',
        require: true
    }],
    commercePlace: [{
        type: Schema.Types.ObjectId,
        ref: 'Place',
        require: true
    }],
    favorites: [{
        type: Schema.Types.ObjectId,
        ref: 'Place',
        require: true
    }],
    registerDate: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: false
    },
    activation_code: {
        type: String,
        require: true
    },
    googleLogin: {
        type: Boolean,
        default: false
    },
    CIF: {
        type: String
    }
}, { collection: 'usuarios' });

UserSchema.method('toJSON', function() {
    const { __v, _id, password, ...object } = this.toObject();
    
    object.uid = _id;
    return object;
})

module.exports = model('User', UserSchema);