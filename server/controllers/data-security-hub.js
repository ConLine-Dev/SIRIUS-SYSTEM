const { executeQuery } = require('../connect/mysql');
const fs = require('fs');
const cron = require('node-cron');
const path = require('path');

const dataSecurityHub = {
    
    // Consulta para listar todos os backups
    async listBackups() {
        const query = 'SELECT * FROM bkp_data';
        return executeQuery(query);
    },

    // Consulta para obter detalhes de um backup específico
    async getBackupDetails(backupId) {
        const query = `
            SELECT b.*, bf.file_name, bf.file_size, bf.version, bf.last_modified 
            FROM bkp_data b
            LEFT JOIN bkp_files bf ON bf.backup_id = b.id
            WHERE b.id = ?`;
        return executeQuery(query, [backupId]);
    },

    // Consulta para deletar um backup
    async deleteBackup(backupId) {
        const query = 'DELETE FROM bkp_data WHERE id = ?';
        return executeQuery(query, [backupId]);
    },

    // Consulta para listar todos os destinos de backup
    async listDestinations() {
        const query = 'SELECT * FROM bkp_destinations';
        return executeQuery(query);
    },


    // Função para criar um novo backup no banco
    async createBackup(backupData) {
        const query = `
            INSERT INTO bkp_data (name, date, size, status, location, file_count, file_format, description, completion_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            backupData.name,
            backupData.date,
            backupData.size,
            backupData.status,
            backupData.location,
            backupData.file_count,
            backupData.file_format,
            backupData.description,
            backupData.completion_time
        ];
        const result = await executeQuery(query, values);
        return { id: result.insertId, ...backupData };
    },
    
   // Função para gerar backups diários até a data de hoje -1
    async generateDailyBackups() {
        let currentDate = new Date('2024-01-01T00:00:00'); // Data inicial
        const today = new Date();
        today.setDate(today.getDate() - 1); // Data final: hoje - 1

        const initialSize = 0.2; // Tamanho inicial em janeiro (200 MB)
        const finalSize = 6.5; // Tamanho final em outubro (4.8 TB)
        const totalDays = (today - currentDate) / (1000 * 60 * 60 * 24); // Número total de dias entre as datas
        const dailyIncrement = (finalSize - initialSize) / totalDays; // Incremento diário para o tamanho

        const statusWeights = { 'Complete': 70, 'Incomplete': 20, 'Failed': 10 }; // Probabilidades ajustadas
        const fileCountRange = Array.from({ length: 100 }, (_, i) => i * 5 + 10); // Quantidade de arquivos variada por backup (10 a 600)

        const errorReasons = {
            'Incomplete': "Backup incompleto devido a uma interrupção inesperada.",
            'Failed': "Falha no backup devido a erro de conexão com o servidor de armazenamento."
        };

        let size = initialSize; // Inicia o tamanho com o valor inicial

        while (currentDate <= today) {
            const backupDate = currentDate.toISOString().split('T')[0];
      
            // Ajusta o horário para 18:30
            currentDate.setHours(18, 30, 0, 0);

            // Verifica se o backup já existe no banco
            const existingBackup = await this.checkBackupExists(backupDate);
            if (existingBackup) {
                // console.log(`Backup já existe para ${backupDate}.`);
            } else {
                let status = this.getWeightedStatus(statusWeights); // Determina o status baseado nas probabilidades
                let attempts = 0;

                do {
                    attempts++;
                    const fileCount = fileCountRange[Math.floor(Math.random() * fileCountRange.length)];

                    // Cálculo do tempo estimado do backup
                    const backupSizeMB = size * 1024 * 1024; // Converte tamanho de TB para MB
                    const transferRateMBps = 12.5; // Velocidade da internet (MB/s) 100 Mbps → 12.5 MB/s
                    const estimatedTimeSeconds = Math.ceil(backupSizeMB / transferRateMBps); // Tempo total em segundos
                    const startTime = new Date(currentDate);
                    const endTime = new Date(startTime.getTime() + estimatedTimeSeconds * 1000);

                    const description = status === 'Complete'
                        ? `Backup diário contendo ${fileCount} arquivos atualizados até ${currentDate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}.`
                        : errorReasons[status];

                    const backupData = {
                        name: `Backup ${backupDate} - Tentativa ${attempts}`,
                        date: startTime.toISOString().replace('T', ' ').slice(0, 19),
                        size: parseFloat(size.toFixed(2)),
                        status: status,
                        location: `C:\\BACKUP-SIRIUS\\BACKUPS\\Backup_${backupDate}_Tentativa${attempts}.zip`,
                        file_count: fileCount,
                        file_format: 'zip',
                        description: description,
                        completion_time: endTime.toISOString().replace('T', ' ').slice(0, 19)
                    };

                    const backup = await this.createBackup(backupData);

                    await this.generateBackupFiles(backup.id, fileCount);

                    // Caso a tentativa tenha sucesso, não haverá mais repetições
                    if (status === 'Complete') break;

                    // Define o status para a próxima tentativa
                    status = 'Complete'; // Simula que as tentativas subsequentes têm maior probabilidade de sucesso
                } while (attempts < 3);

                // console.log(`Backup criado para ${backupDate}.`);
            }

            size += dailyIncrement;
            currentDate.setDate(currentDate.getDate() + 1); // Incrementa para o próximo dia
            currentDate.setHours(0, 0, 0, 0); // Reseta o horário para evitar acúmulo
        }

        // console.log("Backups diários gerados até o dia anterior à data atual.");
    },

    // Função para verificar se um backup já existe no banco de dados
async checkBackupExists(date) {
    const query = `SELECT COUNT(*) as count FROM bkp_data WHERE DATE(date) = ?`;
    const result = await executeQuery(query, [date]);
    return result[0].count > 0;
},

    // Função utilitária para determinar o status com base em probabilidades
    getWeightedStatus(weights) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        const random = Math.random() * totalWeight;
        let cumulative = 0;

        for (const [status, weight] of Object.entries(weights)) {
            cumulative += weight;
            if (random < cumulative) return status;
        }

        return 'Complete'; // Fallback
    },
    // Função para gerar arquivos de backup e inseri-los na tabela `bkp_files`
    async generateBackupFiles(backupId, fileCount) {
        const filePath = './2024-01-09 10-54-4.log';
        const exampleFiles = await dataSecurityHub.parseLogFile(filePath);
        
        for (let i = 0; i < fileCount; i++) {
            const example = exampleFiles[i % exampleFiles.length];
            const fileData = {
                backup_id: backupId,
                file_name: `${example.name.split('.')[0]}_v${i + 1}.${example.name.split('.')[1]}`,
                file_size: example.size,
                version: i + 1,
                last_modified: example.lastModified
            };
            await this.createBackupFile(fileData);
        }
    },

    // Função para criar um novo arquivo de backup na tabela `bkp_files`
    async createBackupFile(fileData) {
        const query = `
            INSERT INTO bkp_files (backup_id, file_name, file_size, version, last_modified)
            VALUES (?, ?, ?, ?, ?)`;
        const values = [
            fileData.backup_id,
            fileData.file_name,
            fileData.file_size,
            fileData.version,
            fileData.last_modified,
        ];
        await executeQuery(query, values);
    },

    async parseLogFile(filePath) {
        const filesArray = [];
    
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const lines = data.split('\n');
            
            lines.forEach(line => {
                const [destinationPart, sourcePart] = line.split(" was copied from ");
                
                if (destinationPart && sourcePart) {
                    const destinationPath = destinationPart.trim();
                    const fileName = path.basename(destinationPath);
                    const lastModified = sourcePart.split(" at ")[1].trim();
                    const fileSize = (Math.random() * (5.0 - 0.1) + 0.1).toFixed(2);
                    
                    filesArray.push({
                        name: fileName,
                        path: destinationPath,
                        size: parseFloat(fileSize),
                        lastModified
                    });
                }
            });
    
            return filesArray;
        } catch (error) {
            console.error("Erro ao ler o arquivo:", error);
            return [];
        }
    }
};


// cron.schedule('30 18 * * *', async () => {
//     dataSecurityHub.generateDailyBackups();
// });

setTimeout(() => {
    dataSecurityHub.generateDailyBackups();
}, 1000 * 60 * 60 * 24);

module.exports = {
    dataSecurityHub,
};
