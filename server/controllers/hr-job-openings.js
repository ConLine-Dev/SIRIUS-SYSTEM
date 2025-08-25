const { executeQuery, executeTransaction } = require('../connect/mysql');
const fs = require('fs');
const path = require('path');
const { 
  generateFileHash, 
  generateBufferHash, 
  generateEmailHash, 
  checkFileExists, 
  getExistingFile,
  removeExistingFile
} = require('../utils/fileHash');

// Função utilitária para remover arquivos de anexos
async function removeAttachmentFiles(attachmentIds) {
  if (!attachmentIds || attachmentIds.length === 0) return;
  
  try {
    console.log(`removeAttachmentFiles - Iniciando remoção de ${attachmentIds.length} anexos`);
    
    // Buscar informações dos anexos
    const placeholders = attachmentIds.map(() => '?').join(',');
    const attachments = await executeQuery(
      `SELECT file_url, file_name FROM hr_applicant_attachments WHERE id IN (${placeholders})`,
      attachmentIds
    );
    
    console.log(`removeAttachmentFiles - Anexos encontrados no banco:`, attachments.map(att => ({ file_url: att.file_url, file_name: att.file_name })));
    
    // Remover arquivos físicos
    for (const attachment of attachments) {
      if (attachment.file_url) {
        // Construir caminho do arquivo corretamente
        let fileName = attachment.file_url;
        
        // Se file_url contém caminho completo, extrair apenas o nome do arquivo
        if (fileName.includes('/storageService/hr-job-openings/')) {
          fileName = fileName.split('/').pop();
        }
        
        const filePath = path.join(__dirname, '../../storageService/hr-job-openings', fileName);
        
        console.log(`removeAttachmentFiles - Tentando remover: ${filePath}`);
        console.log(`removeAttachmentFiles - fileName extraído: ${fileName}`);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`✅ Arquivo removido com sucesso: ${filePath}`);
        } else {
          console.log(`❌ Arquivo não encontrado: ${filePath}`);
          
          // Verificar se o diretório existe
          const dirPath = path.dirname(filePath);
          if (fs.existsSync(dirPath)) {
            console.log(`📁 Diretório existe: ${dirPath}`);
            // Listar arquivos no diretório
            const files = fs.readdirSync(dirPath);
            console.log(`📋 Arquivos no diretório:`, files);
          } else {
            console.log(`❌ Diretório não existe: ${dirPath}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao remover arquivos de anexos:', error);
  }
}

// Função utilitária para remover arquivos de anexos usando dados salvos
async function removeAttachmentFilesFromUrls(attachmentUrls) {
  if (!attachmentUrls || attachmentUrls.length === 0) return;
  
  try {
    console.log(`removeAttachmentFilesFromUrls - Iniciando remoção de ${attachmentUrls.length} anexos`);
    
    // Remover arquivos físicos usando os dados salvos
    for (const attachment of attachmentUrls) {
      if (attachment.file_url) {
        // Construir caminho do arquivo corretamente
        let fileName = attachment.file_url;
        
        // Se file_url contém caminho completo, extrair apenas o nome do arquivo
        if (fileName.includes('/storageService/hr-job-openings/')) {
          fileName = fileName.split('/').pop();
        }
        
        const filePath = path.join(__dirname, '../../storageService/hr-job-openings', fileName);
        
        console.log(`removeAttachmentFilesFromUrls - Tentando remover: ${filePath}`);
        console.log(`removeAttachmentFilesFromUrls - fileName extraído: ${fileName}`);
        console.log(`removeAttachmentFilesFromUrls - file_name original: ${attachment.file_name}`);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`✅ Arquivo removido com sucesso: ${filePath}`);
        } else {
          console.log(`❌ Arquivo não encontrado: ${filePath}`);
          
          // Verificar se o diretório existe
          const dirPath = path.dirname(filePath);
          if (fs.existsSync(dirPath)) {
            console.log(`📁 Diretório existe: ${dirPath}`);
            // Listar arquivos no diretório
            const files = fs.readdirSync(dirPath);
            console.log(`📋 Arquivos no diretório:`, files);
          } else {
            console.log(`❌ Diretório não existe: ${dirPath}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao remover arquivos de anexos:', error);
  }
}

// Funções auxiliares para buscar nomes
async function getDepartmentName(departmentId) {
  try {
    const result = await executeQuery('SELECT name FROM hr_departments WHERE id = ?', [departmentId]);
    return result.length > 0 ? result[0].name : 'Departamento não informado';
  } catch (error) {
    console.error('Erro ao buscar nome do departamento:', error);
    return 'Departamento não informado';
  }
}

async function getLocationName(locationId) {
  try {
    const result = await executeQuery('SELECT name FROM hr_locations WHERE id = ?', [locationId]);
    return result.length > 0 ? result[0].name : 'Localização não informada';
  } catch (error) {
    console.error('Erro ao buscar nome da localização:', error);
    return 'Localização não informada';
  }
}

async function getJobIdFromApplication(applicationId) {
  try {
    const result = await executeQuery('SELECT job_id FROM hr_job_applications WHERE id = ?', [applicationId]);
    return result.length > 0 ? result[0].job_id : null;
  } catch (error) {
    console.error('Erro ao buscar job_id da aplicação:', error);
    return null;
  }
}

async function getApplicantName(applicantId) {
  try {
    const result = await executeQuery('SELECT name FROM hr_applicants WHERE id = ?', [applicantId]);
    return result.length > 0 ? result[0].name : 'Candidato não encontrado';
  } catch (error) {
    console.error('Erro ao buscar nome do candidato:', error);
    return 'Candidato não encontrado';
  }
}

// Função para limpar anexos órfãos (arquivos que existem no servidor mas não no banco)
async function cleanupOrphanedAttachments() {
  try {
    const storagePath = path.join(__dirname, '../../storageService/hr-job-openings');
    
    if (!fs.existsSync(storagePath)) {
      console.log('Diretório de anexos não existe');
      return;
    }
    
    // Buscar todos os arquivos no diretório
    const files = fs.readdirSync(storagePath);
    
    // Buscar todos os file_urls no banco
    const dbAttachments = await executeQuery('SELECT file_url FROM hr_applicant_attachments');
    const dbFileUrls = dbAttachments.map(att => {
      const url = att.file_url;
      return url.includes('/storageService/hr-job-openings/') ? url.split('/').pop() : url;
    });
    
    // Verificar arquivos órfãos
    let orphanedCount = 0;
    for (const file of files) {
      if (!dbFileUrls.includes(file)) {
        const filePath = path.join(storagePath, file);
        fs.unlinkSync(filePath);
        console.log(`Arquivo órfão removido: ${filePath}`);
        orphanedCount++;
      }
    }
    
    if (orphanedCount > 0) {
      console.log(`Limpeza concluída: ${orphanedCount} arquivos órfãos removidos`);
    } else {
      console.log('Nenhum arquivo órfão encontrado');
    }
  } catch (error) {
    console.error('Erro ao limpar anexos órfãos:', error);
  }
}

function slugify(text) {
  return (text || '')
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function generateUniquePublicId(title, excludeId = null) {
  let baseSlug = slugify(title);
  let publicId = baseSlug;
  let counter = 1;
  
  // Verificar se já existe um public_id igual
  while (true) {
    let query = 'SELECT id FROM hr_job_postings WHERE public_id = ?';
    let params = [publicId];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const existing = await executeQuery(query, params);
    
    if (existing.length === 0) {
      break; // public_id é único
    }
    
    // Se já existe, adicionar número no final
    publicId = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return publicId;
}

async function getMetaData() {
  try {
    console.log('🔍 Iniciando busca de metadados...');
    
    const [departments, locations, modalities, levels, contracts, statuses, jobs] = await Promise.all([
      executeQuery('SELECT id, name FROM hr_departments WHERE is_active = 1 ORDER BY name'),
      executeQuery('SELECT id, name FROM hr_locations WHERE is_active = 1 ORDER BY name'),
      executeQuery('SELECT id, name FROM hr_modalities ORDER BY name'),
      executeQuery('SELECT id, name FROM hr_levels ORDER BY name'),
      executeQuery('SELECT id, name FROM hr_contract_types ORDER BY name'),
      executeQuery('SELECT id, name FROM hr_application_statuses WHERE is_active = 1 ORDER BY position'),
      executeQuery(`
        SELECT 
          j.id, 
          j.title, 
          j.status, 
          j.is_active,
          j.department_id,
          j.location_id,
          j.modality_id,
          d.name as department_name,
          l.name as location_name,
          m.name as modality_name
        FROM hr_job_postings j
        INNER JOIN hr_departments d ON d.id = j.department_id AND d.is_active = 1
        INNER JOIN hr_locations l ON l.id = j.location_id AND l.is_active = 1
        INNER JOIN hr_modalities m ON m.id = j.modality_id
        WHERE j.is_active = 1
        ORDER BY j.title
      `)
    ]);
    
    console.log('✅ Consultas executadas com sucesso');
    console.log('📊 Resultados:', {
      departments: departments.length,
      locations: locations.length,
      modalities: modalities.length,
      levels: levels.length,
      contracts: contracts.length,
      statuses: statuses.length,
      jobs: jobs.length
    });
    
    // Debug: verificar vagas
    console.log('Debug - Jobs found:', jobs.length);
    jobs.forEach(job => {
      console.log(`Debug - Job: ID=${job.id}, Title="${job.title}", Department=${job.department_name}, Location=${job.location_name}, Status=${job.status}, Active=${job.is_active}`);
    });
    
    return { departments, locations, modalities, levels, contracts, statuses, jobs };
  } catch (error) {
    console.error('❌ Erro na função getMetaData:', error);
    throw error;
  }
}

exports.getMeta = async (req, res) => {
  try {
    console.log('🔍 Buscando metadados...');
    const meta = await getMetaData();
    
    // Formatar resposta para o frontend
    const response = {
      success: true,
      departments: meta.departments,
      locations: meta.locations,
      modalities: meta.modalities,
      levels: meta.levels,
      contracts: meta.contracts,
      statuses: meta.statuses,
      jobs: meta.jobs
    };
    
    console.log('✅ Metadados encontrados:', {
      departments: meta.departments.length,
      locations: meta.locations.length,
      modalities: meta.modalities.length,
      levels: meta.levels.length,
      contracts: meta.contracts.length,
      statuses: meta.statuses.length,
      jobs: meta.jobs.length
    });
    
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Erro ao buscar metadados:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno ao buscar metadados.' 
    });
  }
};

exports.listJobs = async (req, res) => {
  try {
    const {
      department_id, location_id, modality_id, level_id, contract_type_id, status, search, posted_from, posted_to
    } = req.query;

    const where = [];
    const params = [];

    if (department_id) { where.push('j.department_id = ?'); params.push(department_id); }
    if (location_id) { where.push('j.location_id = ?'); params.push(location_id); }
    if (modality_id) { where.push('j.modality_id = ?'); params.push(modality_id); }
    if (level_id) { where.push('j.level_id = ?'); params.push(level_id); }
    if (contract_type_id) { where.push('j.contract_type_id = ?'); params.push(contract_type_id); }
    if (status) { where.push('j.status = ?'); params.push(status); }
    if (search) { where.push('(j.title LIKE ? OR j.public_id LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (posted_from) { where.push('j.posted_at >= ?'); params.push(posted_from); }
    if (posted_to) { where.push('j.posted_at <= ?'); params.push(posted_to); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
      SELECT j.id, j.public_id, j.title, j.department_id, j.location_id, j.modality_id, j.level_id, j.contract_type_id,
             j.openings, j.status, j.is_active,
             DATE_FORMAT(j.posted_at, '%Y-%m-%d') AS posted_at_ymd,
             d.name AS department_name, l.name AS location_name, m.name AS modality_name,
             lv.name AS level_name, c.name AS contract_type_name,
             COALESCE(a.cnt, 0) AS applications_count
      FROM hr_job_postings j
      JOIN hr_departments d ON d.id = j.department_id
      JOIN hr_locations l ON l.id = j.location_id
      JOIN hr_modalities m ON m.id = j.modality_id
      JOIN hr_levels lv ON lv.id = j.level_id
      JOIN hr_contract_types c ON c.id = j.contract_type_id
      LEFT JOIN (
        SELECT job_id, COUNT(*) AS cnt
        FROM hr_job_applications
        GROUP BY job_id
      ) a ON a.job_id = j.id
      ${whereSql}
      ORDER BY j.posted_at DESC, j.id DESC
    `;

    const jobs = await executeQuery(sql, params);
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Erro ao listar vagas:', error);
    res.status(500).json({ message: 'Erro interno ao listar vagas.' });
  }
};

// Board de Vagas (por status)
exports.getJobsBoard = async (req, res) => {
  try {
    const rows = await executeQuery(`
      SELECT j.id, j.public_id, j.title, j.status,
             DATE_FORMAT(j.posted_at, '%Y-%m-%d') AS posted_at_ymd,
             d.name AS department_name, l.name AS location_name,
             COALESCE(a.cnt, 0) AS applications_count
      FROM hr_job_postings j
      JOIN hr_departments d ON d.id = j.department_id
      JOIN hr_locations l ON l.id = j.location_id
      LEFT JOIN (
        SELECT job_id, COUNT(*) AS cnt FROM hr_job_applications GROUP BY job_id
      ) a ON a.job_id = j.id
      ORDER BY j.posted_at DESC, j.id DESC
    `);

    const columns = [
      { key: 'Draft', name: 'Rascunho' },
      { key: 'Published', name: 'Publicado' },
      { key: 'Closed', name: 'Encerrado' },
      { key: 'Archived', name: 'Arquivado' },
    ];

    const board = columns.map(col => ({
      status: col.key,
      status_label: col.name,
      jobs: rows.filter(r => r.status === col.key)
    }));

    res.status(200).json({ success: true, board });
  } catch (error) {
    console.error('Erro ao montar board de vagas:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao buscar board.' });
  }
};

exports.updateJobStatus = async (req, res) => {
  try {
    const { job_id, to_status } = req.body;
    const allowed = ['Draft','Published','Closed','Archived'];
    if (!allowed.includes(to_status)) return res.status(400).json({ message: 'Status inválido' });
    const result = await executeQuery('UPDATE hr_job_postings SET status = ? WHERE id = ?', [to_status, job_id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Vaga não encontrada' });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar status da vaga:', error);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const jobs = await executeQuery(`
      SELECT j.*, 
             DATE_FORMAT(j.posted_at, '%Y-%m-%d') AS posted_at_ymd,
             d.name AS department_name, l.name AS location_name, m.name AS modality_name,
             lv.name AS level_name, c.name AS contract_type_name
      FROM hr_job_postings j
      JOIN hr_departments d ON d.id = j.department_id
      JOIN hr_locations l ON l.id = j.location_id
      JOIN hr_modalities m ON m.id = j.modality_id
      JOIN hr_levels lv ON lv.id = j.level_id
      JOIN hr_contract_types c ON c.id = j.contract_type_id
      WHERE j.id = ?
      LIMIT 1
    `, [id]);

    if (!jobs || jobs.length === 0) return res.status(404).json({ message: 'Vaga não encontrada.' });

    const [responsibilities, requirements, niceToHave, benefits] = await Promise.all([
      executeQuery('SELECT position, text FROM hr_job_responsibilities WHERE job_id = ? ORDER BY position', [id]),
      executeQuery('SELECT position, text FROM hr_job_requirements WHERE job_id = ? ORDER BY position', [id]),
      executeQuery('SELECT position, text FROM hr_job_nice_to_have WHERE job_id = ? ORDER BY position', [id]),
      executeQuery('SELECT position, text FROM hr_job_benefits WHERE job_id = ? ORDER BY position', [id])
    ]);

    // Extrair apenas os textos dos arrays de objetos
    const responsibilitiesTexts = responsibilities.map(r => r.text);
    const requirementsTexts = requirements.map(r => r.text);
    const niceToHaveTexts = niceToHave.map(n => n.text);
    const benefitsTexts = benefits.map(b => b.text);

    res.status(200).json({ 
      ...jobs[0], 
      responsibilities: responsibilitiesTexts, 
      requirements: requirementsTexts, 
      niceToHave: niceToHaveTexts, 
      benefits: benefitsTexts 
    });
  } catch (error) {
    console.error('Erro ao obter vaga por ID:', error);
    res.status(500).json({ message: 'Erro interno ao obter vaga.' });
  }
};

exports.getPublicList = async (req, res) => {
  try {
    const { department_id, location_id, modality_id, level_id, contract_type_id, search } = req.query;

    const where = ["j.status = 'Published'", 'j.is_active = 1'];
    const params = [];

    if (department_id) { where.push('j.department_id = ?'); params.push(department_id); }
    if (location_id) { where.push('j.location_id = ?'); params.push(location_id); }
    if (modality_id) { where.push('j.modality_id = ?'); params.push(modality_id); }
    if (level_id) { where.push('j.level_id = ?'); params.push(level_id); }
    if (contract_type_id) { where.push('j.contract_type_id = ?'); params.push(contract_type_id); }
    if (search) { where.push('j.title LIKE ?'); params.push(`%${search}%`); }

    const whereSql = `WHERE ${where.join(' AND ')}`;

    const sql = `
      SELECT j.public_id, j.title, j.openings, DATE_FORMAT(j.posted_at, '%Y-%m-%d') AS posted_at_ymd,
             d.name AS department, l.name AS location, m.name AS modality,
             lv.name AS level, c.name AS contract
      FROM hr_job_postings j
      JOIN hr_departments d ON d.id = j.department_id
      JOIN hr_locations l ON l.id = j.location_id
      JOIN hr_modalities m ON m.id = j.modality_id
      JOIN hr_levels lv ON lv.id = j.level_id
      JOIN hr_contract_types c ON c.id = j.contract_type_id
      ${whereSql}
      ORDER BY j.posted_at DESC, j.id DESC
    `;

    const jobs = await executeQuery(sql, params);
    res.status(200).json({ success: true, jobs });
  } catch (error) {
    console.error('Erro ao listar vagas públicas:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao listar vagas públicas.' });
  }
};

exports.getPublicByPublicId = async (req, res) => {
  try {
    const { public_id } = req.params;

    const jobs = await executeQuery(`
      SELECT j.public_id, j.title, j.description, j.openings, DATE_FORMAT(j.posted_at, '%Y-%m-%d') AS posted_at_ymd,
             d.name AS department, l.name AS location, m.name AS modality,
             lv.name AS level, c.name AS contract
      FROM hr_job_postings j
      JOIN hr_departments d ON d.id = j.department_id
      JOIN hr_locations l ON l.id = j.location_id
      JOIN hr_modalities m ON m.id = j.modality_id
      JOIN hr_levels lv ON lv.id = j.level_id
      JOIN hr_contract_types c ON c.id = j.contract_type_id
      WHERE j.public_id = ? AND j.status = 'Published' AND j.is_active = 1
      LIMIT 1
    `, [public_id]);

    if (!jobs || jobs.length === 0) return res.status(404).json({ message: 'Vaga não encontrada.' });
    
    const job = jobs[0];

    const [responsibilities, requirements, niceToHave, benefits] = await Promise.all([
      executeQuery('SELECT position, text FROM hr_job_responsibilities r JOIN hr_job_postings j ON j.id = r.job_id WHERE j.public_id = ? ORDER BY position', [public_id]),
      executeQuery('SELECT position, text FROM hr_job_requirements r JOIN hr_job_postings j ON j.id = r.job_id WHERE j.public_id = ? ORDER BY position', [public_id]),
      executeQuery('SELECT position, text FROM hr_job_nice_to_have r JOIN hr_job_postings j ON j.id = r.job_id WHERE j.public_id = ? ORDER BY position', [public_id]),
      executeQuery('SELECT position, text FROM hr_job_benefits r JOIN hr_job_postings j ON j.id = r.job_id WHERE j.public_id = ? ORDER BY position', [public_id])
    ]);

    // Extrair apenas os textos dos arrays de objetos
    const responsibilitiesTexts = responsibilities.map(r => r.text);
    const requirementsTexts = requirements.map(r => r.text);
    const niceToHaveTexts = niceToHave.map(n => n.text);
    const benefitsTexts = benefits.map(b => b.text);

    res.status(200).json({ 
      ...job, 
      responsibilities: responsibilitiesTexts, 
      requirements: requirementsTexts, 
      niceToHave: niceToHaveTexts, 
      benefits: benefitsTexts 
    });
  } catch (error) {
    console.error('Erro ao obter vaga pública:', error);
    res.status(500).json({ message: 'Erro interno ao obter vaga pública.' });
  }
};

exports.createJob = async (req, res) => {
  const {
    public_id, title, department_id, location_id, modality_id, level_id, contract_type_id,
    openings, posted_at, description,
    responsibilities = [], requirements = [], niceToHave = [], benefits = []
  } = req.body;

  try {
    await executeTransaction(async (conn) => {
      // Gerar public_id único
      const uniquePublicId = await generateUniquePublicId(title);

      // Validar campos obrigatórios
      if (!title || !department_id || !location_id || !modality_id || !level_id || !contract_type_id || !posted_at) {
        return res.status(400).json({ 
          message: 'Todos os campos obrigatórios devem ser preenchidos: título, departamento, localização, modalidade, nível, tipo de contrato e data de publicação.' 
        });
      }

      const insertJob = await conn.query(`
        INSERT INTO hr_job_postings (
          public_id, title, department_id, location_id, modality_id, level_id, contract_type_id,
          openings, posted_at, description, status, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        uniquePublicId, title, department_id, location_id, modality_id, level_id, contract_type_id,
        openings || 1, posted_at, description || null, 'Draft', 1
      ]);

      const jobId = insertJob[0].insertId;

      if (Array.isArray(responsibilities) && responsibilities.length > 0) {
        const values = responsibilities.map((text, idx) => [jobId, idx + 1, text]);
        await conn.query('INSERT INTO hr_job_responsibilities (job_id, position, text) VALUES ?', [values]);
      }
      if (Array.isArray(requirements) && requirements.length > 0) {
        const values = requirements.map((text, idx) => [jobId, idx + 1, text]);
        await conn.query('INSERT INTO hr_job_requirements (job_id, position, text) VALUES ?', [values]);
      }
      if (Array.isArray(niceToHave) && niceToHave.length > 0) {
        const values = niceToHave.map((text, idx) => [jobId, idx + 1, text]);
        await conn.query('INSERT INTO hr_job_nice_to_have (job_id, position, text) VALUES ?', [values]);
      }
      if (Array.isArray(benefits) && benefits.length > 0) {
        const values = benefits.map((text, idx) => [jobId, idx + 1, text]);
        await conn.query('INSERT INTO hr_job_benefits (job_id, position, text) VALUES ?', [values]);
      }

      // Emitir evento Socket.IO para nova vaga criada
      if (req.io) {
        req.io.emit('hr:job_created', {
          job_id: jobId,
          public_id: uniquePublicId,
          title: title,
          status: 'Draft',
          department_name: await getDepartmentName(department_id),
          location_name: await getLocationName(location_id),
          posted_at: posted_at
        });
      }

      res.status(201).json({ id: jobId, public_id: uniquePublicId, message: 'Vaga criada com sucesso.' });
    });
  } catch (error) {
    console.error('Erro ao criar vaga:', error);
    res.status(500).json({ message: 'Erro interno ao criar vaga.' });
  }
};

exports.updateJob = async (req, res) => {
  const { id } = req.params;
  const {
    public_id, title, department_id, location_id, modality_id, level_id, contract_type_id,
    openings, posted_at, description,
    responsibilities = [], requirements = [], niceToHave = [], benefits = []
  } = req.body;

  try {
    await executeTransaction(async (conn) => {
      // Gerar public_id único (excluindo o ID atual para atualizações)
      const uniquePublicId = await generateUniquePublicId(title, id);

      // Validar campos obrigatórios
      if (!title || !department_id || !location_id || !modality_id || !level_id || !contract_type_id || !posted_at) {
        return res.status(400).json({ 
          message: 'Todos os campos obrigatórios devem ser preenchidos: título, departamento, localização, modalidade, nível, tipo de contrato e data de publicação.' 
        });
      }

      const [updateResult] = await conn.query(`
        UPDATE hr_job_postings SET
          public_id = ?, title = ?, department_id = ?, location_id = ?, modality_id = ?, level_id = ?, contract_type_id = ?,
          openings = ?, posted_at = ?, description = ?
        WHERE id = ?
      `, [
        uniquePublicId, title, department_id, location_id, modality_id, level_id, contract_type_id,
        openings || 1, posted_at, description || null,
        id
      ]);

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ message: 'Vaga não encontrada para atualização.' });
      }

      await conn.query('DELETE FROM hr_job_responsibilities WHERE job_id = ?', [id]);
      await conn.query('DELETE FROM hr_job_requirements WHERE job_id = ?', [id]);
      await conn.query('DELETE FROM hr_job_nice_to_have WHERE job_id = ?', [id]);
      await conn.query('DELETE FROM hr_job_benefits WHERE job_id = ?', [id]);

      if (Array.isArray(responsibilities) && responsibilities.length > 0) {
        const values = responsibilities.map((text, idx) => [id, idx + 1, text]);
        await conn.query('INSERT INTO hr_job_responsibilities (job_id, position, text) VALUES ?', [values]);
      }
      if (Array.isArray(requirements) && requirements.length > 0) {
        const values = requirements.map((text, idx) => [id, idx + 1, text]);
        await conn.query('INSERT INTO hr_job_requirements (job_id, position, text) VALUES ?', [values]);
      }
      if (Array.isArray(niceToHave) && niceToHave.length > 0) {
        const values = niceToHave.map((text, idx) => [id, idx + 1, text]);
        await conn.query('INSERT INTO hr_job_nice_to_have (job_id, position, text) VALUES ?', [values]);
      }
      if (Array.isArray(benefits) && benefits.length > 0) {
        const values = benefits.map((text, idx) => [id, idx + 1, text]);
        await conn.query('INSERT INTO hr_job_benefits (job_id, position, text) VALUES ?', [values]);
      }

      // Emitir evento Socket.IO para vaga atualizada
      if (req.io) {
        req.io.emit('hr:job_updated', {
          job_id: parseInt(id),
          public_id: uniquePublicId,
          title: title,
          department_name: await getDepartmentName(department_id),
          location_name: await getLocationName(location_id),
          posted_at: posted_at
        });
      }

      res.status(200).json({ message: 'Vaga atualizada com sucesso.' });
    });
  } catch (error) {
    console.error('Erro ao atualizar vaga:', error);
    res.status(500).json({ message: 'Erro interno ao atualizar vaga.' });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Removendo vaga - jobId: ${id}`);
    
    // Verificar se a vaga existe
    const jobRows = await executeQuery('SELECT title FROM hr_job_postings WHERE id = ?', [id]);
    if (jobRows.length === 0) {
      return res.status(404).json({ message: 'Vaga não encontrada.' });
    }
    
    const jobTitle = jobRows[0].title;
    console.log(`Vaga encontrada: "${jobTitle}"`);
    
    // Verificar se há candidatos associados
    const applicationsCount = await executeQuery('SELECT COUNT(*) as count FROM hr_job_applications WHERE job_id = ?', [id]);
    
    if (applicationsCount[0].count > 0) {
      return res.status(400).json({ 
        message: `Não é possível excluir a vaga "${jobTitle}" pois existem ${applicationsCount[0].count} candidato(s) associado(s). Remova os candidatos primeiro.` 
      });
    }
    
    // Buscar todos os anexos relacionados à vaga ANTES de excluir
    const attachments = await executeQuery(`
      SELECT aa.id, aa.file_name, aa.file_url
      FROM hr_applicant_attachments aa
      JOIN hr_applicants a ON a.id = aa.applicant_id
      JOIN hr_job_applications ja ON ja.applicant_id = a.id
      WHERE ja.job_id = ?
    `, [id]);
    
    const attachmentIds = attachments.map(att => att.id);
    const attachmentUrls = attachments.map(att => ({ id: att.id, file_url: att.file_url, file_name: att.file_name }));
    console.log(`Anexos encontrados: ${attachmentIds.length}`, attachments.map(att => att.file_name));
    
    // Excluir a vaga (as foreign keys com CASCADE cuidarão das tabelas relacionadas)
    const result = await executeQuery('DELETE FROM hr_job_postings WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vaga não encontrada.' });
    }
    
    console.log('Vaga removida do banco');
    
    // Remover arquivos físicos dos anexos usando os dados salvos ANTES da remoção
    if (attachmentUrls.length > 0) {
      console.log(`Removendo ${attachmentUrls.length} arquivos físicos...`);
      await removeAttachmentFilesFromUrls(attachmentUrls);
    } else {
      console.log('Nenhum anexo para remover');
    }
    
    // Emitir evento Socket.IO para vaga removida
    if (req.io) {
      req.io.emit('hr:job_deleted', {
        job_id: parseInt(id),
        title: jobTitle
      });
    }
    
    res.status(200).json({ message: `Vaga "${jobTitle}" excluída com sucesso.` });
  } catch (error) {
    console.error('Erro ao excluir vaga:', error);
    res.status(500).json({ message: 'Erro interno ao excluir vaga.' });
  }
};

// ============================
// Applications (Kanban Board)
// ============================
exports.getApplicationsBoard = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Buscar status ativos
    const statuses = await executeQuery('SELECT id, name, position FROM hr_application_statuses WHERE is_active = 1 ORDER BY position');
    
    // Buscar aplicações com dados do candidato e anexos
    const applications = await executeQuery(`
      SELECT a.id, a.applicant_id, a.status_id, a.cover_letter, a.interview_date, a.offer_date, a.applied_at,
             ap.name, ap.email, ap.phone, ap.linkedin_url
      FROM hr_job_applications a
      JOIN hr_applicants ap ON ap.id = a.applicant_id
      WHERE a.job_id = ?
      ORDER BY a.board_order
    `, [jobId]);

    // Buscar anexos para todos os candidatos
    const applicantIds = applications.map(app => app.applicant_id);
    let attachments = [];
    if (applicantIds.length > 0) {
      attachments = await executeQuery(`
        SELECT applicant_id, id, file_name, file_url, is_resume
        FROM hr_applicant_attachments 
        WHERE applicant_id IN (${applicantIds.map(() => '?').join(',')})
        ORDER BY is_resume DESC, created_at ASC
      `, applicantIds);
    }

    // Agrupar anexos por candidato e atualizar URLs
    const attachmentsByApplicant = {};
    attachments.forEach(att => {
      if (!attachmentsByApplicant[att.applicant_id]) {
        attachmentsByApplicant[att.applicant_id] = [];
      }
      // Atualizar URL para usar a rota segura
      attachmentsByApplicant[att.applicant_id].push({
        ...att,
        file_url: `/api/hr-job-openings/attachments/${att.id}`
      });
    });

    // Adicionar anexos às aplicações
    applications.forEach(app => {
      app.attachments = attachmentsByApplicant[app.applicant_id] || [];
    });

    // Organizar por status
    const board = statuses.map(status => ({
      status_id: status.id,
      status_name: status.name,
      applications: applications.filter(app => app.status_id === status.id)
    }));

    res.status(200).json({ board });
  } catch (error) {
    console.error('Erro ao buscar board de aplicações:', error);
    res.status(500).json({ message: 'Erro interno ao buscar board.' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { application_id, to_status_id, to_position, interview_date, offer_date } = req.body;

    // Verificar se está movendo para status de entrevista
    const statusInfo = await executeQuery('SELECT name FROM hr_application_statuses WHERE id = ?', [to_status_id]);
    const isInterviewStatus = statusInfo && statusInfo[0] && statusInfo[0].name.toLowerCase().includes('entrevista');
    const isOfferStatus = statusInfo && statusInfo[0] && statusInfo[0].name.toLowerCase().includes('oferta');

    // Validar data de entrevista se necessário
    if (isInterviewStatus && !interview_date) {
      return res.status(400).json({ message: 'Data de entrevista é obrigatória para este status' });
    }

    // Validar data de oferta se necessário
    if (isOfferStatus && !offer_date) {
      return res.status(400).json({ message: 'Data de oferta é obrigatória para este status' });
    }

    // Ajuste de posições no destino: incrementar ordem de itens com ordem >= to_position
    await executeTransaction(async (conn) => {
      await conn.query(
        'UPDATE hr_job_applications SET board_order = board_order + 1 WHERE status_id = ? AND board_order >= ?',
        [to_status_id, to_position]
      );
      
      // Atualizar status e datas
      const updateFields = ['status_id = ?', 'board_order = ?'];
      const updateValues = [to_status_id, to_position];
      
      if (interview_date) {
        updateFields.push('interview_date = ?');
        updateValues.push(interview_date);
      }
      
      if (offer_date) {
        updateFields.push('offer_date = ?');
        updateValues.push(offer_date);
      }
      
      updateValues.push(application_id);
      
      const [result] = await conn.query(
        `UPDATE hr_job_applications SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Candidatura não encontrada.' });
      }
      res.status(200).json({ success: true });
    });
  } catch (error) {
    console.error('Erro ao mover candidatura:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao mover candidatura.' });
  }
};

