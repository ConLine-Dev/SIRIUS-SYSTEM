const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Gera hash SHA-256 do conteúdo de um arquivo
 * @param {string} filePath - Caminho completo do arquivo
 * @returns {Promise<string>} Hash SHA-256 do arquivo
 */
async function generateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => {
      hash.update(data);
    });
    
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
    
    stream.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Gera hash SHA-256 do buffer de dados
 * @param {Buffer} buffer - Buffer com os dados do arquivo
 * @returns {string} Hash SHA-256 dos dados
 */
function generateBufferHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Gera hash combinado: file_hash + email
 * @param {string} fileHash - Hash do arquivo
 * @param {string} email - Email do candidato
 * @returns {string} Hash combinado
 */
function generateEmailHash(fileHash, email) {
  const combined = `${fileHash}:${email.toLowerCase().trim()}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Verifica se um arquivo já existe para um email específico
 * @param {string} fileHash - Hash do arquivo
 * @param {string} email - Email do candidato
 * @param {Function} executeQuery - Função para executar queries
 * @returns {Promise<boolean>} true se o arquivo já existe
 */
async function checkFileExists(fileHash, email, executeQuery) {
  try {
    const emailHash = generateEmailHash(fileHash, email);
    
    const result = await executeQuery(`
      SELECT id FROM hr_applicant_attachments 
      WHERE email_hash = ?
    `, [emailHash]);
    
    return result.length > 0;
  } catch (error) {
    console.error('Erro ao verificar arquivo existente:', error);
    return false;
  }
}

/**
 * Busca informações do arquivo existente
 * @param {string} fileHash - Hash do arquivo
 * @param {string} email - Email do candidato
 * @param {Function} executeQuery - Função para executar queries
 * @returns {Promise<Object|null>} Dados do arquivo existente ou null
 */
async function getExistingFile(fileHash, email, executeQuery) {
  try {
    const emailHash = generateEmailHash(fileHash, email);
    
    const result = await executeQuery(`
      SELECT 
        aa.id,
        aa.file_name,
        aa.file_url,
        aa.file_type,
        aa.file_size,
        aa.description,
        aa.is_resume,
        aa.created_at,
        a.name as candidate_name,
        a.email as candidate_email
      FROM hr_applicant_attachments aa
      JOIN hr_applicants a ON a.id = aa.applicant_id
      WHERE aa.email_hash = ?
    `, [emailHash]);
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Erro ao buscar arquivo existente:', error);
    return null;
  }
}

/**
 * Remove arquivo existente (físico e do banco)
 * @param {Object} existingFile - Dados do arquivo existente
 * @param {Function} executeQuery - Função para executar queries
 * @returns {Promise<boolean>} true se removido com sucesso
 */
async function removeExistingFile(existingFile, executeQuery) {
  try {
    // Remover arquivo físico
    let fileName = existingFile.file_url;
    if (fileName.includes('/storageService/hr-job-openings/')) {
      fileName = fileName.split('/').pop();
    }
    
    const filePath = path.join(__dirname, '../../storageService/hr-job-openings', fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Arquivo físico removido: ${fileName}`);
    }
    
    // Remover registro do banco
    await executeQuery(`
      DELETE FROM hr_applicant_attachments WHERE id = ?
    `, [existingFile.id]);
    
    console.log(`Registro removido do banco: ID ${existingFile.id}`);
    return true;
  } catch (error) {
    console.error('Erro ao remover arquivo existente:', error);
    return false;
  }
}

module.exports = {
  generateFileHash,
  generateBufferHash,
  generateEmailHash,
  checkFileExists,
  getExistingFile,
  removeExistingFile
}; 