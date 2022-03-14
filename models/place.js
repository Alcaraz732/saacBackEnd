/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 26-10-2021

Creacion de fichero del modelo de datos de usuario
*/


const { Schema, model } = require('mongoose');

//const Province = require('../models/province');

const PlaceSchema = Schema({

    name: {
        type: String,
        require: true
    },
    location: {
        type: String,
        require: true
    },
    pictures: [{
        type: String,
        require: true
    }],
    description: {
        type: String,
    },
    mobile_number: {
        type: Number,

    },
    type: {
        type: String,
        require: true

    },
    web: {
        type: String,

    },
    schedule: {
        type: String,

    },
    visits: [{
        type: Number,
    }],

    media_reviews: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: "No Publicado",
    },
    town: {
        type: Schema.Types.ObjectId,
        ref: 'Town',
        require: true
    },
    premium: {
        type: Boolean,
    },
    model: {
        type: String,
    },
    register: [{
        type: String
    }],
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review',
    }],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true
    }

}, { collection: 'places' });

PlaceSchema.method('toJSON', function() {
    const { __v, _id, ...object } = this.toObject();

    object.uid = _id;

    return object;
})

module.exports = model('Place', PlaceSchema);