exports.createApplicantAndApplication = async (req, res) => {
  try {
    const { job_id, name, email, phone, linkedin_url, portfolio_url, resume_url, source, cover_letter } = req.body;

    await executeTransaction(async (conn) => {
      // Garantir status inicial
      const [status] = await conn.query('SELECT id FROM hr_application_statuses WHERE is_active = 1 ORDER BY position LIMIT 1');
      const statusId = status[0]?.id;
      if (!statusId) throw new Error('Status inicial não configurado.');

      // Obter última posição na coluna
      const [maxRow] = await conn.query('SELECT COALESCE(MAX(board_order), 0) AS maxPos FROM hr_job_applications WHERE job_id = ? AND status_id = ?', [job_id, statusId]);
      const nextPos = (maxRow[0]?.maxPos || 0) + 1;

      // Criar/usar candidato por email
      let applicantId;
      const [existing] = await conn.query('SELECT id FROM hr_applicants WHERE email = ? LIMIT 1', [email]);
      if (existing.length > 0) {
        applicantId = existing[0].id;
        await conn.query('UPDATE hr_applicants SET name = ?, phone = ?, linkedin_url = ?, portfolio_url = ?, resume_url = ? WHERE id = ?', [name, phone || null, linkedin_url || null, portfolio_url || null, resume_url || null, applicantId]);
      } else {
        const [ins] = await conn.query('INSERT INTO hr_applicants (name, email, phone, linkedin_url, portfolio_url, resume_url) VALUES (?, ?, ?, ?, ?, ?)', [name, email, phone || null, linkedin_url || null, portfolio_url || null, resume_url || null]);
        applicantId = ins.insertId;
      }

      // Criar inscrição (evitar duplicadas por job+applicant)
      const [dup] = await conn.query('SELECT id FROM hr_job_applications WHERE job_id = ? AND applicant_id = ? LIMIT 1', [job_id, applicantId]);
      if (dup.length > 0) {
        return res.status(409).json({ message: 'Candidato já inscrito nesta vaga.' });
      }

      await conn.query(`
        INSERT INTO hr_job_applications (job_id, applicant_id, status_id, source, cover_letter, board_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [job_id, applicantId, statusId, source || null, cover_letter || null, nextPos]);

      // Obter o ID da aplicação criada
      const [applicationResult] = await conn.query('SELECT id FROM hr_job_applications WHERE job_id = ? AND applicant_id = ? ORDER BY id DESC LIMIT 1', [job_id, applicantId]);
      const applicationId = applicationResult[0]?.id;

      // Buscar informações da vaga para o email
      const [jobInfo] = await conn.query(`
        SELECT j.title, d.name as department_name
        FROM hr_job_postings j
        JOIN hr_departments d ON d.id = j.department_id
        WHERE j.id = ?
      `, [job_id]);

      // Preparar dados para o email de confirmação
      const emailData = {
        candidate_name: name,
        candidate_email: email,
        job_title: jobInfo[0]?.title || 'Vaga',
        department_name: jobInfo[0]?.department_name || 'Departamento',
        application_date: new Date().toLocaleDateString('pt-BR'),
        application_id: applicationId
      };

      // Enviar email de confirmação para o candidato (assíncrono)
      try {
        await exports.sendCandidateApplicationConfirmation(emailData);
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de confirmação:', emailError);
        // Não falhar a operação se o email falhar
      }

      // Emitir evento Socket.IO para novo candidato criado
      if (req.io) {
        req.io.emit('hr:application_created', {
          application_id: applicationId,
          job_id: job_id,
          applicant_id: applicantId,
          candidate_name: name,
          candidate_email: email,
          status: 'Recebidos' // Status inicial
        });
      }

      res.status(201).json({ 
        success: true, 
        id: applicationId,
        message: 'Candidato criado com sucesso'
      });
    });
  } catch (error) {
    console.error('Erro ao criar candidato/inscrição:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao criar candidato/inscrição.' });
  }
}; 

exports.getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const apps = await executeQuery(`
      SELECT a.id, a.job_id, a.applicant_id, a.status_id, a.cover_letter, a.interview_date, a.offer_date, a.applied_at,
             ap.name, ap.email, ap.phone, ap.linkedin_url
      FROM hr_job_applications a
      JOIN hr_applicants ap ON ap.id = a.applicant_id
      WHERE a.id = ?
      LIMIT 1
    `, [applicationId]);
    if(!apps || apps.length === 0) return res.status(404).json({ message: 'Inscrição não encontrada.'});
    
    const app = apps[0];

    // Buscar anexos do candidato
    const attachments = await executeQuery(`
      SELECT id, file_name, file_url, file_type, file_size, description, is_resume, created_at
      FROM hr_applicant_attachments 
      WHERE applicant_id = ? 
      ORDER BY is_resume DESC, created_at ASC
    `, [app.applicant_id]);

    // Atualizar URLs dos anexos para usar a rota segura
    const attachmentsWithSecureUrl = attachments.map(att => ({
      ...att,
      file_url: `/api/hr-job-openings/attachments/${att.id}`
    }));

    const notes = await executeQuery(`
      SELECT n.id, n.author_id, n.note, n.created_at, 
             CASE 
               WHEN n.author_id = 0 THEN 'Sistema'
               WHEN c.name IS NOT NULL THEN CONCAT(c.name, ' ', COALESCE(c.family_name, ''))
               ELSE CONCAT('Usuário ', n.author_id)
             END as author_name
      FROM hr_application_internal_notes n
      LEFT JOIN collaborators c ON c.id = n.author_id
      WHERE n.application_id = ? 
      ORDER BY n.created_at ASC
    `, [applicationId]);
    
    res.status(200).json({ ...app, attachments: attachmentsWithSecureUrl, notes });
  } catch (error) {
    console.error('Erro ao buscar inscrição:', error);
    res.status(500).json({ message: 'Erro interno ao buscar inscrição.' });
  }
};

// Função para remover anexo do candidato
exports.removeApplicantAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    const result = await executeQuery('DELETE FROM hr_applicant_attachments WHERE id = ?', [attachmentId]);
    
    if(result.affectedRows === 0) {
      return res.status(404).json({ message: 'Anexo não encontrado' });
    }

    res.status(200).json({ message: 'Anexo removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover anexo:', error);
    res.status(500).json({ message: 'Erro interno ao remover anexo.' });
  }
};

exports.addInternalNote = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { author_id = 0, note } = req.body;
    
    if(!applicationId || !note) return res.status(400).json({ message: 'applicationId e note são obrigatórios' });
    
    // Obter nome do autor
    let authorName = 'Sistema';
    let actualAuthorId = author_id;
    
    // Se author_id é um ID de usuário, buscar o collaborator_id correspondente
    if (author_id > 0) {
      // Primeiro tentar buscar como se fosse um user_id
      const userCheck = await executeQuery('SELECT collaborator_id FROM users WHERE id = ? LIMIT 1', [author_id]);
      
      if (userCheck && userCheck.length > 0 && userCheck[0].collaborator_id) {
        actualAuthorId = userCheck[0].collaborator_id;
        const authors = await executeQuery('SELECT CONCAT(name, " ", COALESCE(family_name, "")) as full_name FROM collaborators WHERE id = ? LIMIT 1', [actualAuthorId]);
        
        if (authors && authors.length > 0 && authors[0].full_name && authors[0].full_name.trim()) {
          authorName = authors[0].full_name.trim();
        }
      } else {
        // Tentar buscar diretamente como collaborator_id
        const authors = await executeQuery('SELECT CONCAT(name, " ", COALESCE(family_name, "")) as full_name FROM collaborators WHERE id = ? LIMIT 1', [author_id]);
        
        if (authors && authors.length > 0 && authors[0].full_name && authors[0].full_name.trim()) {
          authorName = authors[0].full_name.trim();
        } else {
          authorName = `Usuário ${author_id}`;
        }
      }
    }
    
    const result = await executeQuery('INSERT INTO hr_application_internal_notes (application_id, author_id, note) VALUES (?, ?, ?)', [applicationId, author_id, note]);
    
    // Emitir evento Socket.IO para nova nota interna
    if (req.io) {
      req.io.emit('hr:internal_note_added', {
        note_id: result.insertId,
        application_id: parseInt(applicationId),
        author_name: authorName,
        note: note,
        created_at: new Date().toISOString()
      });
    }
    
    res.status(201).json({ id: result.insertId, author_name: authorName });
  } catch (error) {
    console.error('Erro ao adicionar nota interna:', error);
    res.status(500).json({ message: 'Erro interno ao adicionar nota.' });
  }
};

// Função para remover observação interna
exports.removeInternalNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    
    if(!noteId) return res.status(400).json({ message: 'noteId é obrigatório' });
    
    const result = await executeQuery('DELETE FROM hr_application_internal_notes WHERE id = ?', [noteId]);
    
    if(result.affectedRows === 0) {
      return res.status(404).json({ message: 'Observação não encontrada' });
    }
    
    // Emitir evento Socket.IO para nota removida
    if (req.io) {
      req.io.emit('hr:internal_note_removed', {
        note_id: parseInt(noteId)
      });
    }
    
    res.status(200).json({ message: 'Observação removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover nota interna:', error);
    res.status(500).json({ message: 'Erro interno ao remover nota.' });
  }
};

exports.updateApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const {
      name, email, phone, linkedin_url,
      cover_letter, interview_date, offer_date
    } = req.body;

    await executeTransaction(async (conn) => {
      // Buscar applicant_id a partir da inscrição
      const [rows] = await conn.query('SELECT applicant_id FROM hr_job_applications WHERE id = ? LIMIT 1', [applicationId]);
      if (!rows || rows.length === 0) return res.status(404).json({ message: 'Inscrição não encontrada.' });
      const applicantId = rows[0].applicant_id;

      // Atualizar candidato
      await conn.query(
        `UPDATE hr_applicants SET name = ?, email = ?, phone = ?, linkedin_url = ? WHERE id = ?`,
        [name || null, email || null, phone || null, linkedin_url || null, applicantId]
      );

      // Atualizar inscrição
      await conn.query(
        `UPDATE hr_job_applications SET cover_letter = ?, interview_date = ?, offer_date = ? WHERE id = ?`,
        [cover_letter || null, interview_date || null, offer_date || null, applicationId]
      );

      res.status(200).json({ success: true });
    });
  } catch (error) {
    console.error('Erro ao atualizar inscrição/candidato:', error);
    res.status(500).json({ success: false, message: 'Erro interno ao atualizar dados.' });
  }
};

// Função para remover candidato
exports.removeApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    if (!applicationId) {
      return res.status(400).json({ message: 'ID da aplicação é obrigatório' });
    }
    
    // Buscar a aplicação específica
    const applications = await executeQuery(`
      SELECT 
        ja.id as application_id,
        ja.job_id,
        ja.applicant_id,
        jp.title as job_title,
        a.name as candidate_name,
        a.email as candidate_email
      FROM hr_job_applications ja
      JOIN hr_job_postings jp ON jp.id = ja.job_id
      JOIN hr_applicants a ON a.id = ja.applicant_id
      WHERE ja.id = ?
    `, [applicationId]);
    
    if (!applications || applications.length === 0) {
      return res.status(404).json({ message: 'Aplicação não encontrada' });
    }
    
    const applicationToRemove = applications[0];
    
    console.log(`Removendo aplicação: ${applicationToRemove.job_title} do candidato ${applicationToRemove.candidate_name}`);
    
    // Iniciar transação
    await executeTransaction(async (conn) => {
      // 1. Remover observações internas da aplicação
      await conn.query(`
        DELETE FROM hr_application_internal_notes 
        WHERE application_id = ?
      `, [applicationToRemove.application_id]);
      
      console.log(`Observações da aplicação removidas`);
      
      // 2. Remover a aplicação
      await conn.query(`
        DELETE FROM hr_job_applications 
        WHERE id = ?
      `, [applicationToRemove.application_id]);
      
      console.log(`Aplicação removida`);
    });
    
    // Emitir evento Socket.IO
    if (req.io) {
      req.io.emit('hr:application_removed', {
        applicant_id: applicationToRemove.applicant_id,
        job_id: applicationToRemove.job_id,
        application_id: applicationToRemove.application_id
      });
    }
    
    res.json({
      success: true,
      message: 'Aplicação removida com sucesso',
      data: {
        job_title: applicationToRemove.job_title,
        candidate_name: applicationToRemove.candidate_name,
        candidate_email: applicationToRemove.candidate_email
      }
    });
    
  } catch (error) {
    console.error('Erro ao remover aplicação:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno ao remover aplicação' 
    });
  }
};

// ========== FUNÇÕES PARA CONFIGURAÇÕES ==========

// Validar nome da tabela
function validateTableName(tableName) {
  const allowedTables = [
    'hr_departments',
    'hr_locations', 
    'hr_modalities',
    'hr_levels',
    'hr_contract_types'
  ];
  return allowedTables.includes(tableName);
}

// Criar item de configuração
exports.createSettingsItem = async (req, res) => {
  try {
    const { table } = req.params;
    const { name } = req.body;

    // Validar nome da tabela
    if (!validateTableName(table)) {
      return res.status(400).json({ message: 'Tabela não permitida' });
    }

    // Validar campos obrigatórios
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Nome é obrigatório' });
    }

    // Verificar se já existe um item com esse nome
    const existing = await executeQuery(`SELECT id FROM ${table} WHERE name = ?`, [name.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Já existe um item com este nome' });
    }

    // Inserir novo item
    const result = await executeQuery(
      `INSERT INTO ${table} (name) VALUES (?)`,
      [name.trim()]
    );

    // Emitir evento Socket.IO para item de configuração criado
    if (req.io) {
      req.io.emit('hr:settings_item_created', {
        table: table,
        item_id: result.insertId,
        name: name.trim()
      });
    }

    res.status(201).json({ 
      id: result.insertId, 
      message: 'Item criado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao criar item de configuração:', error);
    res.status(500).json({ message: 'Erro interno ao criar item' });
  }
};

// Atualizar item de configuração
exports.updateSettingsItem = async (req, res) => {
  try {
    const { table, id } = req.params;
    const { name } = req.body;

    // Validar nome da tabela
    if (!validateTableName(table)) {
      return res.status(400).json({ message: 'Tabela não permitida' });
    }

    // Validar campos obrigatórios
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Nome é obrigatório' });
    }

    // Verificar se já existe outro item com esse nome
    const existing = await executeQuery(
      `SELECT id FROM ${table} WHERE name = ? AND id != ?`, 
      [name.trim(), id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Já existe outro item com este nome' });
    }

    // Atualizar item
    const result = await executeQuery(
      `UPDATE ${table} SET name = ? WHERE id = ?`,
      [name.trim(), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item não encontrado' });
    }

    // Emitir evento Socket.IO para item de configuração atualizado
    if (req.io) {
      req.io.emit('hr:settings_item_updated', {
        table: table,
        item_id: parseInt(id),
        name: name.trim()
      });
    }

    res.status(200).json({ message: 'Item atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar item de configuração:', error);
    res.status(500).json({ message: 'Erro interno ao atualizar item' });
  }
};

// Excluir item de configuração
exports.deleteSettingsItem = async (req, res) => {
  try {
    const { table, id } = req.params;

    // Validar nome da tabela
    if (!validateTableName(table)) {
      return res.status(400).json({ message: 'Tabela não permitida' });
    }

    // Verificar se o item existe
    const existing = await executeQuery(`SELECT name FROM ${table} WHERE id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Item não encontrado' });
    }

    const itemName = existing[0].name;

    // Verificar se o item está sendo usado nas vagas
    let checkTable = '';
    let checkColumn = '';
    
    switch(table) {
      case 'hr_departments':
        checkTable = 'hr_job_postings';
        checkColumn = 'department_id';
        break;
      case 'hr_locations':
        checkTable = 'hr_job_postings';
        checkColumn = 'location_id';
        break;
      case 'hr_modalities':
        checkTable = 'hr_job_postings';
        checkColumn = 'modality_id';
        break;
      case 'hr_levels':
        checkTable = 'hr_job_postings';
        checkColumn = 'level_id';
        break;
      case 'hr_contract_types':
        checkTable = 'hr_job_postings';
        checkColumn = 'contract_type_id';
        break;
    }

    if (checkTable && checkColumn) {
      const usage = await executeQuery(
        `SELECT COUNT(*) as count FROM ${checkTable} WHERE ${checkColumn} = ?`,
        [id]
      );
      
      if (usage[0].count > 0) {
        return res.status(400).json({ 
          message: `Não é possível excluir "${itemName}" pois está sendo usado em ${usage[0].count} vaga(s)` 
        });
      }
    }

    // Excluir item
    const result = await executeQuery(`DELETE FROM ${table} WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item não encontrado' });
    }

    // Emitir evento Socket.IO para item de configuração removido
    if (req.io) {
      req.io.emit('hr:settings_item_deleted', {
        table: table,
        item_id: parseInt(id),
        name: itemName
      });
    }

    res.status(200).json({ message: `"${itemName}" excluído com sucesso` });
  } catch (error) {
    console.error('Erro ao excluir item de configuração:', error);
    res.status(500).json({ message: 'Erro interno ao excluir item' });
  }
};

// ========== FUNÇÕES DE MANUTENÇÃO ==========

// Limpeza de anexos órfãos
exports.cleanupOrphanedAttachments = async (req, res) => {
  try {
    await cleanupOrphanedAttachments();
    res.status(200).json({ message: 'Limpeza de anexos órfãos concluída com sucesso' });
  } catch (error) {
    console.error('Erro ao executar limpeza de anexos órfãos:', error);
    res.status(500).json({ message: 'Erro interno ao executar limpeza' });
  }
};

// Função para servir arquivo de forma segura
exports.serveAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    if (!attachmentId) {
      return res.status(400).json({ message: 'ID do anexo é obrigatório' });
    }
    
    const attachments = await executeQuery(`
      SELECT file_url, file_name, file_type 
      FROM hr_applicant_attachments 
      WHERE id = ?
    `, [attachmentId]);
    
    const attachment = attachments[0];
    
    if (!attachment) {
      return res.status(404).json({ message: 'Anexo não encontrado' });
    }
    
    // Construir caminho do arquivo corretamente
    let fileName = attachment.file_url;
    
    // Se file_url contém caminho completo, extrair apenas o nome do arquivo
    if (fileName.includes('/storageService/hr-job-openings/')) {
      fileName = fileName.split('/').pop();
    }
    
    const filePath = path.join(__dirname, '../../storageService/hr-job-openings', fileName);
    
    if (!fs.existsSync(filePath)) {
      console.error(`Arquivo não encontrado: ${filePath}`);
      return res.status(404).json({ message: 'Arquivo não encontrado no servidor' });
    }
    
    // Definir headers apropriados
    res.setHeader('Content-Type', attachment.file_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${attachment.file_name}"`);
    
    // Enviar arquivo
    res.sendFile(filePath);
  } catch (error) {
    console.error('Erro ao servir anexo:', error);
    res.status(500).json({ message: 'Erro interno ao servir arquivo' });
  }
};

// ========== FUNÇÕES PARA API PÚBLICA ==========

// Listar vagas publicadas
exports.getPublicJobs = async (req, res) => {
  try {
    const { status = 'published' } = req.query;
    
    let statusCondition = '';
    if (status === 'published') {
      statusCondition = "AND jp.status = 'Published'";
    } else if (status === 'all') {
      statusCondition = "AND jp.status IN ('Published', 'Draft')";
    }
    
    const jobs = await executeQuery(`
      SELECT 
        jp.public_id,
        jp.title,
        jp.description,
        jp.posted_at,
        jp.openings,
        d.name as department_name,
        l.name as location_name,
        m.name as modality_name,
        lv.name as level_name,
        ct.name as contract_type_name,
        jp.status as status_name
      FROM hr_job_postings jp
      LEFT JOIN hr_departments d ON jp.department_id = d.id
      LEFT JOIN hr_locations l ON jp.location_id = l.id
      LEFT JOIN hr_modalities m ON jp.modality_id = m.id
      LEFT JOIN hr_levels lv ON jp.level_id = lv.id
      LEFT JOIN hr_contract_types ct ON jp.contract_type_id = ct.id
      WHERE jp.public_id IS NOT NULL 
      AND jp.is_active = 1
      ${statusCondition}
      ORDER BY jp.posted_at DESC
    `);

    // Para cada vaga, buscar os detalhes adicionais
    for (let job of jobs) {
      // Buscar responsabilidades
      const responsibilities = await executeQuery(`
        SELECT text FROM hr_job_responsibilities 
        WHERE job_id = (SELECT id FROM hr_job_postings WHERE public_id = ?)
        ORDER BY position
      `, [job.public_id]);
      job.responsibilities = responsibilities.map(r => r.text);

      // Buscar requisitos
      const requirements = await executeQuery(`
        SELECT text FROM hr_job_requirements 
        WHERE job_id = (SELECT id FROM hr_job_postings WHERE public_id = ?)
        ORDER BY position
      `, [job.public_id]);
      job.requirements = requirements.map(r => r.text);

      // Buscar benefícios
      const benefits = await executeQuery(`
        SELECT text FROM hr_job_benefits 
        WHERE job_id = (SELECT id FROM hr_job_postings WHERE public_id = ?)
        ORDER BY position
      `, [job.public_id]);
      job.benefits = benefits.map(b => b.text);

      // Buscar nice to have
      const niceToHave = await executeQuery(`
        SELECT text FROM hr_job_nice_to_have 
        WHERE job_id = (SELECT id FROM hr_job_postings WHERE public_id = ?)
        ORDER BY position
      `, [job.public_id]);
      job.nice_to_have = niceToHave.map(n => n.text);
    }
    
    res.json({
      success: true,
      data: jobs,
      total: jobs.length
    });
  } catch (error) {
    console.error('Erro ao buscar vagas públicas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao buscar vagas' 
    });
  }
};

// Obter detalhes de uma vaga específica
exports.getPublicJobDetails = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID público da vaga é obrigatório' 
      });
    }
    
    const jobs = await executeQuery(`
      SELECT 
        jp.public_id,
        jp.title,
        jp.description,
        jp.posted_at,
        jp.openings,
        d.name as department_name,
        l.name as location_name,
        m.name as modality_name,
        lv.name as level_name,
        ct.name as contract_type_name,
        jp.status as status_name
      FROM hr_job_postings jp
      LEFT JOIN hr_departments d ON jp.department_id = d.id
      LEFT JOIN hr_locations l ON jp.location_id = l.id
      LEFT JOIN hr_modalities m ON jp.modality_id = m.id
      LEFT JOIN hr_levels lv ON jp.level_id = lv.id
      LEFT JOIN hr_contract_types ct ON jp.contract_type_id = ct.id
      WHERE jp.public_id = ? 
      AND jp.is_active = 1
      AND jp.status IN ('Published', 'Draft')
    `, [publicId]);
    
    if (!jobs || jobs.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vaga não encontrada ou não está disponível' 
      });
    }
    
    const job = jobs[0];

    // Buscar detalhes adicionais da vaga
    const jobId = await executeQuery('SELECT id FROM hr_job_postings WHERE public_id = ?', [publicId]);
    const actualJobId = jobId[0].id;

    // Buscar responsabilidades
    const responsibilities = await executeQuery(`
      SELECT text FROM hr_job_responsibilities 
      WHERE job_id = ?
      ORDER BY position
    `, [actualJobId]);
    job.responsibilities = responsibilities.map(r => r.text);

    // Buscar requisitos
    const requirements = await executeQuery(`
      SELECT text FROM hr_job_requirements 
      WHERE job_id = ?
      ORDER BY position
    `, [actualJobId]);
    job.requirements = requirements.map(r => r.text);

    // Buscar benefícios
    const benefits = await executeQuery(`
      SELECT text FROM hr_job_benefits 
      WHERE job_id = ?
      ORDER BY position
    `, [actualJobId]);
    job.benefits = benefits.map(b => b.text);

    // Buscar nice to have
    const niceToHave = await executeQuery(`
      SELECT text FROM hr_job_nice_to_have 
      WHERE job_id = ?
      ORDER BY position
    `, [actualJobId]);
    job.nice_to_have = niceToHave.map(n => n.text);
    
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da vaga:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao buscar detalhes da vaga' 
    });
  }
};

