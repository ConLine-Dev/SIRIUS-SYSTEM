const { executeQuery } = require('../connect/mysql');

const dataSecurityHub = {
    
    // Consulta para listar todos os backups
    async listBackups() {
        const query = 'SELECT * FROM backups';
        return executeQuery(query);
    },

    // Consulta para obter detalhes de um backup específico
    async getBackupDetails(backupId) {
        const query = `
            SELECT b.*, bf.file_name, bf.file_size, bf.version, bf.last_modified 
            FROM backups b
            LEFT JOIN backup_files bf ON bf.backup_id = b.id
            WHERE b.id = ?`;
        return executeQuery(query, [backupId]);
    },

    // Consulta para criar um novo backup
    async createBackup(backupData) {
        const query = `
            INSERT INTO backups (name, date, size, status, location, file_count, file_format, description)
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
        const query = 'DELETE FROM backups WHERE id = ?';
        return executeQuery(query, [backupId]);
    },

    // Consulta para listar todos os destinos de backup
    async listDestinations() {
        const query = 'SELECT * FROM backup_destinations';
        return executeQuery(query);
    }
};

module.exports = {
    dataSecurityHub,
};
