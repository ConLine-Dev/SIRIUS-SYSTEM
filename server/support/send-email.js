const nodemailer = require('nodemailer');
require('dotenv/config');

// Função para enviar email
async function sendEmail(recipient,subject, htmlContent) {
    // Configura o transporte de email usando as variáveis de ambiente
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
        auth: {
            user: process.env.EMAIL_USER, // usuário do email
            pass: process.env.EMAIL_PASS,  // senha do email
        },
    });

    // Opções do email
    let mailOptions = {
        from: process.env.EMAIL_USER,  // remetente
        to: recipient,                // destinatário
        subject: subject, // assunto do email
        html: htmlContent,            // corpo do email em HTML
    };

    try {
        // Envia o email
        let info = await transporter.sendMail(mailOptions);
        console.log('Email enviado: %s', info.messageId);
    } catch (error) {
        console.error('Erro ao enviar email: ', error);
    }
}


module.exports = {sendEmail};