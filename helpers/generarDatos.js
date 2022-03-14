// Generador de identificadores únicos para campos que sean unique
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
//Para generar contraseña
const bcrypt = require('bcryptjs');

// Incluir los models que necesitemos para almacenar datos

// Cargar el archivo de configuración
// dentro de config() pasamos el path (la ruta) donde está el archivo .env
require('dotenv').config({ path: '../.env' });

// Cargamos nuestra librería de conexión a la BD, con la ruta adecuada
const { dbConnection } = require('../database/configdb');
const user = require('../models/user');
const review = require('../models/review');
const place = require('../models/place');
const route = require('../models/travel');
const travel = require('../models/travel');
const Town = require('../models/town');
const event = require('../models/event');
const Place = require('../models/place');
const Province = require('../models/province');
const { response } = require('express');
const fs = require('fs');
const User = require('../models/user');
const province = require('../models/province');
dbConnection();

var tipo = process.argv[2];

console.log(tipo);


// Creamo una función que genere y almacene datos
const crearUsuarios = async() => {

    // Declaramos variso arrays con datos estáticos, listas de nombres, direcciones, tipos, etc que vamos a utilizar
    const nombres = ["Maria", "Mario", "Adrián", "Pedro", "Pepe", "Juan", "Alfredo", "Paula"]
    const rol = "ROL_USER";
    const active = true;


    // A partir de los arrays anteriores, eligiendo posiciones al azar para extrar un nombr, direccion, etc
    for (var i = 0; i < 20; i++) {
        const nombre = nombres[Math.floor((Math.random() * (nombres.length - 1)))];
        const numero = Math.floor(Math.random() * (10000 - 1) + 1);

        const salt = bcrypt.genSaltSync();
        const pass = nombres[Math.floor((Math.random() * (nombres.length - 1)))];
        const cpassword = bcrypt.hashSync(pass, salt);

        const ema = nombre + numero + "@gmail.com";


        // Generar fechas aleatorias, a partir del día de hoy
        let fecha = new Date(Date.now());
        let fechaVieja = new Date(2021, 0, 1);

        let fechaFinal = new Date(fecha.getTime() + Math.random() * (fechaVieja.getTime() - fecha.getTime()));


        // Construimos un objeto con la estructura que espera el modelo y los datos generados
        const datos = {
            name: nombre,
            email: ema,
            password: cpassword,
            rol: rol,
            active: active,
            registerDate: fechaFinal,
        };

        // Lo imprimimos por pantalla
        console.log(datos);
        // Creamos un objeto de moongose del modelo con los datos a guardar
        const nuevoUsu = new user(datos);
        // Guardamos en BD
        await nuevoUsu.save();

        if (i == 19 && tipo == "todo") {
            crearProvincias();
        }

    }

}

const crearPueblos = async() => {
    var http = require("https");

    var key = '226ee96dd19c3f5da3709b3c818f4b365a66121f229e14b46304e098ea81bb90';
    var options = {
        "method": "GET",
        "hostname": "apiv1.geoapi.es",
        "path": "https://apiv1.geoapi.es/municipios?CPRO=01&key=" + key,
        "headers": {
            "cache-control": "no-cache"
        }
    };
    // console.log(options);

    for (let i = 0; i < 15; i++) {

        var num = Math.floor(Math.random() * (52 - 0)) + 0;
        if (num < 10) { num = "0" + num; }

        console.log("CODIGO RANDOM PROVINCIA: ",num)

        const province = await Province.findOne({ cod: num });

        console.log("PROVINCIA PARA EL PUEBLO: ",province)

        options.path = "https://apiv1.geoapi.es/municipios?CPRO=" + num + "&key=" + key;
        var req = http.request(options, function(res) {
            var chunks = [];

            res.on("data", function(chunk) {
                chunks.push(chunk);
            });

            res.on("end", function() {
                var body = Buffer.concat(chunks);
                datos = JSON.parse(body);

                var pueblo = datos.data[Math.floor(Math.random() * (datos.data.length - 0)) + 0];
                //const province = await Province.findOne({ cod: pueblo.cod });
                var lon = -4.043 + (Math.random() * (5 - (-5)) + (-5));
                var lat = 40.252 + (Math.random() * (5 - (-5)) + (-5));

                console.log("PROVINCIA PARA EL PUEBLO 2: ",province)

                const data = {
                    name: pueblo.DMUN50,
                    province: province._id,
                    location: lon + ' ' + lat,

                };
                console.log(data);
                const town = new Town(data);
                town.save();


                if (i == 14 && tipo == "todo") {
                    crearLugares();
                }


            });
        });



        req.end();


    }


}