// Candidatura pública
exports.publicApply = async (req, res) => {
  try {
    const {
      job_public_id,
      name,
      email,
      phone,
      linkedin_url,
      cover_letter
    } = req.body;
    
    // Validações básicas
    if (!job_public_id || !name || !email) {
      return res.status(400).json({
        success: false,
        message: 'ID da vaga, nome e email são obrigatórios'
      });
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Validar tamanho dos campos
    if (name.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Nome muito longo (máximo 150 caracteres)'
      });
    }

    if (email.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Email muito longo (máximo 200 caracteres)'
      });
    }

    if (phone && phone.length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Telefone muito longo (máximo 60 caracteres)'
      });
    }

    if (linkedin_url && linkedin_url.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'URL do LinkedIn muito longa (máximo 255 caracteres)'
      });
    }
    
    // Buscar job_id a partir do public_id
    const jobRows = await executeQuery(`
      SELECT jp.id, jp.title, d.name as department_name
      FROM hr_job_postings jp
      LEFT JOIN hr_departments d ON d.id = jp.department_id
      WHERE jp.public_id = ? 
      AND jp.is_active = 1
      AND jp.status IN ('Published', 'Draft')
    `, [job_public_id]);
    
    if (!jobRows || jobRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vaga não encontrada ou não está disponível para candidatura'
      });
    }
    
    const jobId = jobRows[0].id;
    const jobTitle = jobRows[0].title;
    
    // Verificar se já existe candidato com este email
    const existingApplicant = await executeQuery(
      'SELECT id FROM hr_applicants WHERE email = ?',
      [email]
    );
    
    let applicantId;
    
    if (existingApplicant && existingApplicant.length > 0) {
      applicantId = existingApplicant[0].id;
      
      // Verificar se já existe candidatura para esta vaga
      const existingApplication = await executeQuery(
        'SELECT id FROM hr_job_applications WHERE job_id = ? AND applicant_id = ?',
        [jobId, applicantId]
      );
      
      if (existingApplication && existingApplication.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Você já se candidatou para esta vaga'
        });
      }
    }

    await executeTransaction(async (conn) => {
      if (existingApplicant && existingApplicant.length > 0) {
        // Atualizar dados do candidato existente
        await conn.query(`
          UPDATE hr_applicants 
          SET name = ?, phone = ?, linkedin_url = ?, updated_at = NOW()
          WHERE id = ?
        `, [name, phone || null, linkedin_url || null, applicantId]);
      } else {
        // Criar novo candidato
        const [applicantResult] = await conn.query(`
          INSERT INTO hr_applicants (name, email, phone, linkedin_url)
          VALUES (?, ?, ?, ?)
        `, [name, email, phone || null, linkedin_url || null]);
        
        applicantId = applicantResult.insertId;
      }
      
      // Obter status inicial (geralmente "Recebidos")
      const [statusRows] = await conn.query(
        'SELECT id FROM hr_application_statuses WHERE name = "Recebidos"'
      );
      
      const statusId = statusRows[0]?.id || 1;
      
      // Obter próxima posição no board
      const [maxOrder] = await conn.query(
        'SELECT COALESCE(MAX(board_order), 0) + 1 as nextPos FROM hr_job_applications WHERE job_id = ?',
        [jobId]
      );
      
      const nextPos = maxOrder[0].nextPos;
      
      // Criar candidatura
      const [applicationResult] = await conn.query(`
        INSERT INTO hr_job_applications (job_id, applicant_id, status_id, cover_letter, board_order)
        VALUES (?, ?, ?, ?, ?)
      `, [jobId, applicantId, statusId, cover_letter || null, nextPos]);
      
      const applicationId = applicationResult.insertId;
      
      // Se há arquivo anexado, salvar
      if (req.file) {
        console.log('publicApply - req.file:', req.file);
        const fileName = req.file.filename;
        const originalName = req.file.originalname;
        const fileType = req.file.mimetype;
        const fileSize = req.file.size || 0;
        
        console.log('publicApply - fileSize:', fileSize, 'type:', typeof fileSize);
        
        // Verificar se o tamanho é um número válido
        const validFileSize = isNaN(fileSize) ? 0 : parseInt(fileSize);
        
        // Gerar hash do arquivo
        const fileHash = generateBufferHash(req.file.buffer || fs.readFileSync(req.file.path));
        
        // Gerar email_hash
        const emailHash = generateEmailHash(fileHash, email);
        
        // Verificar se arquivo já existe para este email
        const existingFile = await getExistingFile(fileHash, email, executeQuery);
        
        if (existingFile) {
          console.log(`Arquivo existente encontrado: ${existingFile.file_name} (ID: ${existingFile.id})`);
          
          // Remover arquivo físico anterior
          let oldFileName = existingFile.file_url;
          if (oldFileName.includes('/storageService/hr-job-openings/')) {
            oldFileName = oldFileName.split('/').pop();
          }
          
          const uploadDir = path.join(__dirname, '../../storageService/hr-job-openings');
          const oldFilePath = path.join(uploadDir, oldFileName);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(`Arquivo físico anterior removido: ${oldFileName}`);
          }
          
          // Mover o novo arquivo para o local correto
          const newFilePath = path.join(uploadDir, fileName);
          if (fs.existsSync(req.file.path)) {
            fs.renameSync(req.file.path, newFilePath);
            console.log(`Novo arquivo físico movido: ${fileName}`);
          }
          
          // Atualizar registro existente com o novo arquivo
          await conn.query(`
            UPDATE hr_applicant_attachments 
            SET 
              file_name = ?,
              file_url = ?,
              file_type = ?,
              file_size = ?,
              description = 'Currículo enviado via site da empresa',
              is_resume = 1,
              file_hash = ?,
              email_hash = ?,
              created_at = NOW()
            WHERE id = ?
          `, [originalName, fileName, fileType, validFileSize, fileHash, emailHash, existingFile.id]);
          
          console.log(`Arquivo existente substituído: ID ${existingFile.id} (novo arquivo físico)`);
          
        } else {
          // Inserir novo registro
          await conn.query(`
            INSERT INTO hr_applicant_attachments (
              applicant_id, file_name, file_url, file_type, file_size, 
              description, is_resume, file_hash, email_hash
            )
            VALUES (?, ?, ?, ?, ?, 'Currículo enviado via site da empresa', 1, ?, ?)
          `, [applicantId, originalName, fileName, fileType, validFileSize, fileHash, emailHash]);
          
          console.log(`Novo arquivo inserido para candidato: ${applicantId}`);
        }
      }
      
      // Preparar dados para o email de confirmação
      const emailData = {
        candidate_name: name,
        candidate_email: email,
        job_title: jobTitle,
        department_name: jobRows[0]?.department_name || 'Departamento',
        application_date: new Date().toLocaleDateString('pt-BR'),
        application_id: applicationId
      };

      // Enviar email de confirmação para o candidato (assíncrono)
      try {
        await exports.sendCandidateApplicationConfirmation(emailData);
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de confirmação:', emailError);
        // Não falhar a operação se o email falhar
      }

      // Emitir evento Socket.IO para candidatura pública (se io estiver disponível)
      if (req.io) {
        req.io.emit('hr:public_application_created', {
          application_id: applicationId,
          job_id: jobId,
          job_title: jobTitle,
          applicant_id: applicantId,
          candidate_name: name,
          candidate_email: email,
          status: 'Recebidos',
          source: 'Site da empresa'
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Candidatura enviada com sucesso!',
        data: {
          application_id: applicationId,
          job_title: jobTitle,
          candidate_name: name,
          candidate_email: email
        }
      });
    });
  } catch (error) {
    console.error('Erro na candidatura pública:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno ao processar candidatura'
    });
  }
};

