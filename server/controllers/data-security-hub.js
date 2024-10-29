const { executeQuery } = require('../connect/mysql');
const fs = require('fs');
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

    // Consulta para criar um novo backup
    async createBackup(backupData) {
        const query = `
            INSERT INTO bkp_data (name, date, size, status, location, file_count, file_format, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            backupData.name,
            backupData.date,
            backupData.size,
            backupData.status,
            backupData.location,
            backupData.file_count,
            backupData.file_format,
            backupData.description,
        ];
        const result = await executeQuery(query, values);
        return { id: result.insertId, ...backupData };
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

    // Função para gerar backups diários simulados
    async generateDailyBackups() {
        let currentDate = new Date('2024-01-01T18:30:00');  // Data inicial
        const endDate = new Date('2024-10-29T18:30:00');    // Data final
    
        const initialSize = 0.2; // Tamanho inicial em janeiro (200 MB)
        const finalSize = 4.8; // Tamanho final em outubro (4.8 TB)
        const totalDays = (endDate - currentDate) / (1000 * 60 * 60 * 24); // Número total de dias entre as datas
        const dailyIncrement = (finalSize - initialSize) / totalDays; // Incremento diário para o tamanho
    
        const statusOptions = ['Complete', 'Incomplete', 'Failed'];  // Status variados
        const fileCountRange = Array.from({ length: 100 }, (_, i) => i * 5 + 10); // Quantidade de arquivos variada por backup (10 a 600)
    
        const errorReasons = {
            'Incomplete': "Backup incompleto devido a uma interrupção inesperada.",
            'Failed': "Falha no backup devido a erro de conexão com o servidor de armazenamento."
        };
    
        let size = initialSize; // Inicia o tamanho com o valor inicial
    
        while (currentDate <= endDate) {
            const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
            const fileCount = fileCountRange[Math.floor(Math.random() * fileCountRange.length)];
    
            const description = status === 'Complete' 
                ? `Backup diário contendo ${fileCount} arquivos atualizados até ${currentDate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}.`
                : errorReasons[status];
    
            const backupData = {
                name: `Backup ${currentDate.toISOString().split('T')[0]}`,
                date: currentDate.toISOString().replace('T', ' ').slice(0, 19),
                size: parseFloat(size.toFixed(2)),
                status: status,
                location: `C:\\BACKUP-SIRIUS\\BACKUPS\\Backup_${currentDate.toISOString().split('T')[0]}.zip`,
                file_count: fileCount,
                file_format: 'zip',
                description: description
            };
    
            const backup = await this.createBackup(backupData);
    
            await this.generateBackupFiles(backup.id, fileCount);
    
            size += dailyIncrement;
            currentDate.setDate(currentDate.getDate() + 1);
        }
    
        console.log("Backups simulados gerados com sucesso de janeiro a outubro de 2024.");
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

// dataSecurityHub.generateDailyBackups()

module.exports = {
    dataSecurityHub,
};
