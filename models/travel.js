/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 25-10-2021

Creacion de fichero del modelo de datos de usuario
*/


const { Schema, model } = require('mongoose');

const TravelSchema = Schema({
    //CREO QUE FALTARIA UN ID PARA LOS VIAJES
    /*id: {
        type: Integer,
        require: true,
        unique:true
    },*/

    name: {
        type: String,
        require: true
    },

    pictures: [{
        type: String,
        //require: true
    }],

    description: {
        type: String
    },

    places: [{
        type: Schema.Types.ObjectId,
        ref: 'Place',
        require: true
    }],

    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true
    }
}, { collection: 'travels' });

TravelSchema.method('toJSON', function() {
    const { __v, _id, ...object } = this.toObject();

    object.uid = _id;
    return object;
})

module.exports = model('Travel', TravelSchema);