// Servir anexos de forma segura para API pública
exports.servePublicAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    if (!attachmentId) {
      return res.status(400).json({ message: 'ID do anexo é obrigatório' });
    }
    
    const attachments = await executeQuery(`
      SELECT file_url, file_name, file_type 
      FROM hr_applicant_attachments 
      WHERE id = ?
    `, [attachmentId]);
    
    const attachment = attachments[0];
    
    if (!attachment) {
      return res.status(404).json({ message: 'Anexo não encontrado' });
    }
    
    // Construir caminho do arquivo corretamente
    let fileName = attachment.file_url;
    
    // Se file_url contém caminho completo, extrair apenas o nome do arquivo
    if (fileName.includes('/storageService/hr-job-openings/')) {
      fileName = fileName.split('/').pop();
    }
    
    const filePath = path.join(__dirname, '../../storageService/hr-job-openings', fileName);
    
    if (!fs.existsSync(filePath)) {
      console.error(`Arquivo não encontrado: ${filePath}`);
      return res.status(404).json({ message: 'Arquivo não encontrado no servidor' });
    }
    
    // Definir headers apropriados
    res.setHeader('Content-Type', attachment.file_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${attachment.file_name}"`);
    
    // Enviar arquivo
    res.sendFile(filePath);
  } catch (error) {
    console.error('Erro ao servir anexo público:', error);
    res.status(500).json({ message: 'Erro interno ao servir arquivo' });
  }
};

