const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const connection = mysql.createPool({
    host: 'sql11.freemysqlhosting.net', // Your connection adress (localhost).
    user: 'sql11478894', // Your database's username.
    password: 'E7BaYgzlqf', // Your database's password.
    database: 'sql11478894' // Your database's name.
});

// Starting our app.
const app = express();


app.get('/botones', function(req, res) {
    // Connecting to the database.
    connection.getConnection(function(err, connection) {

        // Executing the MySQL query (select all data from the 'users' table).
        connection.query('SELECT * FROM boton', function(error, results, fields) {
            // If some error occurs, we throw an error.
            if (error) throw error;

            // Getting the 'response' from the database and sending it to our route. This is were the data is.
            res.send(results)
        });
    });
});

// Starting our server.
app.listen(process.env.PORT, () => {
    console.log('Go to http://localhost:3000/botones so you can see the data.');
});