const Event = require('../models/event');
const { response } = require('express');
const { validationResult } = require('express-validator');
const fs = require('fs');
const Town = require('../models/town');


const getEvents = async(req, res) => {

    const id = req.query.id;
    const desde = Number(req.query.desde) || 0;
    const registropp = Number(process.env.DOCSPERPAGE);

    let text_search = '';
    let query = {};

    const text = req.query.name || '';
    if (text !== '') {
        text_search = new RegExp(text, 'i');
    }

    try {
        let events, total;

        if (id) {

            [events, total] = await Promise.all([Event.findById(id).populate('town'), Event.countDocuments()]);

        } else {
            
            if (text) {
                query = { name: text_search };
            }

            [events, total] = await Promise.all([
                Event.find(query).skip(desde).limit(registropp).populate('town'),
                Event.countDocuments(query)
            ]);

        }

        [allevents] = await Promise.all([
            Event.find(query).sort({ registerDate: -1 }).populate('town')
        ]);

        res.json({
            ok: true,
            msg: 'getEvents',
            events,
            allevents,
            page: {
                desde,
                registropp,
                total
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error en la petición'
        });
    }

}

const createEvent = async(req, res) => {

    const { name } = req.body;

    try {

        const existe = await Event.findOne({ name: name });
        
        if (existe) {
            return res.status(400).json({
                ok: false,
                msg: 'Este evento ya existe'
            });
        }

        const town = await Town.findById(req.body.town);

        if(!town){
            return res.status(400).json({
                ok: false,
                msg: 'La ciudad no existe'
            });
        }

        const event = new Event(req.body);
        event.pictures = [];
        event.town = req.body.town;
        await town.events.push(event._id);
        await town.save();
        await event.save();

        res.json({
            ok: true,
            msg: 'createEvent',
            event
        });



    } catch (error) {
        console.log(error);
        return res.status(400).json({
            ok: false,
            msg: 'Error creando el evento'
        });
    }



}

const updateEvent = async(req, res) => {

    const object = req.body;
    const uid = req.params.id;

    try {

        const existe = await Event.findById(uid);


        if (!existe) {
            return res.status(400).json({
                ok: false,
                msg: 'El evento no existe'
            });
        } 
        
        //town1 es el pueblo que tiene actualmente el evento

        const town1 = await Town.findById(existe.town);

        if(!town1){
            return res.status(400).json({
                ok: false,
                msg: 'La ciudad no existe'
            });
        }

        console.log(town1);

        if(object.town.toString() != existe.town.toString()){
            console.log('Entro: el pueblo es: ', existe.town);
            //town2 es el pueblo que ahora mismo no tiene el evento y por el que lo queremos sustituir.
            const town2 = await Town.findById(object.town);
            
            if(!town2){
                return res.status(400).json({
                    ok: false,
                    msg: 'La ciudad no existe'
                });
            }
            //aqui procedemos a hacer el cambio de pueblos para el evento.
            await town1.events.remove(existe._id);
            await town1.save();
            await town2.events.push(existe._id);
            await town2.save();
        }

        const event = await Event.findByIdAndUpdate(uid, object, { new: true });

        res.json({
            ok: true,
            msg: 'this event has been modified',
            event
        });


    } catch (error) {

        return res.status(400).json({
            ok: false,
            msg: 'Error modificando el evento'
        });

    }


}

const deleteEvent = async(req, res) => {
    const uid = req.params.id;

    try {

        const existe = await Event.findById(uid);

        if (!existe) {
            return res.status(400).json({
                ok: true,
                msg: 'El evento no existe'
            });

        }

        const town = await Town.findById(existe.town);

        if(town){
            await town.events.remove(existe._id);
            await town.save();
        }

        if(existe.pictures.length > 0){
            const path = `${process.env.PATH_UPLOAD}/fotoevento`;
            for (let i = 0; i < existe.pictures.length; i++){
                const path_file = `${path}/${existe.pictures[i]}`;
                if(fs.existsSync(path_file)){
                    fs.unlinkSync(path_file);
                }
            }
        }

        const resultado = await Event.findByIdAndRemove(uid);

        res.json({

            ok: true,
            msg: 'the event has been deleted',
            resultado: resultado

        });


    } catch (error) {
        console.log(error);

        return res.status(400).json({
            ok: false,
            msg: 'error deleting the event'
        })
    }

}
module.exports = { deleteEvent, updateEvent, createEvent, getEvents };