// Banco de Talentos - Listar candidatos (AGRUPADO POR EMAIL)
exports.getTalentBankCandidates = async (req, res) => {
  try {
    const { page = 1, limit = 20, department_id, location_id, modality_id, status_id, search } = req.query;
    const offset = (page - 1) * limit;
    
    // Construir WHERE dinamicamente
    const whereConditions = ['jp.is_active = 1'];
    const params = [];
    
    if (department_id) {
      whereConditions.push('jp.department_id = ?');
      params.push(department_id);
    }
    
    if (location_id) {
      whereConditions.push('jp.location_id = ?');
      params.push(location_id);
    }
    
    if (modality_id) {
      whereConditions.push('jp.modality_id = ?');
      params.push(modality_id);
    }
    
    if (status_id) {
      whereConditions.push('ja.status_id = ?');
      params.push(status_id);
    }
    
    if (search) {
      whereConditions.push('(a.name LIKE ? OR a.email LIKE ? OR jp.title LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    // Query principal com agrupamento por email - CORRIGIDA
    const sql = `
      SELECT
        a.id,
        a.email,
        a.name,
        a.phone,
        a.linkedin_url,
        a.created_at as candidate_created_at,
        COUNT(DISTINCT ja.id) as total_applications,
        COUNT(DISTINCT jp.id) as total_jobs,
        GROUP_CONCAT(CONCAT(jp.title, ':::', s.name, ':::', COALESCE(d.name, 'N/A'), ':::', COALESCE(l.name, 'N/A')) ORDER BY ja.applied_at DESC SEPARATOR '|||') as applications_data,
        MAX(ja.applied_at) as last_application_date,
        MIN(ja.applied_at) as first_application_date,
        COUNT(DISTINCT aa.id) as total_attachments,
        COUNT(DISTINCT ain.id) as total_notes
      FROM hr_applicants a
      JOIN hr_job_applications ja ON ja.applicant_id = a.id
      JOIN hr_job_postings jp ON jp.id = ja.job_id
      JOIN hr_application_statuses s ON s.id = ja.status_id
      LEFT JOIN hr_departments d ON d.id = jp.department_id
      LEFT JOIN hr_locations l ON l.id = jp.location_id
      LEFT JOIN hr_applicant_attachments aa ON aa.applicant_id = a.id
      LEFT JOIN hr_application_internal_notes ain ON ain.application_id = ja.id
      ${whereClause}
      GROUP BY a.id, a.email, a.name, a.phone, a.linkedin_url, a.created_at
      ORDER BY last_application_date DESC
      LIMIT ? OFFSET ?
    `;
    
    const candidates = await executeQuery(sql, [...params, parseInt(limit), offset]);
    
    // Query para contar total
    const countSql = `
      SELECT COUNT(DISTINCT a.email) as total
      FROM hr_applicants a
      JOIN hr_job_applications ja ON ja.applicant_id = a.id
      JOIN hr_job_postings jp ON jp.id = ja.job_id
      JOIN hr_application_statuses s ON s.id = ja.status_id
      LEFT JOIN hr_departments d ON d.id = jp.department_id
      LEFT JOIN hr_locations l ON l.id = jp.location_id
      ${whereClause}
    `;
    
    const [{ total }] = await executeQuery(countSql, params);
    
    // Processar dados agrupados - CORRIGIDO
    const processedCandidates = candidates.map(candidate => {
      const applicationsData = candidate.applications_data ? candidate.applications_data.split('|||') : [];
      
      // Processar cada aplicação
      const applications = applicationsData.map(appData => {
        const [title, status, department, location] = appData.split(':::');
        return {
          title: title || 'N/A',
          status: status || 'N/A',
          department: department || 'N/A',
          location: location || 'N/A'
        };
      });
      
      // Extrair arrays únicos para compatibilidade (remover duplicatas)
      const uniqueJobTitles = [...new Set(applications.map(app => app.title))];
      const uniqueStatuses = [...new Set(applications.map(app => app.status))];
      const uniqueDepartments = [...new Set(applications.map(app => app.department))];
      const uniqueLocations = [...new Set(applications.map(app => app.location))];
      
      return {
        ...candidate,
        applications: applications,
        job_titles: uniqueJobTitles,
        statuses: uniqueStatuses,
        departments: uniqueDepartments,
        locations: uniqueLocations,
        // Usar contagem real do array processado
        total_applications: applications.length,
        // Status mais recente (primeiro da lista, pois ordenamos por applied_at DESC)
        current_status: applications[0]?.status || 'N/A',
        // Departamento mais comum
        primary_department: applications[0]?.department || 'N/A',
        // Localização mais comum
        primary_location: applications[0]?.location || 'N/A'
      };
    });
    
    res.json({
      success: true,
      candidates: processedCandidates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar candidatos do banco de talentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar candidatos'
    });
  }
};

// Banco de Talentos - Estatísticas
exports.getTalentBankStats = async (req, res) => {
  try {
    // Total de candidatos
    const totalCandidatesResult = await executeQuery(`
      SELECT COUNT(DISTINCT a.id) as total
      FROM hr_job_applications ja
      INNER JOIN hr_applicants a ON ja.applicant_id = a.id
      INNER JOIN hr_job_postings jp ON ja.job_id = jp.id
      WHERE jp.is_active = 1
    `);
    
    // Candidatos ativos (últimos 30 dias)
    const activeCandidatesResult = await executeQuery(`
      SELECT COUNT(DISTINCT a.id) as total
      FROM hr_job_applications ja
      INNER JOIN hr_applicants a ON ja.applicant_id = a.id
      INNER JOIN hr_job_postings jp ON ja.job_id = jp.id
      WHERE jp.is_active = 1
      AND ja.applied_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    // Total de vagas ativas
    const totalJobsResult = await executeQuery(`
      SELECT COUNT(*) as total
      FROM hr_job_postings
      WHERE is_active = 1 AND status IN ('Published', 'Draft')
    `);
    
    // Média de candidaturas por vaga
    const avgApplicationsResult = await executeQuery(`
      SELECT 
        CASE 
          WHEN COUNT(DISTINCT jp.id) > 0 
          THEN ROUND(COUNT(ja.id) / COUNT(DISTINCT jp.id), 1)
          ELSE 0 
        END as avg_applications
      FROM hr_job_postings jp
      LEFT JOIN hr_job_applications ja ON jp.id = ja.job_id
      WHERE jp.is_active = 1 AND jp.status IN ('Published', 'Draft')
    `);
    
    res.json({
      success: true,
      total_candidates: totalCandidatesResult[0]?.total || 0,
      active_candidates: activeCandidatesResult[0]?.total || 0,
      total_jobs: totalJobsResult[0]?.total || 0,
      avg_applications: avgApplicationsResult[0]?.avg_applications || 0
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do banco de talentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar estatísticas'
    });
  }
};

// Banco de Talentos - Exportar dados
exports.exportTalentBank = async (req, res) => {
  try {
    const { filters = {} } = req.body;
    
    let whereConditions = ['jp.is_active = 1'];
    let params = [];
    
    // Aplicar filtros
    if (filters.keyword) {
      whereConditions.push('(a.name LIKE ? OR a.email LIKE ? OR jp.title LIKE ?)');
      const keyword = `%${filters.keyword}%`;
      params.push(keyword, keyword, keyword);
    }
    
    if (filters.department) {
      whereConditions.push('jp.department_id = ?');
      params.push(filters.department);
    }
    
    if (filters.modality) {
      whereConditions.push('jp.modality_id = ?');
      params.push(filters.modality);
    }
    
    if (filters.location) {
      whereConditions.push('jp.location_id = ?');
      params.push(filters.location);
    }
    
    if (filters.status) {
      whereConditions.push('s.name = ?');
      params.push(filters.status);
    }
    
    const query = `
      SELECT 
        a.name as 'Nome do Candidato',
        a.email as 'Email',
        a.phone as 'Telefone',
        a.linkedin_url as 'LinkedIn',
        jp.title as 'Vaga',
        d.name as 'Departamento',
        l.name as 'Local',
        m.name as 'Modalidade',
        s.name as 'Status',
        ja.applied_at as 'Data da Candidatura',
        ja.interview_date as 'Data da Entrevista',
        ja.offer_date as 'Data da Oferta',
        (SELECT COUNT(*) FROM hr_applicant_attachments WHERE applicant_id = a.id) as 'Quantidade de Anexos',
        (SELECT COUNT(*) FROM hr_application_internal_notes WHERE application_id = ja.id) as 'Quantidade de Observações'
        
      FROM hr_job_applications ja
      INNER JOIN hr_applicants a ON ja.applicant_id = a.id
      INNER JOIN hr_job_postings jp ON ja.job_id = jp.id
      INNER JOIN hr_application_statuses s ON ja.status_id = s.id
      LEFT JOIN hr_departments d ON jp.department_id = d.id
      LEFT JOIN hr_locations l ON jp.location_id = l.id
      LEFT JOIN hr_modalities m ON jp.modality_id = m.id
      
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ja.applied_at DESC
    `;

    const candidates = await executeQuery(query, params);
    
    // Para simplificar, vamos retornar como JSON por enquanto
    // Em produção, você pode usar uma biblioteca como 'exceljs' para gerar arquivos Excel
    res.json({
      success: true,
      message: 'Exportação realizada com sucesso',
      data: candidates,
      total: candidates.length
    });
    
  } catch (error) {
    console.error('Erro ao exportar banco de talentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao exportar dados'
    });
  }
};

// Remanejar candidato para outra vaga
exports.reassignApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { new_job_id, new_status, cover_letter } = req.body;

    // Validações
    if (!new_job_id || !new_status) {
      return res.status(400).json({
        success: false,
        message: 'Nova vaga e status são obrigatórios'
      });
    }

    // Verificar se a aplicação existe
    const application = await executeQuery(`
      SELECT ja.*, a.name as candidate_name, jp.title as job_title
      FROM hr_job_applications ja
      INNER JOIN hr_applicants a ON ja.applicant_id = a.id
      INNER JOIN hr_job_postings jp ON ja.job_id = jp.id
      WHERE ja.id = ?
    `, [applicationId]);

    if (!application || application.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aplicação não encontrada'
      });
    }

    const currentApp = application[0];

    // Verificar se a nova vaga existe e está ativa
    const newJob = await executeQuery(`
      SELECT id, title, is_active, status
      FROM hr_job_postings
      WHERE id = ?
    `, [new_job_id]);

    if (!newJob || newJob.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nova vaga não encontrada'
      });
    }

    // Permitir remanejamento para qualquer vaga, independente do status
    // Isso é útil para reorganização de candidatos entre vagas
    console.log(`Remanejando para vaga: ${newJob[0].title} (Status: ${newJob[0].status})`);
    
    // Opcional: apenas avisar se a vaga está fechada/arquivada
    if (newJob[0].status === 'Closed' || newJob[0].status === 'Archived') {
      console.log(`Aviso: Remanejando para vaga com status ${newJob[0].status}`);
    }

    // Verificar se o status existe
    const status = await executeQuery(`
      SELECT id, name
      FROM hr_application_statuses
      WHERE name = ?
    `, [new_status]);

    if (!status || status.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido'
      });
    }

    const statusId = status[0].id;

    // Verificar se já existe candidatura para esta vaga
    const existingApplication = await executeQuery(`
      SELECT id
      FROM hr_job_applications
      WHERE job_id = ? AND applicant_id = ?
    `, [new_job_id, currentApp.applicant_id]);

    if (existingApplication && existingApplication.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'O candidato já possui uma candidatura para esta vaga'
      });
    }

    // Iniciar transação
    const connection = await executeTransaction(async (connection) => {
      // Criar nova candidatura
      const insertResult = await connection.execute(`
        INSERT INTO hr_job_applications (
          job_id, 
          applicant_id, 
          status_id, 
          cover_letter, 
          interview_date, 
          offer_date, 
          board_order, 
          applied_at
        ) VALUES (?, ?, ?, ?, NULL, NULL, 0, NOW())
      `, [
        new_job_id,
        currentApp.applicant_id,
        statusId,
        cover_letter || currentApp.cover_letter || ''
      ]);

      const newApplicationId = insertResult[0].insertId;

      // Remover candidatura antiga
      await connection.execute(`
        DELETE FROM hr_job_applications
        WHERE id = ?
      `, [applicationId]);

      return {
        newApplicationId,
        oldApplicationId: applicationId,
        candidateName: currentApp.candidate_name,
        oldJobTitle: currentApp.job_title,
        newJobTitle: newJob[0].title
      };
    });

    // Emitir evento Socket.IO
    if (req.io) {
      req.io.emit('hr:application_reassigned', {
        old_application_id: applicationId,
        new_application_id: connection.newApplicationId,
        candidate_name: connection.candidateName,
        old_job_title: connection.oldJobTitle,
        new_job_title: connection.newJobTitle,
        new_status: new_status
      });
    }

    res.json({
      success: true,
      message: 'Candidato remanejado com sucesso',
      data: {
        new_application_id: connection.newApplicationId,
        candidate_name: connection.candidateName,
        new_job_title: connection.newJobTitle,
        new_status: new_status
      }
    });

  } catch (error) {
    console.error('Erro ao remanejar candidato:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao remanejar candidato'
    });
  }
};

// Função para upload de arquivo
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    const { applicant_id, description, is_resume = 0 } = req.body;
    
    if (!applicant_id) {
      return res.status(400).json({ message: 'applicant_id é obrigatório' });
    }

    // Buscar email do candidato
    const applicantResult = await executeQuery(`
      SELECT email FROM hr_applicants WHERE id = ?
    `, [applicant_id]);

    if (!applicantResult.length) {
      return res.status(404).json({ message: 'Candidato não encontrado' });
    }

    const candidateEmail = applicantResult[0].email;

    // Criar diretório se não existir
    const uploadDir = path.join(__dirname, '../../storageService/hr-job-openings');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Processar o primeiro arquivo (FilePond envia um por vez)
    const file = req.files[0];
    
    // Gerar hash do arquivo
    const fileHash = generateBufferHash(file.buffer || fs.readFileSync(file.path));
    
    // Gerar email_hash
    const emailHash = generateEmailHash(fileHash, candidateEmail);
    
    // Verificar se arquivo já existe para este email
    const existingFile = await getExistingFile(fileHash, candidateEmail, executeQuery);
    
    let insertResult;
    let isUpdate = false;
    
    if (existingFile) {
      console.log(`Arquivo existente encontrado: ${existingFile.file_name} (ID: ${existingFile.id})`);
      
      // Remover arquivo físico anterior
      let oldFileName = existingFile.file_url;
      if (oldFileName.includes('/storageService/hr-job-openings/')) {
        oldFileName = oldFileName.split('/').pop();
      }
      
      const oldFilePath = path.join(uploadDir, oldFileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log(`Arquivo físico anterior removido: ${oldFileName}`);
      }
      
      // Gerar nome único para o novo arquivo
      const timestamp = Date.now();
      const originalName = file.originalname;
      const fileName = `${timestamp}_${originalName}`;
      const filePath = path.join(uploadDir, fileName);

      // Mover arquivo para o diretório
      fs.renameSync(file.path, filePath);

      // Atualizar registro existente com o novo arquivo
      const fileSize = file.size || 0;
      const validFileSize = isNaN(fileSize) ? 0 : parseInt(fileSize);
      
      await executeQuery(`
        UPDATE hr_applicant_attachments 
        SET 
          file_name = ?,
          file_url = ?,
          file_size = ?,
          file_type = ?,
          description = ?,
          is_resume = ?,
          file_hash = ?,
          email_hash = ?,
          created_at = NOW()
        WHERE id = ?
      `, [
        originalName,
        fileName,
        validFileSize,
        file.mimetype,
        description || null,
        is_resume ? 1 : 0,
        fileHash,
        emailHash,
        existingFile.id
      ]);
      
      insertResult = { insertId: existingFile.id };
      isUpdate = true;
      
      console.log(`Arquivo existente substituído: ID ${existingFile.id} (novo arquivo físico)`);
      
    } else {
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const originalName = file.originalname;
      const fileName = `${timestamp}_${originalName}`;
      const filePath = path.join(uploadDir, fileName);

      // Mover arquivo para o diretório
      fs.renameSync(file.path, filePath);

      // Salvar no banco de dados com hash
      const fileSize = file.size || 0;
      const validFileSize = isNaN(fileSize) ? 0 : parseInt(fileSize);
      
      insertResult = await executeQuery(`
        INSERT INTO hr_applicant_attachments (
          applicant_id, file_name, file_url, file_type, file_size, 
          description, is_resume, file_hash, email_hash
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        applicant_id, 
        originalName, 
        fileName,
        file.mimetype, 
        validFileSize, 
        description || null, 
        is_resume ? 1 : 0,
        fileHash,
        emailHash
      ]);
      
      console.log(`Novo arquivo inserido: ID ${insertResult.insertId}`);
    }

    // Emitir evento Socket.IO para anexo adicionado
    if (req.io) {
      req.io.emit('hr:attachment_added', {
        attachment_id: insertResult.insertId,
        applicant_id: parseInt(applicant_id),
        file_name: file.originalname,
        file_url: `/api/hr-job-openings/attachments/${insertResult.insertId}`,
        file_type: file.mimetype,
        file_size: file.size || 0
      });
    }

    res.status(201).json({ 
      id: insertResult.insertId, 
      file_name: file.originalname,
      file_url: `/api/hr-job-openings/attachments/${insertResult.insertId}`,
      message: isUpdate ? 'Arquivo atualizado com sucesso' : 'Anexo adicionado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer upload do anexo:', error);
    res.status(500).json({ message: 'Erro interno ao fazer upload.' });
  }
};

// Função para buscar entrevistas do dia e enviar email de alerta
exports.getTodaysInterviews = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const interviews = await executeQuery(`
      SELECT 
        ja.id as application_id,
        ja.interview_date,
        ja.job_id,
        ap.name as candidate_name,
        ap.email as candidate_email,
        j.title as job_title,
        d.name as department_name,
        DATE_FORMAT(ja.interview_date, '%d/%m/%Y') as interview_date_formatted,
        DATE_FORMAT(ja.interview_date, '%H:%i') as interview_time
      FROM hr_job_applications ja
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      JOIN hr_job_postings j ON j.id = ja.job_id
      JOIN hr_departments d ON d.id = j.department_id
      JOIN hr_application_statuses s ON s.id = ja.status_id
      WHERE DATE(ja.interview_date) = ?
        AND s.name LIKE '%entrevista%'
        AND ja.interview_date IS NOT NULL
      ORDER BY ja.interview_date ASC
    `, [today]);

    return interviews;
  } catch (error) {
    console.error('Erro ao buscar entrevistas do dia:', error);
    throw error;
  }
};

