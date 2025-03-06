const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const gTTS = require('gtts');

const setIO = (io) => {
    router.post('/convert', async (req, res) => {
        try {
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ error: 'Texto não fornecido' });
            }
    
            // Cria um ID único para o arquivo
            const fileId = uuidv4();
            const outputPath = path.join(__dirname, '..', '..', 'uploads', 'audio');
            const outputFile = path.join(outputPath, `${fileId}.mp3`);
    
            // Garante que o diretório existe
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath, { recursive: true });
            }
    
            // Cria uma nova instância do gTTS com configurações otimizadas
            const gtts = new gTTS(text, 'pt-br');
    
            // Converte o texto para áudio e salva como MP3
            await new Promise((resolve, reject) => {
                gtts.save(outputFile, (err) => {
                    if (err) {
                        console.error('Erro ao gerar áudio:', err);
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
    
            // Lê o arquivo para garantir que foi gerado corretamente
            const fileStats = fs.statSync(outputFile);
            if (fileStats.size === 0) {
                throw new Error('Arquivo de áudio gerado está vazio');
            }
    
            // Envia o arquivo de áudio
            res.sendFile(outputFile, (err) => {
                if (err) {
                    console.error('Erro ao enviar arquivo:', err);
                }
                // Remove o arquivo de áudio após envio
                try {
                    fs.unlinkSync(outputFile);
                } catch (unlinkError) {
                    console.error('Erro ao remover arquivo temporário:', unlinkError);
                }
            });
    
        } catch (error) {
            console.error('Erro:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });

    return router;
};

module.exports = setIO; 