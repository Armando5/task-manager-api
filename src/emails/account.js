const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'armandosita96@gmail.com',
        subject: 'Thanks for joining in',
        text: `Welcome to the app ${name}.`
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'armandosita96@gmail.com',
        subject: 'See you',
        text: `Goodbye ${name}. Hope i see you soon.`
    })
}
module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}