const nodemailer = require('nodemailer');
require('dotenv/config');

// Função para enviar email
async function sendEmail(recipient, subject, htmlContent) {
    const transporter = nodemailer.createTransport({
        name: 'no-reply@conline-news.com',
        host: process.env.SMTP_HOST,
        service: process.env.SMTP_HOST,
        port: 465,
        secure: true,
        pool: false,
        rateDelta: 1000,
        rateLimit: 1000,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        debug: true
    });

    const mailOptions = {
        from: `Sirius OS <sirius@conline-news.com>`,
        to: recipient,  // Aqui vão todos os e-mails do array
        // to: `petryck.leite@conlinebr.com.br`,
        subject: subject,
        html: htmlContent
    };

    // Envia o e-mail para o destinatário atual
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email enviado com sucesso:', info.response);
        return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        return { success: false, error: error.message };
    }

}

module.exports = {sendEmail};