const crearValoraciones = async() => {

    let usus, total, places, totalp;



    [usus, total] = await Promise.all([user.find({}), user.countDocuments()]);
    [places, totalp] = await Promise.all([place.find({}), place.countDocuments()]);


    const valoraciones = ["Me ha gustado mucho", "Recomiendo bastante este lugar", "Me ha decepcionado la visita", "El lugar no se corresponde con lo que se ve en la página", "No recomiendo asistir"];


    //console.log(events);

    //console.log(total);
    for (let i = 0; i < 15; i++) {
        const comentario = valoraciones[Math.floor((Math.random() * (valoraciones.length - 1)))];
        let usu = Math.floor(Math.random() * (total));
        let pla = Math.floor(Math.random() * (totalp));
        console.log(usu);

        let idusu = usus[usu]._id;

        console.log("pla" + pla);

        let idpla = places[pla]._id;

        let nota = Math.floor(Math.random() * (5 + 1));

        let foto = "default.jpg";

        console.log(idusu);


        const datos = {
            comment: comentario,
            pictures: foto,
            review: nota,
            place: idpla,
            user: idusu,
        };
        const user_rvw = await user.findById(idusu);
        if (!user_rvw) {
            return false;
        }
        const place_rvw = await Place.findById(idpla);
        if (!place_rvw) return false;
        // Lo imprimimos por pantalla
        console.log(datos);
        // Creamos un objeto de moongose del modelo con los datos a guardar
        const nuevaRev = new review(datos);
        // Guardamos en BD
        await nuevaRev.save();
        //añadir al usuario la valoracion
        await user_rvw.reviews.push(nuevaRev._id);
        await user_rvw.save();
        //añadir la valoracion al array de valoraciones
        await place_rvw.reviews.push(nuevaRev._id);
        await place_rvw.save();
        if (i == 14 && tipo == "todo") {
            crearRutas();
        }
    }
}

const crearRutas = async() => {

    let usus, total, places, totalp;


    // Cogemos usuarios, lugares y sus totales.

    [usus, total] = await Promise.all([User.find({}), User.countDocuments()]);
    [places, totalp] = await Promise.all([place.find({}), place.countDocuments()]);


    const rutasDescrip = ["Increible ruta cantábrica", "Rutas de castillos por el sur de España", "Visita a todas las iglesias del este peninsular", "Ruta corta y que se hace en una mañana para ver montes increibles", "Ruta de restaurantes increibles"];
    const rutasNomb = ["La mejor ruta", "Ruta del bacalao", "Ruta Medieval", "Experiencia Inolvidable", "Ruta Bacana"];


    for (i = 0; i < 15; i++) {
        const descripcion = rutasDescrip[Math.floor((Math.random() * (rutasDescrip.length - 1)))];
        const nombre = rutasNomb[Math.floor((Math.random() * (rutasNomb.length - 1)))];

        //console.log(events);

        //console.log(total);

        let usu = Math.floor(Math.random() * (total));

        let pla = Math.floor(Math.random() * (totalp));

        let idpla = [];


        for (let j = 0; j < pla; j++) {

            let random = Math.floor(Math.random() * (totalp));
            idpla.push(places[random]._id);

        }

        console.log(usu);

        let idusu = usus[usu]._id;

        let foto = "default.jpg";

        console.log(idusu);


        const datos = {
            name: nombre,
            pictures: foto,
            description: descripcion,
            places: idpla,
            user: idusu,
        };

        if (idpla.length === 0) { return false; }

        const user = await User.findById(idusu);
        if (!user) return false;
        // Lo imprimimos por pantalla
        //console.log(datos);
        // Creamos un objeto de moongose del modelo con los datos a guardar
        const ruta = new travel(datos);
        // Guardamos en BD
        await ruta.save();
        //añadimos al usuario el viaje
        await user.travels.push(ruta._id);
        await user.save();

        if (i == 14 && tipo == "todo") {
            crearEventos();
        }

    }
}

