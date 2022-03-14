/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 18-10-2021

Creacion de fichero del modelo de datos de usuario
*/


const { Schema, model } = require('mongoose');

//const Province = require('../models/province');

const TownSchema = Schema({
    name: {
        type: String,
        require: true
    },
    location: {
        type: String,
        require: true,

    },
    pictures: [{
        type: String,
    }],
    surface: {
        type: String,
        default: "example.png"
    },
    description: {
        type: String,
    },
    population: {
        type: Number,

    },
    tags: [{
        type: String
    }],
    visits: {
        type: Number,
        require: true,
        default: 0
    },

    province: {
        type: Schema.Types.ObjectId,
        ref: 'Province',
        require: true
    },

    places: [{
        type: Schema.Types.ObjectId,
        ref: 'Place',
    }],

    events: [{
        type: Schema.Types.ObjectId,
        ref: 'Event',
    }],
    Date: {
        type: Date,
        default: Date.now
    },

}, { collection: 'towns' });

TownSchema.method('toJSON', function() {
    const { __v, _id, ...object } = this.toObject();



    object.uid = _id;

    return object;
})

module.exports = model('Town', TownSchema);