// Função para enviar email de alerta diário de entrevistas
exports.sendInterviewAlertEmail = async () => {
  try {
    const { sendEmail } = require('../support/send-email');
    const { hrCandidateTemplates } = require('../support/hr-candidate-templates');
    const { getAllRecipientEmails, getConfig } = require('../config/interview-email-config');
    
    const config = getConfig();
    const recipientEmails = getAllRecipientEmails();
    
    if (recipientEmails.length === 0) {
      console.log('⚠️ Nenhum email configurado para receber alertas de entrevista');
      return { success: false, message: 'Nenhum email configurado' };
    }
    
    // Buscar entrevistas do dia
    const todaysInterviews = await exports.getTodaysInterviews();
    const today = new Date().toLocaleDateString('pt-BR');
    
    // Gerar HTML do email
    const htmlContent = await hrCandidateTemplates.interviewAlertEmail.generate(todaysInterviews, today);
    
    // Assunto do email
    const subject = `${config.email.subjectPrefix}📅 Alerta de Entrevistas - ${today}`;
    
    // Enviar email para todos os destinatários
    const results = [];
    for (const email of recipientEmails) {
      try {
        const result = await sendEmail(email, subject, htmlContent);
        
        if (result.success) {
          console.log(`✅ Email de alerta enviado para ${email}: ${todaysInterviews.length} entrevistas`);
          results.push({ success: true, email });
        } else {
          console.error(`❌ Erro ao enviar email de alerta para ${email}:`, result.error);
          results.push({ success: false, email, error: result.error });
        }
      } catch (error) {
        console.error(`❌ Erro ao processar alerta para ${email}:`, error);
        results.push({ success: false, email, error: error.message });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`📊 Resumo de alertas: ${successful}/${results.length} emails enviados com sucesso`);
    console.log(`📅 Total de entrevistas hoje: ${todaysInterviews.length}`);
    
    return {
      success: results.some(r => r.success),
      results: results,
      total: todaysInterviews.length,
      successful: successful
    };
  } catch (error) {
    console.error('❌ Erro ao enviar emails de alerta de entrevistas:', error);
    throw error;
  }
};

// Função para remover anexo
exports.removeAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    if (!attachmentId) {
      return res.status(400).json({ message: 'ID do anexo é obrigatório' });
    }
    
    // Buscar informações do anexo
    const attachments = await executeQuery(`
      SELECT aa.id, aa.file_name, aa.file_url, aa.applicant_id
      FROM hr_applicant_attachments aa
      WHERE aa.id = ?
    `, [attachmentId]);
    
    if (!attachments || attachments.length === 0) {
      return res.status(404).json({ message: 'Anexo não encontrado' });
    }
    
    const attachment = attachments[0];
    
    // Extrair nome do arquivo
    let fileName = attachment.file_url;
    if (fileName.includes('/storageService/hr-job-openings/')) {
      fileName = fileName.split('/').pop();
    }
    
    // Caminho do arquivo no servidor
    const filePath = path.join(__dirname, '../../storageService/hr-job-openings', fileName);
    
    // Remover do banco de dados
    await executeQuery('DELETE FROM hr_applicant_attachments WHERE id = ?', [attachmentId]);
    
    // Remover arquivo do servidor
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Arquivo removido: ${filePath}`);
    }
    
    console.log(`Anexo removido: ID=${attachmentId}, Arquivo=${attachment.file_name}`);
    
    // Emitir evento Socket.IO para anexo removido
    if (req.io) {
      req.io.emit('hr:attachment_removed', {
        attachment_id: parseInt(attachmentId),
        applicant_id: attachment.applicant_id,
        file_name: attachment.file_name
      });
    }
    
    res.json({ message: 'Anexo removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover anexo:', error);
    res.status(500).json({ message: 'Erro interno ao remover anexo' });
  }
};

// Buscar anexos de um candidato
exports.getApplicantAttachments = async (req, res) => {
  try {
    const { applicantId } = req.params;
    
    const attachments = await executeQuery(`
      SELECT 
        id, 
        file_name, 
        file_url, 
        file_size,
        file_type,
        is_resume,
        description,
        created_at
      FROM hr_applicant_attachments 
      WHERE applicant_id = ?
      ORDER BY is_resume DESC, created_at DESC
    `, [applicantId]);
    
    res.json(attachments);
  } catch (error) {
    console.error('Erro ao buscar anexos:', error);
    res.status(500).json({ message: 'Erro ao buscar anexos' });
  }
};

// Upload de anexo para candidato (usado no Banco de Talentos)
exports.uploadApplicantAttachment = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    const { applicantId } = req.params;
    const { description, is_resume = 0 } = req.body;
    
    // Buscar email do candidato
    const applicantResult = await executeQuery(`
      SELECT email FROM hr_applicants WHERE id = ?
    `, [applicantId]);

    if (!applicantResult.length) {
      return res.status(404).json({ message: 'Candidato não encontrado' });
    }

    const candidateEmail = applicantResult[0].email;
    
    // Criar diretório se não existir
    const uploadDir = path.join(__dirname, '../../storageService/hr-job-openings');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Processar o primeiro arquivo
    const file = req.files[0];
    
    // Gerar hash do arquivo
    const fileHash = generateBufferHash(file.buffer || fs.readFileSync(file.path));
    
    // Gerar email_hash
    const emailHash = generateEmailHash(fileHash, candidateEmail);
    
    // Verificar se arquivo já existe para este email
    const existingFile = await getExistingFile(fileHash, candidateEmail, executeQuery);
    
    let insertResult;
    let isUpdate = false;
    
    if (existingFile) {
      console.log(`Arquivo existente encontrado: ${existingFile.file_name} (ID: ${existingFile.id})`);
      
      // Remover arquivo físico anterior
      let oldFileName = existingFile.file_url;
      if (oldFileName.includes('/storageService/hr-job-openings/')) {
        oldFileName = oldFileName.split('/').pop();
      }
      
      const oldFilePath = path.join(uploadDir, oldFileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log(`Arquivo físico anterior removido: ${oldFileName}`);
      }
      
      // Gerar nome único para o novo arquivo
      const timestamp = Date.now();
      const originalName = file.originalname;
      const fileName = `${timestamp}_${originalName}`;
      const filePath = path.join(uploadDir, fileName);

      // Mover arquivo para o diretório
      fs.renameSync(file.path, filePath);

      // Atualizar registro existente com o novo arquivo
      const fileSize = file.size || 0;
      const validFileSize = isNaN(fileSize) ? 0 : parseInt(fileSize);
      
      await executeQuery(`
        UPDATE hr_applicant_attachments 
        SET 
          file_name = ?,
          file_url = ?,
          file_size = ?,
          file_type = ?,
          is_resume = ?,
          description = ?,
          file_hash = ?,
          email_hash = ?,
          created_at = NOW()
        WHERE id = ?
      `, [
        originalName,
        fileName,
        validFileSize,
        file.mimetype || 'application/octet-stream',
        is_resume,
        description || originalName,
        fileHash,
        emailHash,
        existingFile.id
      ]);
      
      insertResult = { insertId: existingFile.id };
      isUpdate = true;
      
      console.log(`Arquivo existente substituído: ID ${existingFile.id} (novo arquivo físico)`);
      
    } else {
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const originalName = file.originalname;
      const fileName = `${timestamp}_${originalName}`;
      const filePath = path.join(uploadDir, fileName);

      // Mover arquivo para o diretório
      fs.renameSync(file.path, filePath);

      // Salvar no banco de dados com hash
      const fileSize = file.size || 0;
      const validFileSize = isNaN(fileSize) ? 0 : parseInt(fileSize);
      
      insertResult = await executeQuery(`
        INSERT INTO hr_applicant_attachments (
          applicant_id, file_name, file_url, file_size, file_type, 
          is_resume, description, file_hash, email_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        applicantId,
        originalName,
        fileName,
        validFileSize,
        file.mimetype || 'application/octet-stream',
        is_resume,
        description || originalName,
        fileHash,
        emailHash
      ]);
      
      console.log(`Novo arquivo inserido: ID ${insertResult.insertId}`);
    }

    // Emitir evento Socket.IO
    if (req.io) {
      req.io.emit('hr:attachment_added', {
        attachment_id: insertResult.insertId,
        applicant_id: parseInt(applicantId),
        file_name: file.originalname
      });
    }

    res.json({
      id: insertResult.insertId,
      file_name: file.originalname,
      message: isUpdate ? 'Arquivo atualizado com sucesso' : 'Arquivo enviado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ message: 'Erro ao fazer upload do arquivo' });
  }
};

// Adicionar nota para um candidato (por email)
exports.addCandidateNote = async (req, res) => {
  try {
    const { email } = req.params;
    const { note, author_id = 0 } = req.body;
    
    console.log('🔍 Debug - Dados recebidos:', { email, note, author_id });
    
    if (!note || !note.trim()) {
      return res.status(400).json({ message: 'Nota é obrigatória' });
    }

    // Buscar o candidato e sua primeira aplicação
    const candidate = await executeQuery(`
      SELECT ja.id as application_id
      FROM hr_applicants a
      JOIN hr_job_applications ja ON ja.applicant_id = a.id
      WHERE a.email = ?
      ORDER BY ja.applied_at DESC
      LIMIT 1
    `, [email]);

    if (!candidate || candidate.length === 0) {
      return res.status(404).json({ message: 'Candidato não encontrado' });
    }

    const { application_id } = candidate[0];

    // Adicionar a nota com o author_id correto
    const result = await executeQuery(`
      INSERT INTO hr_application_internal_notes (application_id, author_id, note)
      VALUES (?, ?, ?)
    `, [application_id, author_id, note.trim()]);

    // Emitir evento Socket.IO
    if (req.io) {
      req.io.emit('hr:note_added', {
        note_id: result.insertId,
        application_id: application_id,
        note: note.trim()
      });
    }

    res.json({
      success: true,
      message: 'Nota adicionada com sucesso',
      data: {
        note_id: result.insertId,
        author_id: author_id
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar nota do candidato:', error);
    res.status(500).json({ message: 'Erro ao adicionar nota' });
  }
};

// Buscar notas de uma aplicação
exports.getApplicationNotes = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const notes = await executeQuery(`
      SELECT 
        n.id,
        n.note,
        n.created_at,
        n.author_id,
        CASE 
          WHEN c1.name IS NOT NULL THEN CONCAT(c1.name, ' ', COALESCE(c1.family_name, ''))
          WHEN c2.name IS NOT NULL THEN CONCAT(c2.name, ' ', COALESCE(c2.family_name, ''))
          ELSE 'Sistema'
        END as author_name
      FROM hr_application_internal_notes n
      LEFT JOIN collaborators c1 ON c1.id = n.author_id
      LEFT JOIN users u ON u.id = n.author_id
      LEFT JOIN collaborators c2 ON c2.id = u.collaborator_id
      WHERE n.application_id = ?
      ORDER BY n.created_at DESC
    `, [applicationId]);
    
    res.json({ notes });
  } catch (error) {
    console.error('Erro ao buscar notas:', error);
    res.status(500).json({ message: 'Erro ao buscar notas' });
  }
};

// Buscar TODAS as observações de um candidato por email
exports.getCandidateAllNotes = async (req, res) => {
  try {
    const { email } = req.params;
    
    const notes = await executeQuery(`
      SELECT 
        n.id,
        n.note,
        n.created_at,
        n.author_id,
        ja.id as application_id,
        jp.title as job_title,
        CASE 
          WHEN c1.name IS NOT NULL THEN CONCAT(c1.name, ' ', COALESCE(c1.family_name, ''))
          WHEN c2.name IS NOT NULL THEN CONCAT(c2.name, ' ', COALESCE(c2.family_name, ''))
          ELSE 'Sistema'
        END as author_name
      FROM hr_application_internal_notes n
      JOIN hr_job_applications ja ON ja.id = n.application_id
      JOIN hr_applicants a ON a.id = ja.applicant_id
      JOIN hr_job_postings jp ON jp.id = ja.job_id
      LEFT JOIN collaborators c1 ON c1.id = n.author_id
      LEFT JOIN users u ON u.id = n.author_id
      LEFT JOIN collaborators c2 ON c2.id = u.collaborator_id
      WHERE a.email = ?
      ORDER BY n.created_at DESC
    `, [email]);
    
    res.json({ 
      success: true,
      notes: notes,
      total: notes.length
    });
  } catch (error) {
    console.error('Erro ao buscar todas as notas do candidato:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar observações do candidato' 
    });
  }
};

// Atualizar dados do candidato
exports.updateApplicant = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { name, email, phone, linkedin_url } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Nome e email são obrigatórios' });
    }
    
    const updateResult = await executeQuery(`
      UPDATE hr_applicants 
      SET name = ?, email = ?, phone = ?, linkedin_url = ?
      WHERE id = ?
    `, [name, email, phone || null, linkedin_url || null, applicantId]);
    
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Candidato não encontrado' });
    }
    
    // Emitir evento Socket.IO
    if (req.io) {
      req.io.emit('hr:applicant_updated', {
        applicant_id: parseInt(applicantId),
        name,
        email,
        phone,
        linkedin_url
      });
    }
    
    res.json({ message: 'Candidato atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar candidato:', error);
    res.status(500).json({ message: 'Erro ao atualizar candidato' });
  }
};

