/*
@Authors: Alejandro Alcaraz Sanchez, Ismael Caceres Bernabeu, Pablo Garcia Muñoz, Aitor Medina Amat,
Alvaro Jose Moreno Carreras, Juan Vicente Iborra.

Fecha de creacion de fichero: 18-10-2021

Creacion del fichero donde se encuentran los controladores de Provincia.
Altas: metodo de obtener usuario y metodo de crear usuario.
Modificacion: comprobar en el getUsers que un administrador o uno mismo puede verse su perfil
*/

const { response } = require('express');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const Province = require('../models/province');
const { infoToken } = require('../helpers/infotoken');


const getProvinces = async(req, res) => {

    const id = req.query.id;
    const name = req.query.name;
    const desde = Number(req.query.desde) || 0;
    const registropp = Number(process.env.DOCSPERPAGE);
    let query = {};

    try {

        const token = req.header('x-token');

        if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }

        let provinces = '';

        if (id) {
            [provinces, total] = await Promise.all([Province.findById(id),
                Province.countDocuments()
            ]);
        } else if (name) {
            //console.log(total);
            query = { "name": { $regex: ".*" + name + ".*", $options: 'i' } };

            [provinces, total] = await Promise.all([Province.find(query),
                Province.countDocuments(query)
            ]);
        } else {
            [provinces, total] = await Promise.all([Province.find({}).sort({ name: 1 }).skip(desde).limit(registropp),
                Province.countDocuments()
            ]);

        }

        [allprovinces] = await Promise.all([
            Province.find(query).collation({ locale: 'es' }).sort({ name: 1 })
        ]);


        res.json({
            ok: true,
            message: 'Here are all the provinces',
            provinces,
            allprovinces,
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
            msg: 'Error obteniendo las provincias'
        });
    }

}
const getAllProvinces = async(req, res) => {


    try {

        const token = req.header('x-token');

        if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }

        let provinces = '';


        [provinces] = await Promise.all([Province.find({}).sort({ name: 1 })

        ]);


        res.json({
            ok: true,
            message: 'Here are all the provinces',
            provinces,

        });
    } catch (error) {
        console.log(error);
        res.json({
            ok: false,
            msg: 'Error obteniendo todas las provincias'
        });
    }

}

const createProvince = async(req, res = response) => {

    const { name } = req.body;

    try {

        // Comrprobar que no existe una provincia con ese nombre
        const exists_province = await Province.findOne({ name: name });

        if (exists_province) {
            return res.status(400).json({
                ok: false,
                msg: 'La provincia ya existe, no pueden haber dos iguales'
            });
        }
        //Creamos nuevo provincia
        const province = new Province(req.body);;
        // Almacenar en BD
        await province.save();

        res.json({
            ok: true,
            msg: 'The Province: ' + name + ' has been created',
            province,
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error creando la provincia'
        });
    }
}

const updateProvince = async(req, res = response) => {


    const { name, ...object } = req.body;
    const uid = req.params.id;

    try {

        // Para actualizar provincia o eres admin o eres usuario del token y el uid que nos llega es el mismo
        const token = req.header('x-token');
        if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }

        // Comprobar si está intentando cambiar el nombre, que no coincida con alguno que ya esté en BD
        // Obtenemos si hay una provincia en BD con el nombre que nos llega en post
        const exists_nombre = await Province.findOne({ name: name });

        if (exists_nombre) {

            if (exists_nombre._id != uid) {
                return res.status(400).json({
                    ok: false,
                    msg: 'La provincia ya existe, no pueden haber dos iguales'
                });
            }
        }
        // Comprobar si existe la provincia que queremos actualizar
        const exists_prov = await Province.findById(uid);

        if (!exists_prov) {
            return res.status(400).json({
                ok: false,
                msg: 'La provincia no existe'
            });
        }

        object.name = name;

        const province = await Province.findByIdAndUpdate(uid, object, { new: true });

        res.json({
            ok: true,
            msg: 'Province updated',
            province
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error modificando la provincia'
        });
    }

}

const deleteProvince = async(req, res = response) => {

    const uid = req.params.id;

    try {


        const token = req.header('x-token');
        if (!((infoToken(token).rol === 'ROL_ADMIN') || (infoToken(token).uid === id))) {
            return res.status(400).json({
                ok: false,
                msg: 'No tienes permisos para realizar esta acción',
            });
        }

        // Comprobamos si existe la provincia que queremos borrar
        const exists_prov = await Province.findById(uid);

        if (!exists_prov) {
            return res.status(400).json({
                ok: true,
                msg: 'La provincia no existe'
            });
        }


        const result = await Province.findByIdAndRemove(uid);

        res.json({
            ok: true,
            msg: 'Province has been eliminated',
            result: result
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: true,
            msg: 'Error eliminando la provincia'
        });
    }
}

module.exports = { getProvinces, getAllProvinces, createProvince, updateProvince, deleteProvince }