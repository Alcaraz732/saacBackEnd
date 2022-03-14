/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 24-10-2021

Creacion de fichero del modelo de datos de usuario
*/


const { Schema, model } = require('mongoose');

//const Province = require('../models/province');

const ReviewSchema = Schema({

    comment: {
        type: String,
        require: true
    },
    review: {
        type: Number, //double
        require: true
    },
    pictures: [{
        type: String,
        require: true
    }],
    like: {
        type: Number, //integer
        default: 0
    },
    publicationDate: {
        type: Date,
        default: Date.now
    },
    place: {
        type: Schema.Types.ObjectId,
        ref: 'Place',
        require: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true
    }

}, { collection: 'reviews' });

ReviewSchema.method('toJSON', function() {
    const { __v, _id, ...object } = this.toObject();

    object.uid = _id;

    return object;
})

module.exports = model('Review', ReviewSchema);