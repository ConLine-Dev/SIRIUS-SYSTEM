// Templates de email gerais do sistema Sirius
const emailCustom = {
    generate: async function(data) {
        return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Personalizado</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e9ecef; border-top: none; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 28px;">
                        ${data.title || 'Email do Sistema'}
                    </h1>
                </div>
                
                <div class="content">
                    ${data.content || 'Conteúdo do email'}
                </div>
                
                <div class="footer">
                    <p style="margin: 0; color: #6c757d; font-size: 14px;">
                        Este email foi gerado automaticamente pelo sistema Sirius System
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
};

module.exports = {
    emailCustom
}; 