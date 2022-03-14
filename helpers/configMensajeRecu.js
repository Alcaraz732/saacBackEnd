const nodemailer = require('nodemailer');
const dominioo = process.env.DOMAIN;

module.exports = (recuperacion) => {
    var transporter = nodemailer.createTransport({
        hhost: 'smtp.gmail.com',
        port: 465,
        tls: {
            rejectUnauthorized: false
        },
        secure: true,
        service: 'gmail',
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_ACCOUNT, // Cambialo por tu email
            pass: process.env.PASSWORD_ACCOUNT // Cambialo por tu password
        }
    });
    const mailOptions = {
        from: `"Towny-Halfy Studio"" <studiohalfy@gmail.com>`,
        to: recuperacion.email, // Cambia esta parte por el destinatario
        subject: "Cambio de contraseña " + recuperacion.name,
        html: `
        <strong> Usuario con e-mail ${recuperacion.email} <br/>
        <p> Para cambiar restablecer su contraseña haga click en el siguiente enlace </p>
        <a href="${dominioo}/recovery/${recuperacion.uid}">Recuperar contraseña</a>
 `
    };
    transporter.sendMail(mailOptions, function(err, info) {
        if (err)
            console.log(err)
        else
            console.log(info);
    });
}