// Atualizar aplicação (status e carta)
exports.updateApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status_id, cover_letter } = req.body;
    
    const updateFields = [];
    const updateValues = [];
    
    if (status_id !== undefined) {
      updateFields.push('status_id = ?');
      updateValues.push(status_id);
    }
    
    if (cover_letter !== undefined) {
      updateFields.push('cover_letter = ?');
      updateValues.push(cover_letter);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }
    
    updateValues.push(applicationId);
    
    const updateResult = await executeQuery(`
      UPDATE hr_job_applications 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);
    
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Aplicação não encontrada' });
    }
    
    // Emitir evento Socket.IO
    if (req.io) {
      req.io.emit('hr:application_updated', {
        application_id: parseInt(applicationId),
        status_id,
        cover_letter
      });
    }
    
    res.json({ message: 'Aplicação atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar aplicação:', error);
    res.status(500).json({ message: 'Erro ao atualizar aplicação' });
  }
}; 

// Remover candidato e todos os dados relacionados
exports.removeApplicant = async (req, res) => {
  try {
    const { applicantId } = req.params;
    
    if (!applicantId) {
      return res.status(400).json({ message: 'ID do candidato é obrigatório' });
    }
    
    // Buscar informações do candidato
    const applicantResult = await executeQuery(`
      SELECT 
        a.id,
        a.name,
        a.email,
        COUNT(DISTINCT ja.id) as total_applications,
        COUNT(DISTINCT aa.id) as total_attachments,
        COUNT(DISTINCT ain.id) as total_notes
      FROM hr_applicants a
      LEFT JOIN hr_job_applications ja ON ja.applicant_id = a.id
      LEFT JOIN hr_applicant_attachments aa ON aa.applicant_id = a.id
      LEFT JOIN hr_application_internal_notes ain ON ain.application_id = ja.id
      WHERE a.id = ?
      GROUP BY a.id, a.name, a.email
    `, [applicantId]);
    
    if (!applicantResult || applicantResult.length === 0) {
      return res.status(404).json({ message: 'Candidato não encontrado' });
    }
    
    const applicant = applicantResult[0];
    
    console.log(`Iniciando remoção do candidato: ${applicant.name} (${applicant.email})`);
    console.log(`- Candidaturas: ${applicant.total_applications}`);
    console.log(`- Anexos: ${applicant.total_attachments}`);
    console.log(`- Observações: ${applicant.total_notes}`);
    
    // Buscar todos os anexos para remoção física
    const attachments = await executeQuery(`
      SELECT file_url FROM hr_applicant_attachments WHERE applicant_id = ?
    `, [applicantId]);
    
    // Iniciar transação
    await executeTransaction(async (conn) => {
      // 1. Remover observações internas (CASCADE automático, mas vamos fazer explicitamente)
      await conn.query(`
        DELETE ain FROM hr_application_internal_notes ain
        INNER JOIN hr_job_applications ja ON ja.id = ain.application_id
        WHERE ja.applicant_id = ?
      `, [applicantId]);
      
      console.log(`Observações internas removidas`);
      
      // 2. Remover candidaturas (isso também remove observações por CASCADE)
      await conn.query(`
        DELETE FROM hr_job_applications WHERE applicant_id = ?
      `, [applicantId]);
      
      console.log(`Candidaturas removidas`);
      
      // 3. Remover anexos do banco
      await conn.query(`
        DELETE FROM hr_applicant_attachments WHERE applicant_id = ?
      `, [applicantId]);
      
      console.log(`Anexos removidos do banco`);
      
      // 4. Remover candidato
      await conn.query(`
        DELETE FROM hr_applicants WHERE id = ?
      `, [applicantId]);
      
      console.log(`Candidato removido do banco`);
    });
    
    // Remover arquivos físicos
    const uploadDir = path.join(__dirname, '../../storageService/hr-job-openings');
    let filesRemoved = 0;
    
    for (const attachment of attachments) {
      try {
        let fileName = attachment.file_url;
        if (fileName.includes('/storageService/hr-job-openings/')) {
          fileName = fileName.split('/').pop();
        }
        
        const filePath = path.join(uploadDir, fileName);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          filesRemoved++;
          console.log(`Arquivo físico removido: ${fileName}`);
        }
      } catch (error) {
        console.error(`Erro ao remover arquivo físico: ${attachment.file_url}`, error);
      }
    }
    
    console.log(`Total de arquivos físicos removidos: ${filesRemoved}`);
    
    // Emitir evento Socket.IO
    if (req.io) {
      req.io.emit('hr:applicant_removed', {
        applicant_id: parseInt(applicantId),
        applicant_name: applicant.name,
        applicant_email: applicant.email,
        total_applications: applicant.total_applications,
        total_attachments: applicant.total_attachments,
        total_notes: applicant.total_notes
      });
    }
    
    res.json({
      success: true,
      message: 'Candidato removido com sucesso',
      data: {
        applicant_name: applicant.name,
        applicant_email: applicant.email,
        total_applications: applicant.total_applications,
        total_attachments: applicant.total_attachments,
        total_notes: applicant.total_notes,
        files_removed: filesRemoved
      }
    });
    
  } catch (error) {
    console.error('Erro ao remover candidato:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno ao remover candidato' 
    });
  }
};

// Remanejar candidato para nova vaga
exports.reassignApplicant = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { job_id, status_id } = req.body;
    
    if (!applicantId || !job_id || !status_id) {
      return res.status(400).json({ message: 'ID do candidato, vaga e status são obrigatórios' });
    }
    
    // Verificar se o candidato existe
    const applicant = await executeQuery(`
      SELECT id, name, email FROM hr_applicants WHERE id = ?
    `, [applicantId]);
    
    if (!applicant || applicant.length === 0) {
      return res.status(404).json({ message: 'Candidato não encontrado' });
    }
    
    // Verificar se a vaga existe
    const job = await executeQuery(`
      SELECT id, title FROM hr_job_postings WHERE id = ?
    `, [job_id]);
    
    if (!job || job.length === 0) {
      return res.status(404).json({ message: 'Vaga não encontrada' });
    }
    
    // Verificar se já existe uma aplicação para esta vaga
    const existingApplication = await executeQuery(`
      SELECT id FROM hr_job_applications 
      WHERE applicant_id = ? AND job_id = ?
    `, [applicantId, job_id]);
    
    if (existingApplication && existingApplication.length > 0) {
      return res.status(400).json({ message: 'Candidato já possui uma candidatura para esta vaga' });
    }
    
    console.log(`Remanejando candidato ${applicant[0].name} para vaga ${job[0].title}`);
    
    // Criar nova aplicação
    const result = await executeQuery(`
      INSERT INTO hr_job_applications (applicant_id, job_id, status_id, applied_at)
      VALUES (?, ?, ?, NOW())
    `, [applicantId, job_id, status_id]);
    
    const newApplicationId = result.insertId;
    
    console.log(`Nova aplicação criada: ID ${newApplicationId}`);
    
    // Emitir evento Socket.IO
    if (req.io) {
      req.io.emit('hr:application_reassigned', {
        applicant_id: parseInt(applicantId),
        job_id: parseInt(job_id),
        application_id: newApplicationId,
        status_id: parseInt(status_id)
      });
    }
    
    res.json({
      success: true,
      message: 'Candidato remanejado com sucesso',
      data: {
        application_id: newApplicationId,
        candidate_name: applicant[0].name,
        candidate_email: applicant[0].email,
        job_title: job[0].title,
        status_id: parseInt(status_id)
      }
    });
    
  } catch (error) {
    console.error('Erro ao remanejar candidato:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno ao remanejar candidato' 
    });
  }
};

// Buscar candidaturas de um candidato específico (sem duplicatas)
exports.getApplicantApplications = async (req, res) => {
  try {
    const { applicantId } = req.params;
    
    if (!applicantId) {
      return res.status(400).json({ message: 'ID do candidato é obrigatório' });
    }
    
    const applications = await executeQuery(`
      SELECT 
        ja.id as application_id,
        ja.applied_at,
        ja.interview_date,
        ja.offer_date,
        jp.id as job_id,
        jp.id as job_posting_id,
        jp.title as job_title,
        jp.status as job_status,
        s.id as status_id,
        s.name as status_name,
        d.id as department_id,
        d.name as department_name,
        l.id as location_id,
        l.name as location_name,
        re.sent_at as rejection_email_sent
      FROM hr_job_applications ja
      JOIN hr_job_postings jp ON jp.id = ja.job_id
      JOIN hr_application_statuses s ON s.id = ja.status_id
      LEFT JOIN hr_departments d ON d.id = jp.department_id
      LEFT JOIN hr_locations l ON l.id = jp.location_id
      LEFT JOIN hr_rejection_emails re ON re.applicant_id = ja.applicant_id AND re.job_posting_id = jp.id AND re.email_type = 'rejection'
      WHERE ja.applicant_id = ?
      ORDER BY ja.applied_at DESC
    `, [applicantId]);
    
    res.json({
      success: true,
      applications: applications,
      total: applications.length
    });
    
  } catch (error) {
    console.error('Erro ao buscar candidaturas do candidato:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno ao buscar candidaturas' 
    });
  }
};

// Função para buscar entrevistas próximas (15 min antes)
exports.getUpcomingInterviews = async () => {
  try {
    const now = new Date();
    const in15Minutes = new Date(now.getTime() + 15 * 60000); // 15 minutos a partir de agora
    
    // Buscar entrevistas que acontecerão nos próximos 15 minutos (apenas futuras)
    const interviews = await executeQuery(`
      SELECT 
        ja.id as application_id,
        ja.interview_date,
        ja.job_id,
        ap.name as candidate_name,
        ap.email as candidate_email,
        j.title as job_title,
        d.name as department_name,
        DATE_FORMAT(ja.interview_date, '%d/%m/%Y') as interview_date_formatted,
        DATE_FORMAT(ja.interview_date, '%H:%i') as interview_time,
        TIMESTAMPDIFF(MINUTE, NOW(), ja.interview_date) as minutes_until
      FROM hr_job_applications ja
      JOIN hr_applicants ap ON ap.id = ja.applicant_id
      JOIN hr_job_postings j ON j.id = ja.job_id
      JOIN hr_departments d ON d.id = j.department_id
      JOIN hr_application_statuses s ON s.id = ja.status_id
      WHERE ja.interview_date > NOW()
        AND ja.interview_date <= ?
        AND s.name LIKE '%entrevista%'
        AND ja.interview_date IS NOT NULL
      ORDER BY ja.interview_date ASC
    `, [in15Minutes]);

    // Filtrar apenas entrevistas com minutos_until entre 0 e 15
    const filteredInterviews = interviews.filter(interview => {
      const minutesUntil = parseInt(interview.minutes_until);
      return minutesUntil >= 0 && minutesUntil <= 15;
    });

    return filteredInterviews;
  } catch (error) {
    console.error('Erro ao buscar entrevistas próximas:', error);
    throw error;
  }
};

// Função para enviar email de lembrete 15 min antes da entrevista
exports.sendInterviewReminderEmail = async () => {
  try {
    const { sendEmail } = require('../support/send-email');
    const { hrCandidateTemplates } = require('../support/hr-candidate-templates');
    const { getAllRecipientEmails, getConfig } = require('../config/interview-email-config');
    
    const config = getConfig();
    const recipientEmails = getAllRecipientEmails();
    
    if (recipientEmails.length === 0) {
      console.log('⚠️ Nenhum email configurado para receber lembretes de entrevista');
      return { success: false, message: 'Nenhum email configurado' };
    }
    
    // Buscar entrevistas próximas (15 min antes)
    const interviews = await exports.getUpcomingInterviews();
    
    if (interviews.length === 0) {
      console.log('⏰ Nenhuma entrevista próxima (15 min antes)');
      return { success: true, message: 'Nenhuma entrevista próxima', total: 0 };
    }
    
    console.log(`⏰ Encontradas ${interviews.length} entrevista(s) próxima(s)`);
    
    // Enviar email para cada entrevista
    const results = [];
    for (const interview of interviews) {
      try {
        // Gerar HTML do email
        const htmlContent = await hrCandidateTemplates.interviewReminderEmail.generate(interview);
        
        // Assunto do email
        const subject = `${config.email.subjectPrefix}⏰ Lembrete: Entrevista em ${interview.minutes_until} min - ${interview.candidate_name}`;
        
        // Enviar email para todos os destinatários (RH)
        for (const email of recipientEmails) {
          try {
            const result = await sendEmail(email, subject, htmlContent);
            
            if (result.success) {
              console.log(`✅ Email de lembrete enviado para ${email}: ${interview.candidate_name} (${interview.interview_time})`);
              results.push({ success: true, email, interview, type: 'rh' });
            } else {
              console.error(`❌ Erro ao enviar email de lembrete para ${email}: ${interview.candidate_name}`, result.error);
              results.push({ success: false, email, error: result.error, interview, type: 'rh' });
            }
          } catch (error) {
            console.error(`❌ Erro ao processar lembrete para ${email}: ${interview.candidate_name}`, error);
            results.push({ success: false, email, error: error.message, interview, type: 'rh' });
          }
        }

        // Enviar email de lembrete para o candidato
        try {
          const candidateResult = await exports.sendCandidateInterviewReminder(interview);
          if (candidateResult.success) {
            console.log(`✅ Email de lembrete enviado para candidato: ${interview.candidate_name} (${interview.candidate_email})`);
            results.push({ success: true, email: interview.candidate_email, interview, type: 'candidate' });
          } else {
            console.error(`❌ Erro ao enviar email de lembrete para candidato: ${interview.candidate_name}`, candidateResult.error);
            results.push({ success: false, email: interview.candidate_email, error: candidateResult.error, interview, type: 'candidate' });
          }
        } catch (candidateError) {
          console.error(`❌ Erro ao processar lembrete para candidato: ${interview.candidate_name}`, candidateError);
          results.push({ success: false, email: interview.candidate_email, error: candidateError.message, interview, type: 'candidate' });
        }
      } catch (error) {
        console.error(`❌ Erro ao processar lembrete para: ${interview.candidate_name}`, error);
        results.push({ success: false, error: error.message, interview });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`📊 Resumo de lembretes: ${successful}/${results.length} emails enviados com sucesso`);
    console.log(`⏰ Total de entrevistas próximas: ${interviews.length}`);
    
    return {
      success: results.some(r => r.success),
      results: results,
      total: interviews.length,
      successful: successful
    };
  } catch (error) {
    console.error('❌ Erro ao enviar emails de lembrete de entrevistas:', error);
    throw error;
  }
};

// Função para enviar email de confirmação de candidatura ao candidato
exports.sendCandidateApplicationConfirmation = async (applicationData) => {
  try {
    const { sendEmail } = require('../support/send-email');
    const { hrCandidateTemplates } = require('../support/hr-candidate-templates');
    
    // Gerar HTML do email
    const htmlContent = await hrCandidateTemplates.applicationConfirmation.generate(applicationData);
    
    // Assunto do email
    const subject = `[Sirius System] ✅ Candidatura Confirmada - ${applicationData.job_title}`;
    
    // Enviar email para o candidato
    const result = await sendEmail(applicationData.candidate_email, subject, htmlContent);
    
    if (result.success) {
      console.log(`✅ Email de confirmação enviado para candidato: ${applicationData.candidate_name} (${applicationData.candidate_email})`);
    } else {
      console.error(`❌ Erro ao enviar email de confirmação para: ${applicationData.candidate_name}`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao enviar email de confirmação para candidato:', error);
    throw error;
  }
};

// Função para enviar email de lembrete de entrevista ao candidato
exports.sendCandidateInterviewReminder = async (interviewData) => {
  try {
    const { sendEmail } = require('../support/send-email');
    const { hrCandidateTemplates } = require('../support/hr-candidate-templates');
    
    // Gerar HTML do email
    const htmlContent = await hrCandidateTemplates.interviewReminder.generate(interviewData);
    
    // Assunto do email
    const subject = `[Sirius System] ⏰ Lembrete: Entrevista em ${interviewData.minutes_until} min - ${interviewData.job_title}`;
    
    // Enviar email para o candidato
    const result = await sendEmail(interviewData.candidate_email, subject, htmlContent);
    
    if (result.success) {
      console.log(`✅ Email de lembrete enviado para candidato: ${interviewData.candidate_name} (${interviewData.candidate_email})`);
    } else {
      console.error(`❌ Erro ao enviar email de lembrete para candidato: ${interviewData.candidate_name}`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao enviar email de lembrete para candidato:', error);
    throw error;
  }
};

// ========== FUNÇÕES PARA TEMPLATES PREDEFINIDOS POR DEPARTAMENTO ==========

// Buscar templates por departamento
exports.getDepartmentTemplates = async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    if (!departmentId) {
      return res.status(400).json({ message: 'ID do departamento é obrigatório' });
    }
    
    // Buscar todos os templates do departamento
    const responsibilities = await executeQuery(`
      SELECT id, position, text, is_active
      FROM hr_department_responsibilities_templates
      WHERE department_id = ? AND is_active = 1
      ORDER BY position ASC
    `, [departmentId]);
    
    const requirements = await executeQuery(`
      SELECT id, position, text, is_active
      FROM hr_department_requirements_templates
      WHERE department_id = ? AND is_active = 1
      ORDER BY position ASC
    `, [departmentId]);
    
    const benefits = await executeQuery(`
      SELECT id, position, text, is_active
      FROM hr_department_benefits_templates
      WHERE department_id = ? AND is_active = 1
      ORDER BY position ASC
    `, [departmentId]);
    
    const niceToHave = await executeQuery(`
      SELECT id, position, text, is_active
      FROM hr_department_nice_to_have_templates
      WHERE department_id = ? AND is_active = 1
      ORDER BY position ASC
    `, [departmentId]);
    
    res.json({
      success: true,
      data: {
        responsibilities: responsibilities.map(r => r.text),
        requirements: requirements.map(r => r.text),
        benefits: benefits.map(b => b.text),
        niceToHave: niceToHave.map(n => n.text)
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar templates do departamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao buscar templates' 
    });
  }
};

// Buscar todos os templates organizados por departamento
exports.getAllDepartmentTemplates = async (req, res) => {
  try {
    // Buscar todos os departamentos
    const departments = await executeQuery(`
      SELECT id, name
      FROM hr_departments
      WHERE is_active = 1
      ORDER BY name ASC
    `);
    
    const result = {};
    
    for (const dept of departments) {
      const responsibilities = await executeQuery(`
        SELECT id, position, text, is_active
        FROM hr_department_responsibilities_templates
        WHERE department_id = ? AND is_active = 1
        ORDER BY position ASC
      `, [dept.id]);
      
      const requirements = await executeQuery(`
        SELECT id, position, text, is_active
        FROM hr_department_requirements_templates
        WHERE department_id = ? AND is_active = 1
        ORDER BY position ASC
      `, [dept.id]);
      
      const benefits = await executeQuery(`
        SELECT id, position, text, is_active
        FROM hr_department_benefits_templates
        WHERE department_id = ? AND is_active = 1
        ORDER BY position ASC
      `, [dept.id]);
      
      const niceToHave = await executeQuery(`
        SELECT id, position, text, is_active
        FROM hr_department_nice_to_have_templates
        WHERE department_id = ? AND is_active = 1
        ORDER BY position ASC
      `, [dept.id]);
      
      result[dept.id] = {
        department_name: dept.name,
        responsibilities: responsibilities,
        requirements: requirements,
        benefits: benefits,
        niceToHave: niceToHave
      };
    }
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Erro ao buscar todos os templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao buscar templates' 
    });
  }
};

// Salvar templates de responsabilidades
exports.saveDepartmentResponsibilities = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { responsibilities } = req.body;
    
    if (!departmentId) {
      return res.status(400).json({ message: 'ID do departamento é obrigatório' });
    }
    
    if (!Array.isArray(responsibilities)) {
      return res.status(400).json({ message: 'Responsabilidades devem ser um array' });
    }
    
    await executeTransaction(async (conn) => {
      // Desativar templates existentes
      await conn.query(`
        UPDATE hr_department_responsibilities_templates
        SET is_active = 0
        WHERE department_id = ?
      `, [departmentId]);
      
      // Inserir novos templates
      for (let i = 0; i < responsibilities.length; i++) {
        const text = responsibilities[i].trim();
        if (text) {
          await conn.query(`
            INSERT INTO hr_department_responsibilities_templates (department_id, position, text)
            VALUES (?, ?, ?)
          `, [departmentId, i + 1, text]);
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Templates de responsabilidades salvos com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao salvar templates de responsabilidades:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao salvar templates' 
    });
  }
};

// Salvar templates de requisitos
exports.saveDepartmentRequirements = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { requirements } = req.body;
    
    if (!departmentId) {
      return res.status(400).json({ message: 'ID do departamento é obrigatório' });
    }
    
    if (!Array.isArray(requirements)) {
      return res.status(400).json({ message: 'Requisitos devem ser um array' });
    }
    
    await executeTransaction(async (conn) => {
      // Desativar templates existentes
      await conn.query(`
        UPDATE hr_department_requirements_templates
        SET is_active = 0
        WHERE department_id = ?
      `, [departmentId]);
      
      // Inserir novos templates
      for (let i = 0; i < requirements.length; i++) {
        const text = requirements[i].trim();
        if (text) {
          await conn.query(`
            INSERT INTO hr_department_requirements_templates (department_id, position, text)
            VALUES (?, ?, ?)
          `, [departmentId, i + 1, text]);
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Templates de requisitos salvos com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao salvar templates de requisitos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao salvar templates' 
    });
  }
};

// Salvar templates de benefícios
exports.saveDepartmentBenefits = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { benefits } = req.body;
    
    if (!departmentId) {
      return res.status(400).json({ message: 'ID do departamento é obrigatório' });
    }
    
    if (!Array.isArray(benefits)) {
      return res.status(400).json({ message: 'Benefícios devem ser um array' });
    }
    
    await executeTransaction(async (conn) => {
      // Desativar templates existentes
      await conn.query(`
        UPDATE hr_department_benefits_templates
        SET is_active = 0
        WHERE department_id = ?
      `, [departmentId]);
      
      // Inserir novos templates
      for (let i = 0; i < benefits.length; i++) {
        const text = benefits[i].trim();
        if (text) {
          await conn.query(`
            INSERT INTO hr_department_benefits_templates (department_id, position, text)
            VALUES (?, ?, ?)
          `, [departmentId, i + 1, text]);
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Templates de benefícios salvos com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao salvar templates de benefícios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao salvar templates' 
    });
  }
};

// Salvar templates de diferenciais
exports.saveDepartmentNiceToHave = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { niceToHave } = req.body;
    
    if (!departmentId) {
      return res.status(400).json({ message: 'ID do departamento é obrigatório' });
    }
    
    if (!Array.isArray(niceToHave)) {
      return res.status(400).json({ message: 'Diferenciais devem ser um array' });
    }
    
    await executeTransaction(async (conn) => {
      // Desativar templates existentes
      await conn.query(`
        UPDATE hr_department_nice_to_have_templates
        SET is_active = 0
        WHERE department_id = ?
      `, [departmentId]);
      
      // Inserir novos templates
      for (let i = 0; i < niceToHave.length; i++) {
        const text = niceToHave[i].trim();
        if (text) {
          await conn.query(`
            INSERT INTO hr_department_nice_to_have_templates (department_id, position, text)
            VALUES (?, ?, ?)
          `, [departmentId, i + 1, text]);
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Templates de diferenciais salvos com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao salvar templates de diferenciais:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao salvar templates' 
    });
  }
};

// Função temporária para criar tabelas de templates
exports.createTemplatesTables = async (req, res) => {
  try {
    // Criar tabelas de templates
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS hr_department_responsibilities_templates (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        department_id INT NOT NULL,
        position INT NOT NULL DEFAULT 1,
        text TEXT NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_hr_department_responsibilities_department (department_id),
        INDEX idx_hr_department_responsibilities_position (position),
        INDEX idx_hr_department_responsibilities_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS hr_department_requirements_templates (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        department_id INT NOT NULL,
        position INT NOT NULL DEFAULT 1,
        text TEXT NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_hr_department_requirements_department (department_id),
        INDEX idx_hr_department_requirements_position (position),
        INDEX idx_hr_department_requirements_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS hr_department_benefits_templates (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        department_id INT NOT NULL,
        position INT NOT NULL DEFAULT 1,
        text TEXT NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_hr_department_benefits_department (department_id),
        INDEX idx_hr_department_benefits_position (position),
        INDEX idx_hr_department_benefits_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS hr_department_nice_to_have_templates (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        department_id INT NOT NULL,
        position INT NOT NULL DEFAULT 1,
        text TEXT NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_hr_department_nice_to_have_department (department_id),
        INDEX idx_hr_department_nice_to_have_position (position),
        INDEX idx_hr_department_nice_to_have_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Inserir templates de exemplo para Tecnologia
    await executeQuery(`
      INSERT INTO hr_department_responsibilities_templates (department_id, position, text) VALUES
      (1, 1, 'Desenvolver e manter aplicações web e mobile'),
      (1, 2, 'Participar de code reviews e revisões de arquitetura'),
      (1, 3, 'Colaborar com a equipe de produto para definir requisitos'),
      (1, 4, 'Implementar testes automatizados'),
      (1, 5, 'Documentar APIs e processos técnicos')
      ON DUPLICATE KEY UPDATE text = VALUES(text)
    `);

    await executeQuery(`
      INSERT INTO hr_department_requirements_templates (department_id, position, text) VALUES
      (1, 1, 'Experiência com desenvolvimento web (JavaScript/TypeScript)'),
      (1, 2, 'Conhecimento em frameworks modernos (React, Vue, Angular)'),
      (1, 3, 'Experiência com bancos de dados SQL e NoSQL'),
      (1, 4, 'Conhecimento em Git e metodologias ágeis'),
      (1, 5, 'Inglês técnico para leitura de documentação')
      ON DUPLICATE KEY UPDATE text = VALUES(text)
    `);

    await executeQuery(`
      INSERT INTO hr_department_benefits_templates (department_id, position, text) VALUES
      (1, 1, 'Plano de saúde e odontologia'),
      (1, 2, 'Vale refeição/alimentação'),
      (1, 3, 'Home office flexível'),
      (1, 4, 'Participação em eventos e conferências'),
      (1, 5, 'Plano de carreira e desenvolvimento')
      ON DUPLICATE KEY UPDATE text = VALUES(text)
    `);

    await executeQuery(`
      INSERT INTO hr_department_nice_to_have_templates (department_id, position, text) VALUES
      (1, 1, 'Experiência com cloud (AWS, Azure, GCP)'),
      (1, 2, 'Conhecimento em Docker e Kubernetes'),
      (1, 3, 'Experiência com microsserviços'),
      (1, 4, 'Contribuições para projetos open source')
      ON DUPLICATE KEY UPDATE text = VALUES(text)
    `);

    res.json({
      success: true,
      message: 'Tabelas de templates criadas com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao criar tabelas de templates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao criar tabelas' 
    });
  }
};

// Buscar itens de configuração
exports.getSettingsItems = async (req, res) => {
  try {
    const { table } = req.params;
    
    if (!validateTableName(table)) {
      return res.status(400).json({ message: 'Nome da tabela inválido' });
    }
    
    // Definir campos baseados na estrutura da tabela
    let fields = 'id, name, created_at';
    
    // Adicionar campos específicos baseados na tabela
    if (table === 'hr_departments' || table === 'hr_locations') {
      fields += ', is_active, updated_at';
    } else {
      // Para tabelas que não têm is_active e updated_at, usar valores padrão
      fields += ', 1 as is_active, created_at as updated_at';
    }
    
    const items = await executeQuery(`
      SELECT ${fields}
      FROM ${table}
      ORDER BY name ASC
    `);
    
    res.json({
      success: true,
      data: items
    });
    
  } catch (error) {
    console.error('Erro ao buscar itens de configuração:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao buscar itens' 
    });
  }
};

// Validar nome da tabela
function validateTableName(tableName) {
  const allowedTables = [
    'hr_departments',
    'hr_locations', 
    'hr_modalities',
    'hr_levels',
    'hr_contract_types'
  ];
  return allowedTables.includes(tableName);
}

// Buscar template global
exports.getGlobalTemplates = async (req, res) => {
  try {
    // Buscar templates de todos os departamentos e criar um template global
    const departments = await executeQuery(`
      SELECT id, name FROM hr_departments WHERE is_active = 1
    `);
    
    const globalTemplates = {
      responsibilities: [],
      requirements: [],
      benefits: [],
      niceToHave: []
    };
    
    // Buscar templates de cada departamento e agregar
    for (const dept of departments) {
      const templates = await executeQuery(`
        SELECT 
          'responsibilities' as type,
          text
        FROM hr_department_responsibilities_templates 
        WHERE department_id = ? AND is_active = 1
        UNION ALL
        SELECT 
          'requirements' as type,
          text
        FROM hr_department_requirements_templates 
        WHERE department_id = ? AND is_active = 1
        UNION ALL
        SELECT 
          'benefits' as type,
          text
        FROM hr_department_benefits_templates 
        WHERE department_id = ? AND is_active = 1
        UNION ALL
        SELECT 
          'niceToHave' as type,
          text
        FROM hr_department_nice_to_have_templates 
        WHERE department_id = ? AND is_active = 1
      `, [dept.id, dept.id, dept.id, dept.id]);
      
      templates.forEach(template => {
        if (!globalTemplates[template.type].includes(template.text)) {
          globalTemplates[template.type].push(template.text);
        }
      });
    }
    
    res.json({
      success: true,
      data: globalTemplates
    });
    
  } catch (error) {
    console.error('Erro ao buscar templates globais:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao buscar templates globais' 
    });
  }
};

// Salvar template global
exports.saveGlobalTemplates = async (req, res) => {
  try {
    const { responsibilities, requirements, benefits, niceToHave } = req.body;
    
    // Buscar todos os departamentos ativos
    const departments = await executeQuery(`
      SELECT id FROM hr_departments WHERE is_active = 1
    `);
    
    // Usar transação para melhor performance e consistência
    await executeTransaction(async (conn) => {
      // Desativar todos os templates existentes de uma vez
      await conn.query(`
        UPDATE hr_department_responsibilities_templates 
        SET is_active = 0 
        WHERE department_id IN (${departments.map(d => d.id).join(',')})
      `);
      
      await conn.query(`
        UPDATE hr_department_requirements_templates 
        SET is_active = 0 
        WHERE department_id IN (${departments.map(d => d.id).join(',')})
      `);
      
      await conn.query(`
        UPDATE hr_department_benefits_templates 
        SET is_active = 0 
        WHERE department_id IN (${departments.map(d => d.id).join(',')})
      `);
      
      await conn.query(`
        UPDATE hr_department_nice_to_have_templates 
        SET is_active = 0 
        WHERE department_id IN (${departments.map(d => d.id).join(',')})
      `);
      
      // Preparar arrays de valores para INSERT em lote
      const responsibilitiesValues = [];
      const requirementsValues = [];
      const benefitsValues = [];
      const niceToHaveValues = [];
      
      departments.forEach(dept => {
        // Responsabilidades
        if (responsibilities && responsibilities.length > 0) {
          responsibilities.forEach((text, index) => {
            responsibilitiesValues.push([dept.id, index + 1, text, 1]);
          });
        }
        
        // Requisitos
        if (requirements && requirements.length > 0) {
          requirements.forEach((text, index) => {
            requirementsValues.push([dept.id, index + 1, text, 1]);
          });
        }
        
        // Benefícios
        if (benefits && benefits.length > 0) {
          benefits.forEach((text, index) => {
            benefitsValues.push([dept.id, index + 1, text, 1]);
          });
        }
        
        // Diferenciais
        if (niceToHave && niceToHave.length > 0) {
          niceToHave.forEach((text, index) => {
            niceToHaveValues.push([dept.id, index + 1, text, 1]);
          });
        }
      });
      
      // Inserir em lote usando INSERT múltiplo
      if (responsibilitiesValues.length > 0) {
        const placeholders = responsibilitiesValues.map(() => '(?, ?, ?, ?)').join(', ');
        await conn.query(`
          INSERT INTO hr_department_responsibilities_templates 
          (department_id, position, text, is_active) 
          VALUES ${placeholders}
        `, responsibilitiesValues.flat());
      }
      
      if (requirementsValues.length > 0) {
        const placeholders = requirementsValues.map(() => '(?, ?, ?, ?)').join(', ');
        await conn.query(`
          INSERT INTO hr_department_requirements_templates 
          (department_id, position, text, is_active) 
          VALUES ${placeholders}
        `, requirementsValues.flat());
      }
      
      if (benefitsValues.length > 0) {
        const placeholders = benefitsValues.map(() => '(?, ?, ?, ?)').join(', ');
        await conn.query(`
          INSERT INTO hr_department_benefits_templates 
          (department_id, position, text, is_active) 
          VALUES ${placeholders}
        `, benefitsValues.flat());
      }
      
      if (niceToHaveValues.length > 0) {
        const placeholders = niceToHaveValues.map(() => '(?, ?, ?, ?)').join(', ');
        await conn.query(`
          INSERT INTO hr_department_nice_to_have_templates 
          (department_id, position, text, is_active) 
          VALUES ${placeholders}
        `, niceToHaveValues.flat());
      }
    });
    
    // Emitir evento Socket.IO
    if (req.io) {
      req.io.emit('hr:global_templates_updated', {
        responsibilities: responsibilities || [],
        requirements: requirements || [],
        benefits: benefits || [],
        niceToHave: niceToHave || []
      });
    }
    
    res.json({
      success: true,
      message: 'Template global salvo com sucesso para todos os departamentos'
    });
    
  } catch (error) {
    console.error('Erro ao salvar template global:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao salvar template global' 
    });
  }
};

// Buscar vagas ativas
exports.getActiveJobs = async (req, res) => {
  try {
    const jobs = await executeQuery(`
      SELECT id, title, department_id, location_id
      FROM hr_job_postings 
      WHERE is_active = 1 AND status IN ('Published', 'Draft')
      ORDER BY title ASC
    `);
    
    res.json({
      success: true,
      jobs: jobs
    });
    
  } catch (error) {
    console.error('Erro ao buscar vagas ativas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao buscar vagas ativas' 
    });
  }
};

// Enviar email de rejeição
exports.sendRejectionEmail = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { job_posting_id, subject, content } = req.body;
    
    if (!applicantId || !job_posting_id || !subject || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }
    
    // Buscar dados do candidato
    const applicant = await executeQuery(`
      SELECT id, name, email
      FROM hr_applicants 
      WHERE id = ?
    `, [applicantId]);
    
    if (!applicant || applicant.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Candidato não encontrado' 
      });
    }
    
    // Buscar dados da vaga com nome do departamento
    const job = await executeQuery(`
      SELECT jp.id, jp.title, jp.department_id, d.name as department_name
      FROM hr_job_postings jp
      LEFT JOIN hr_departments d ON d.id = jp.department_id
      WHERE jp.id = ?
    `, [job_posting_id]);
    
    if (!job || job.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vaga não encontrada' 
      });
    }
    
    // Verificar se já foi enviado email de rejeição para esta vaga
    const existingEmail = await executeQuery(`
      SELECT id FROM hr_rejection_emails 
      WHERE applicant_id = ? AND job_posting_id = ? AND email_type = 'rejection'
    `, [applicantId, job_posting_id]);
    
    if (existingEmail && existingEmail.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email de rejeição já foi enviado para este candidato nesta vaga' 
      });
    }
    
    // Obter usuário atual (pode ser null se não estiver autenticado)
    const currentUser = req.user || null;
    
    // Enviar email de rejeição
    const emailSent = await sendRejectionEmailToCandidate(
      applicant[0].email,
      applicant[0].name,
      job[0].title,
      subject,
      content,
      job[0].department_name
    );
    
    if (!emailSent) {
      throw new Error('Falha ao enviar email');
    }
    
    // Registrar envio no banco de dados
    await executeQuery(`
      INSERT INTO hr_rejection_emails 
      (applicant_id, job_posting_id, email_type, sent_by, email_content, status) 
      VALUES (?, ?, 'rejection', ?, ?, 'sent')
    `, [applicantId, job_posting_id, currentUser ? currentUser.id : null, content]);
    
    // Emitir evento Socket.IO
    if (req.io) {
      req.io.emit('hr:rejection_email_sent', {
        applicant_id: applicantId,
        job_posting_id: job_posting_id,
        sent_at: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Email de rejeição enviado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao enviar email de rejeição:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno ao enviar email de rejeição' 
    });
  }
};

// Função auxiliar para enviar email de rejeição
async function sendRejectionEmailToCandidate(email, name, jobTitle, subject, content, departmentName = 'Departamento') {
  try {
    const { sendEmail } = require('../support/send-email');
    const { hrCandidateTemplates } = require('../support/hr-candidate-templates');
    
    // Preparar dados para o template
    const rejectionData = {
      candidate_name: name,
      candidate_email: email,
      job_title: jobTitle,
      department_name: departmentName,
      rejection_date: new Date().toLocaleDateString('pt-BR'),
      company_name: 'Sirius System'
    };
    
    // Gerar HTML do email usando o template
    const htmlContent = await hrCandidateTemplates.rejectionNotification.generate(rejectionData);
    
    // Usar o assunto personalizado se fornecido, senão usar padrão
    const emailSubject = subject || `[Sirius System] 📧 Atualização sobre sua Candidatura - ${jobTitle}`;
    
    // Enviar email para o candidato
    const result = await sendEmail(email, emailSubject, htmlContent);
    
    if (result.success) {
      console.log(`✅ Email de rejeição enviado para candidato: ${name} (${email})`);
      return true;
    } else {
      console.error(`❌ Erro ao enviar email de rejeição para: ${name}`, result.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro ao enviar email de rejeição:', error);
    return false;
  }
}

