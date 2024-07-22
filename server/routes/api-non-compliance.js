const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { Users } = require('../controllers/users');
const { non_compliance } = require('../controllers/non-compliance');
// const { executeQuerySQL } = require('../connect/sqlServer');
// const { executeQuery } = require('../connect/mysql');


// const storage = multer.memoryStorage();


// Configuração do multer para armazenar arquivos no sistema de arquivos
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'storageService/administration/non-compliance/evidence';
        try {
            await fs.promises.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });


module.exports = function(io) {
   
  
    router.get('/AllResponsible', async (req, res, next) => {
        try {
            const result = await Users.getAllUsers();
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.get('/AllUnit', async (req, res, next) => {
        try {
            const result = await non_compliance.getAllCompanies();
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.get('/AllOrigin', async (req, res, next) => {
        try {
            const result = await non_compliance.getAllOrigin();
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.get('/AllApproval', async (req, res, next) => {
        try {
            const result = await Users.getAllUsers();
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.get('/AllTypes', async (req, res, next) => {
        try {
            const result = await non_compliance.getAllTypes();
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.get('/getPendingOccurrences', async (req, res, next) => {
        try {
            const result = await non_compliance.getPendingOccurrences();
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.post('/getOccurence-collaborator', async (req, res, next) => {
        const {id, type} = req.body
        try {
            const result = await non_compliance.getOccurenceByColab(id, type);
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.post('/getOcurrenceById', async (req, res, next) => {
        const {id} = req.body
        console.log(id)
        try {
            const result = await non_compliance.getOcurrenceById(id);
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.get('/AllOccurrence', async (req, res, next) => {
        try {
            const result = await non_compliance.getAllOccurrence();
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });
    
    router.post('/saveOccurence', async (req, res, next) => {
        const body = req.body
        try {
            const result = await non_compliance.saveOccurence(body);
            io.emit('att-non-compliance', result);
            res.status(200).json(result)
        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.post('/NewOccurrence', async (req, res, next) => {
        const body = req.body
        try {
            const result = await non_compliance.newOccurrence(body);
            res.status(200).json(result)
            io.emit('att-non-compliance', result);
        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.post('/NewReason', async (req, res, next) => {
        const body = req.body
        // body.reason, body.occurrences_id
        try {
            const result = await non_compliance.NewReason(body);
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.post('/changeBlock', async (req, res, next) => {
        const body = req.body
        // body.reason, body.occurrences_id
        try {
            const result = await non_compliance.changeBlock(body);
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.post('/getHistory', async (req, res, next) => {
        const {id} = req.body
        // body.reason, body.occurrences_id
        try {
            const result = await non_compliance.getHistory(id);
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.post('/sendEmailOccurrence', async (req, res, next) => {
        const {subject, template, occurrence_id} = req.body
        // body.reason, body.occurrences_id
        try {
            
            const result = await non_compliance.sendEmail(subject, null, template, null, occurrence_id)
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    // 
    // Actions - Ação Corretiva
    router.post('/NewActions', async (req, res, next) => {
        const body = req.body
        // body.action, body.responsible, body.expiration, body.status
        try {
            const result = await non_compliance.NewActions(body);
            res.status(200).json(result)

        } catch (error) {
            res.status(404).json(error)   
        }
    });

    router.post('/add-action', upload.array('evidence_files'), async (req, res) => {
        const body = req.body
        try {
            const evidenceFiles = req.files;
            const result = await non_compliance.addAction(body, evidenceFiles);
            res.status(200).json({ success: true, message: 'Ação adicionada com sucesso!' });
        } catch (error) {
            res.status(404).json({ success: false, message: 'Erro ao adicionar ação.' }); 
        }
   
    });

    router.post('/save-action', upload.array('evidence_files'), async (req, res) => {
        const body = req.body
        try {
            const evidenceFiles = req.files;
            const result = await non_compliance.editAction(body, evidenceFiles);
            res.status(200).json({ success: true, message: 'Ação adicionada com sucesso!' });
        } catch (error) {
            res.status(404).json({ success: false, message: 'Erro ao adicionar ação.' }); 
        }
   
    });

    router.get('/get-action/:id', async (req, res) => {
        const actionId = req.params.id;
        try {
            const action = await non_compliance.getAction(actionId);
            action.evidence = JSON.parse(action.evidence); // Parse JSON
            res.json({ success: true, action });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao obter ação.' });
        }
    });

    router.get('/download-evidence/:filename', (req, res) => {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../storageService/administration/non-compliance/evidence', filename);
  
        res.download(filePath, (err) => {
            if (err) {
                res.status(500).send('Erro ao baixar o arquivo.');
            }
        });
    });

    router.delete('/delete-evidence/:actionId/:filename', async (req, res) => {
        const actionId = req.params.actionId;
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../storageService/administration/non-compliance/evidence', filename);
    
        try {
            // Delete file from filesystem
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
    
            // Get action from database
            const action = await non_compliance.getAction(actionId);
            let evidence = JSON.parse(action.evidence);
    
            // Remove file from evidence array
            evidence = evidence.filter(file => file.filename !== filename);
    
            // Update action in database
            await non_compliance.updateActionEvidence(actionId, JSON.stringify(evidence));
    
            res.status(200).json({ success: true, message: 'Evidência deletada com sucesso.' });
        } catch (error) {
            console.error('Erro ao deletar a evidência:', error);
            res.status(500).json({ success: false, message: 'Erro ao deletar a evidência.' });
        }
    });

    router.get('/get-actions/:occurrence_id', async (req, res) => {
        const occurrenceId = req.params.occurrence_id;
        try {
            const actions = await non_compliance.getActionsByOccurrence(occurrenceId);
            // Parse JSON string if needed
            actions.forEach(action => {
                action.evidence = JSON.parse(action.evidence);
            });
            res.json(actions);
        } catch (error) {
            console.log(error)
            res.status(500).json({ success: false, message: 'Erro ao obter ações.' });
        }
    });

    router.get('/get-actions-pendents-byusers/:userID', async (req, res) => {
        const userID = req.params.userID;
        try {
            const actions = await non_compliance.getActionsPendentsByUser(userID);
            // Parse JSON string if needed
            actions.forEach(action => {
                action.evidence = JSON.parse(action.evidence);
            });
            res.json(actions);
        } catch (error) {
            console.log(error)
            res.status(500).json({ success: false, message: 'Erro ao obter ações.' });
        }
    });

    router.get('/get-actions-pendents', async (req, res) => {
        try {
            const actions = await non_compliance.getAllActions();
            // Parse JSON string if needed
            actions.forEach(action => {
                action.evidence = JSON.parse(action.evidence);
            });
            res.json(actions);
        } catch (error) {
            console.log(error)
            res.status(500).json({ success: false, message: 'Erro ao obter ações.' });
        }
    });

    
    

    // Effectiveness - Avaliação De Eficácia 
    router.post('/add-effectivenes', upload.array('evidence_files'), async (req, res) => {
        const body = req.body
        try {
            const evidenceFiles = req.files;
            const result = await non_compliance.addEffectiveness(body, evidenceFiles);
            console.log(result)
            res.status(200).json({ success: true, message: 'Ação adicionada com sucesso!' });
        } catch (error) {
            res.status(404).json({ success: false, message: 'Erro ao adicionar ação.' }); 
        }
   
    });

    router.post('/save-effectivenes', upload.array('evidence_files'), async (req, res) => {
        const body = req.body
        try {
            const evidenceFiles = req.files;
            const result = await non_compliance.editEffectiveness(body, evidenceFiles);
      
            res.status(200).json({ success: true, message: 'Ação adicionada com sucesso!' });
        } catch (error) {
            console.log(error)
            res.status(404).json({ success: false, message: 'Erro ao adicionar ação.' }); 
        }
   
    });

    router.get('/get-effectiveness/:occurrence_id', async (req, res) => {
        const occurrenceId = req.params.occurrence_id;
        try {
            const effectiveness = await non_compliance.getEffectivenessByOccurrence(occurrenceId);
            // Parse JSON string if needed
            effectiveness.forEach(effectivenes => {
                effectivenes.evidence = JSON.parse(effectivenes.evidence);
            });
            res.json(effectiveness);
        } catch (error) {
            console.log(error)
            res.status(500).json({ success: false, message: 'Erro ao obter ações.' });
        }
    });

    router.get('/get-effectivenes/:id', async (req, res) => {
        const effectivenesId = req.params.id;
        try {
            const effectivenes = await non_compliance.getEffectivenes(effectivenesId);
            effectivenes.evidence = JSON.parse(effectivenes.evidence); // Parse JSON
            res.json({ success: true, effectivenes });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erro ao obter ação.' });
        }
    });

    router.delete('/delete-evidence-effectivenes/:effectivenesId/:filename', async (req, res) => {
        const effectivenesId = req.params.effectivenesId;
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../storageService/administration/non-compliance/evidence', filename);
    
        try {
            // Delete file from filesystem
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
    
            // Get action from database
            const effectivenes = await non_compliance.getEffectivenes(effectivenesId);
            let evidence = JSON.parse(effectivenes.evidence);
    
            // Remove file from evidence array
            evidence = evidence.filter(file => file.filename !== filename);
    
            // Update action in database
            await non_compliance.updateEffectivenessEvidence(effectivenesId, JSON.stringify(evidence));
    
            res.status(200).json({ success: true, message: 'Evidência deletada com sucesso.' });
        } catch (error) {
            console.error('Erro ao deletar a evidência:', error);
            res.status(500).json({ success: false, message: 'Erro ao deletar a evidência.' });
        }
    });
    


    return router;

};