// Creamo una función que genere y almacene eventos para pueblos
const crearEventos = async() => {

    let places, totalp;
    [places, totalp] = await Promise.all([Town.find({}), Town.countDocuments()]);

    // Declaramos varios arrays con datos estáticos, listas de nombres, direcciones, tipos, etc que vamos a utilizar
    const eventos = ["Moros y Cristianos de ", "Feria de ", "Ruta gastronómica de ", "Fiestas de ", "Día de ", "Verbena de "]
    for (let i = 0; i < 15; i++) {
        // A partir de los arrays anteriores, eligiendo posiciones al azar para extrar un nombr, direccion, etc
        const nombreEvento = eventos[Math.floor((Math.random() * (eventos.length - 1)))];

        //Elegimos un lugar
        let pla = Math.floor(Math.random() * (totalp));
        let idpla = places[pla]._id;

        const nombreEventoFinal = nombreEvento + places[pla].name;


        // Generar fechas aleatorias, a partir del día de hoy
        let fecha = new Date(Date.now());
        let fechaVieja = new Date(2021, 0, 1);
        let fechaFinal = new Date(fecha.getTime() + Math.random() * (fechaVieja.getTime() - fecha.getTime()));

        let foto = "default.jpg";

        // Construimos un objeto con la estructura que espera el modelo y los datos generados
        const datos = {
            name: nombreEventoFinal,
            pictures: foto,
            date: fechaFinal,
            description: nombreEventoFinal,
            town: idpla,
        };

        const town = await Town.findById(idpla);
        if (!town) { console.log('entro'); return false; }

        // Lo imprimimos por pantalla
        console.log(datos);
        // Creamos un objeto de moongose del modelo con los datos a guardar
        const nuevoEve = new event(datos);
        // Guardamos en BD
        await nuevoEve.save();
        //guardar evento en pueblo
        await town.events.push(nuevoEve._id);
        await town.save();

    }
}

const crearProvincias = async() => {




    console.log("antes");

    var http = require("https");

    var key = '226ee96dd19c3f5da3709b3c818f4b365a66121f229e14b46304e098ea81bb90';
    var options = {
        "method": "GET",
        "hostname": "apiv1.geoapi.es",
        "path": "https://apiv1.geoapi.es/provincias?&key=9ea5403b167b4aa881365eb5ad16f65251369c8a6365da08cfae59b75b76be87",
        "headers": {
            "cache-control": "no-cache"
        }
    };
    // console.log(options);


    var req = http.request(options, function(res) {
        console.log("entra a la peticion");
        var chunks = [];

        res.on("data", function(chunk) {
            chunks.push(chunk);
        });

        res.on("end",  async function() {
            var body = Buffer.concat(chunks);
            dates = JSON.parse(body)

            console.log(dates["data"].length);

            for (let i = 0; i < dates["data"].length; i++) {


                console.log(dates["data"][i]["PRO"]);
                const datos = {
                    name: dates["data"][i]["PRO"],
                    cod: dates["data"][i]["CPRO"],
                };

               Province.findOne({ cod: dates["data"][i]["CPRO"] }, async function(err, results){

                    if (!results) {

                        const nuevaPro = new Province(datos);
                        await nuevaPro.save();
                    }
                });

                Province.count( function(err, results){

                    if ((results == 52 || results == 51) && tipo == "todo") {
                        console.log("holaa");
                        crearPueblos();
                    }
                });

                const numero = await Province.countDocuments()

                console.log(numero)

            }



        });
    });



    req.end();




}

