/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 18-10-2021

Creacion de fichero del modelo de datos de la provincia
*/


const { Schema, model } = require('mongoose');

const ProvinceSchema = Schema({
    name: {
        type: String,
        require: true,
        unique: true
    },
    cod: {
        type: String,
        require: false,
        unique: true
    },


}, { collection: 'provinces' });

ProvinceSchema.method('toJSON', function() {
    const { __v, _id, ...object } = this.toObject();

    object.uid = _id;
    return object;
})

module.exports = model('Province', ProvinceSchema);