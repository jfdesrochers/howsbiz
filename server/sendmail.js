const nodemailer = require('nodemailer');
const env = require('../env.json')

/* Expected mail options
let mailOptions = {
    from: '"How\'s Biz par J-F Desrochers" <' + env.GMAILADDR + '>', // sender address
    to: 'jfdesrochers@gmail.com', // list of receivers
    subject: 'Vos mises à jour How\'s Biz', // Subject line
    text: 'Hello world ?', // plain text body
    html: '<b>Hello world ?</b>' // html body
};
*/

const sendMail = function(mailOptions) {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: env.GMAILUSER,
            pass: env.GMAILPASS
        }
    });

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
}

module.exports = sendMail