const crearLugares = async() => {

    console.log("lugaress");

    let users, total, towns, total_towns;

    let rol_admin = 'ROL_ADMIN';
    let rol_comerce = 'ROL_COMMERCE';

    for (var i = 0; i < 20; i++) {

        console.log("entra?")

        //comprobamos los usuarios que pueden crear un lugar y los pueblos con encanto disponibles
        let query = { $or: [{ rol: rol_admin }, { rol: rol_comerce }] };
        [users, total] = await Promise.all(
            [User.find(query), User.countDocuments()]);

        [towns, total_towns] = await Promise.all(
            [Town.find(), Town.countDocuments()]);

        if (towns.length == 0) {
            return;
        }
        if (users.length == 0) {
            return;
        }
        //seleccionamos el usuario que va a crear el lugar
        let select_user = Math.round(Math.random() * ((users.length - 1) - 0)) + 0;
        if (select_user >= users.length) {
            return;
        }
        let user_select = users[select_user];
        const user = await User.findById(user_select._id);
        if (!user) {
            return;
        }

        //seleccionamos el pueblo con encanto al que va a pertenecer el lugar creado
        let select_town = Math.round(Math.random() * ((towns.length - 1) - 0)) + 0;
        if (select_town >= towns.length) {
            return;
        }
        let town_selected = towns[select_town];
        const town = await Town.findById(town_selected._id);



        if (!town) {
            return;
        }

        //seleccionamos el tipo de lugar que va a ser el lugar.
        let tipo_lugar = ['Iglesia', 'Parque', 'Restaurante', 'Castillo', 'Supermercado', 'Monasterio', 'Bar'];

        let select_place = Math.round(Math.random() * ((tipo_lugar.length - 1) - 0) + 0);

        if (tipo_lugar.length <= select_place) {
            return false;
        }
        let tipo_lugar_escogido = tipo_lugar[select_place];
        let name_place = tipo_lugar_escogido;
        //seleccionamos el telefono del lugar
        let telefono = Math.floor(Math.random() * ((730000000) - 600000000)) + 600000000;
        let descripcion = '';
        let horario;
        //seleccionamos las coordenadas donde se va a situar el lugar
        let latitud = Math.random() * ((43.79) - 36.00083333333333) + 36.00083333333333;
        let longitud = Math.random() * ((7.008055555555556) - (-5.611111111111111)) - 5.611111111111111;

        let coords = latitud + ' ' + longitud;
        switch (tipo_lugar_escogido) {
            case 'Iglesia':
                let name_iglesia = ['del Pilar', 'de san Lorenzo', 'santa Maria', 'de san Pedro', 'de san Isidro', 'de Santiago', 'de la Purisima'];
                let select_iglesia = Math.round(Math.random() * ((name_iglesia.length - 1) - 0) + 0);
                if (name_iglesia.length <= select_iglesia) {
                    return false;
                }
                name_place += ' ' + name_iglesia[select_iglesia];
                descripcion = 'Una iglesia barroca muy bonita';
                horario = '8:00 - 13:00';
                break;

            case 'Parque':
                let name_park = ['de los patos', 'de la musica', 'del delfin', 'del retiro', 'del rollo', 'del  cid', 'del mercado'];
                let select_park = Math.round(Math.random() * ((name_park.length - 1) - 0) + 0);
                if (name_park.length <= select_park) {
                    return false;
                }
                name_place += ' ' + name_park[select_park];
                descripcion = 'Un parque muy bonito';
                horario = '24 h';
                break;

            case 'Restaurante':
                let name_rest = ['los Cuchillos', 'la Despensa', 'Rincon de Pedro', 'Venezuela', 'Pincelin', 'la Braseria', 'Asador Llorente'];
                let select_rest = Math.round(Math.random() * ((name_rest.length - 1) - 0) + 0);
                if (name_rest.length <= select_rest) {
                    return false;
                }
                name_place += ' ' + name_rest[select_rest];
                descripcion = 'Un restaurante con platos muy sabrosos y variados';
                horario = '12:00 - 16:00';
                break;

            case 'Castillo':
                let name_castle = ['de la Atalaya', 'Salvatierra', 'de Sax', 'de Santa Barbara', 'de Castalla', 'de Almansa', 'de Biar'];
                let select_castle = Math.round(Math.random() * ((name_castle.length - 1) - 0) + 0);
                if (name_castle.length <= select_castle) {
                    return false;
                }
                name_place += ' ' + name_castle[select_castle];
                descripcion = 'Un castillo del siglo XV muy bonito';
                horario = '8:00 - 13:00';
                break;

            case 'Supermercado':
                let name_supermercado = ['Mercadona', 'Mas y mas', 'Consum', 'Manolo', 'Spar', 'Dealz', 'Domti'];
                let select_super = Math.round(Math.random() * ((name_supermercado.length - 1) - 0) + 0);

                if (name_supermercado.length <= select_super) {
                    return false;
                }
                name_place += ' ' + name_supermercado[select_super];
                descripcion = 'Un supermercado con una alta gama de productos';
                horario = '8:00 - 21:00';
                break;

            case 'Monasterio':
                let name_mon = ['del Bon Xesus de Trandeiras', 'de la Santa Faz', 'del Cuervo', 'Carmelita del Desierto de las Palmas', 'de Bolarque', 'de Aula Dei', 'de las Descalzas Reales'];
                let select_monas = Math.round(Math.random() * ((name_mon.length - 1) - 0) + 0);

                if (name_mon.length <= select_monas) {
                    return false;
                }
                name_place += ' ' + name_mon[select_monas];
                descripcion = 'Un monasterio muy bonito';
                horario = '8:00 - 13:00';
                break;

            case 'Bar':
                let name_bar = ['Paco', 'Manolo', 'casa Juan', 'Granada', 'Oliva', 'la Lola', 'Miguel', 'Monterrey'];
                let select_bar = Math.round(Math.random() * ((name_bar.length - 1) - 0) + 0);

                if (name_bar.length <= select_bar) {
                    return false;
                }
                name_place += ' ' + name_bar[select_bar];
                descripcion = 'Un buen bar donde tomarse unas cervezas con los amigos o familia';
                horario = '7:00 - 16:00 | 20:00 - 24:00';
                break;

            default:
                break;
        }
        //await User.findOne({ email: email });
        const place = await Place.findOne({ name: name_place });

        if (!place) {
            console.log("i: " + i);
            console.log('Lugar existente');
            //return;

            //nombre, descripcion, telefono, horario, coordenadas, tipo, web.
            let split_web = name_place.split(' ');
            let name_web = '';
            for (let i = 0; i < split_web.length; i++) {
                name_web += split_web[i];
            }
            name_web += '.com';

            const datos = {
                name: name_place,
                location: coords,
                mobile_number: telefono,
                description: descripcion,
                //town: idpla,
                status: "Pendiente",
                type: tipo_lugar_escogido,
                web: name_web,
                schedule: horario,
                visits: 0,

            };
            // Creamos un objeto de moongose del modelo con los datos a guardar
            const newPlace = new Place(datos);
            // Guardamos en BD
            await newPlace.save();
            newPlace.status = "Pendiente";
            newPlace.user = user;
            await user.commercePlace.push(newPlace._id);
            await user.save();
            newPlace.pictures = [];
            newPlace.town = town;
            await town.places.push(newPlace._id);
            await town.save();
            //user.commercePlace = [];
            await newPlace.save();
        }
        if (i == 19 && tipo == "todo") {
            crearValoraciones();
            console.log("pasar a valoraciones");
        }
    }
}

if (tipo == "usuarios") {
    // Bucle para llamar a la función las veces que queramos, así insertamos 1 o 1000 elementos
    crearUsuarios();

} else if (tipo == "pueblos") {


    crearPueblos();




} else if (tipo == "valoraciones") {
    crearValoraciones();


} else if (tipo == "provincias") {
    crearProvincias();
} else if (tipo == "rutas") {


    crearRutas();


} else if (tipo == "eventos") {

    crearEventos();


} else if (tipo == "lugares") {

    crearLugares();

} else if (tipo == "todo") {


    crearUsuarios();




} else {
    console.log("Datos mal introducidos. Tipos: usuarios / pueblos / valoraciones / provincias / rutas / eventos / lugares / rutas / todo y cantidad > 0");
}