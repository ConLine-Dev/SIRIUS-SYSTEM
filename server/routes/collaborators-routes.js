// routes/collaborators-routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const collaboratorsController = require('../controllers/collaborators-controller');

// Configuração do multer para armazenar arquivos no sistema de arquivos
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'storageService/administration/collaborators/temp';
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

module.exports = function (io) {

 
    router.get('/getAllContractType', async (req, res) => {
        try {
            const ContractType = await collaboratorsController.getAllContractType();
            res.status(200).json(ContractType);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar colaborador' });
        }
    });

    
    router.get('/getAllDepartments', async (req, res) => {
        try {
            const ContractType = await collaboratorsController.getAllDepartments();
            res.status(200).json(ContractType);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar colaborador' });
        }
    });

    // CRUD para 'collaborators'
    router.post('/collaborators', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'files[]', maxCount: 10 }, { name: 'certifications-files[]', maxCount: 10 }]), async (req, res) => {
        try {
            const { body, files } = req;

            const requestUser = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null
          
   
            // Parse dos dados JSON enviados no formulário
            const documentsData = body.documentsData
            const certificationsData = body.certificationsData
            const bankingInformation = JSON.parse(body.bankingInformation);


            // Dados do colaborador
            const collaboratorData = {
                ...body,
                photo: files['photo'] ? files['photo'][0].filename : null, // Nome do arquivo da foto
            };


    
            // Cria o colaborador no banco e obtém o ID
            const collaboratorId = await collaboratorsController.createCollaborator(collaboratorData, requestUser);
            await collaboratorsController.createCollaboratorBankInfo(collaboratorId, bankingInformation);
            await collaboratorsController.createCollaboratorAddress(collaboratorId, collaboratorData);
            // Define o caminho base para armazenar os arquivos do colaborador
            const baseFolderPath = path.join('storageService', 'administration', 'collaborators', `${collaboratorId}`);
            
            // Cria a pasta base para o colaborador
            fs.mkdirSync(baseFolderPath, { recursive: true });

            // Processa a foto do colaborador, se fornecida
            if (files['photo'] && files['photo'][0]) {
                const photo = files['photo'][0];
                const newFileName = `perfil-image${path.extname(photo.originalname)}`;
                const newPath = path.join(baseFolderPath, newFileName);
                fs.rename(photo.path, newPath, function(err) {
                    if (err) throw err;
                });

                // Atualiza o caminho da foto no registro do colaborador
                const photoRelativePath = path.relative('storageService', newPath);
                
                console.log('UPDATE collaborators SET photo', photoRelativePath, collaboratorId)

            }

               // Processa os documentos
            if (files['files[]'] && files['files[]'].length > 0) {
                const documentsFolderPath = path.join(baseFolderPath, 'documents');
                fs.mkdirSync(documentsFolderPath, { recursive: true });

                const documentsInsertPromises = files['files[]'].map(async (file, index) => {
                    
                    const docData = JSON.parse(documentsData[index]);

                    if (!docData) {
                        throw new Error(`Dados do documento ausentes para o arquivo ${file.originalname}`);
                    }

                    const timestamp = Date.now();
                    const newFileName = `${path.basename(file.originalname, path.extname(file.originalname))}-${timestamp}${path.extname(file.originalname)}`;
                    const newPath = path.join(documentsFolderPath, newFileName);
                    fs.rename(file.path, newPath, function(err) {
                        if (err) throw err;
                    });

                    const pathRelative = path.relative('storageService', newPath);
                    // console.log('INSERT INTO documents', collaboratorId, docData.name, docData.date, pathRelative, file.mimetype)
               
                    const documentns = {
                        collaborator_id:collaboratorId,
                        document_date:docData.date,
                        document_name:docData.name,
                        document_path:newFileName,
                        document_type:file.mimetype,
                    }

                    return await collaboratorsController.createCollaboratorDocument(documentns)
                });

                await Promise.all(documentsInsertPromises);
            }

           
            
             // Processa as certificações
             if (files['certifications-files[]'] && files['certifications-files[]'].length > 0) {
                const certificationsFolderPath = path.join(baseFolderPath, 'certifications');
                fs.mkdirSync(certificationsFolderPath, { recursive: true });

                const certificationsInsertPromises = files['certifications-files[]'].map(async (file, index) => {
                    const certData = JSON.parse(certificationsData[index]);
                    
                    if (!certData) {
                        throw new Error(`Dados da certificação ausentes para o arquivo ${file.originalname}`);
                    }

                    const timestamp = Date.now();
                    const newFileName = `${path.basename(file.originalname, path.extname(file.originalname))}-${timestamp}${path.extname(file.originalname)}`;
                    const newPath = path.join(certificationsFolderPath, newFileName);
                    fs.rename(file.path, newPath, function(err) {
                        if (err) throw err;
                    });

                    const pathRelative = path.relative('storageService', newPath);


                    const certifications = {
                        collaborator_id:collaboratorId,
                        qualification:certData.qualification,
                        institution:certData.institution,
                        date:certData.completionDate,
                        path:newFileName,
                        type:file.mimetype,
                    }
                   
                    return await collaboratorsController.createCollaboratorQualification(certifications)
                });

                await Promise.all(certificationsInsertPromises);
            }

    
            res.status(201).json({ message: 'Colaborador criado com sucesso', id: collaboratorId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    });

    router.get('/collaborators/:id', async (req, res) => {
        try {
            const collaborator = await collaboratorsController.getCollaboratorById(req.params.id);
            const bank_info = await collaboratorsController.getCollaboratorBankInfoById(req.params.id);

            res.status(200).json({collaborator,bank_info});
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar colaborador' });
        }
    });

    router.get('/collaboratorsByHeadCargo/:id', async (req, res, next) => {

        try {
            const result = await collaboratorsController.getCollaboratorByHeadCargoId(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.get('/collaborators-birth-date', async (req, res) => {
        try {
            const collaborator = await collaboratorsController.getCollaboratorBirthDate(req.params.id);
            res.status(200).json(collaborator);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar colaborador' });
        }
    });

    router.get('/collaborators-admission-date', async (req, res) => {
        try {
            const collaborator = await collaboratorsController.getCollaboratorAdmissionDate(req.params.id);
            res.status(200).json(collaborator);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar colaborador' });
        }
    });

    router.get('/turnoverGeneral', async (req, res) => {
        try {
            const collaborators = await collaboratorsController.turnoverGeneral();
            res.status(200).json(collaborators);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao listar colaboradores' });
        }
    });

    router.get('/turnover-month', async (req, res) => {
        try {
            const collaborators = await collaboratorsController.turnoverMonth();
            res.status(200).json(collaborators);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao listar colaboradores' });
        }
    });

    router.get('/collaborators', async (req, res) => {
        try {
            const collaborators = await collaboratorsController.getAllCollaborators();
            res.status(200).json(collaborators);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao listar colaboradores' });
        }
    });

    router.get('/collaborators-active', async (req, res) => {
        try {
            const collaborators = await collaboratorsController.getAllCollaboratorsActive();
            res.status(200).json(collaborators);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao listar colaboradores' });
        }
    });

    router.put('/collaborators/:id', async (req, res) => {
        try {
            await collaboratorsController.updateCollaborator(req.params.id, req.body);
            res.status(200).json({ message: 'Colaborador atualizado com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar colaborador' });
        }
    });

    router.delete('/collaborators/:id', async (req, res) => {
        try {
            await collaboratorsController.deleteCollaborator(req.params.id);
            res.status(200).json({ message: 'Colaborador excluído com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao excluir colaborador' });
        }
    });

    // CRUD para 'collaborators_addresses'
    router.post('/collaborators_addresses', async (req, res) => {
        try {
            const addressId = await collaboratorsController.createCollaboratorAddress(req.body);
            res.status(201).json({ message: 'Endereço criado com sucesso', id: addressId });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar endereço' });
        }
    });

    router.get('/collaborators_addresses/:id', async (req, res) => {
        try {
            const address = await collaboratorsController.getCollaboratorAddressById(req.params.id);
            res.status(200).json(address);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar endereço' });
        }
    });

    router.get('/collaborators_addresses', async (req, res) => {
        try {
            const addresses = await collaboratorsController.getAllCollaboratorAddresses();
            res.status(200).json(addresses);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao listar endereços' });
        }
    });

    router.put('/collaborators_addresses/:id', async (req, res) => {
        try {
            await collaboratorsController.updateCollaboratorAddress(req.params.id, req.body);
            res.status(200).json({ message: 'Endereço atualizado com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar endereço' });
        }
    });

    router.delete('/collaborators_addresses/:id', async (req, res) => {
        try {
            await collaboratorsController.deleteCollaboratorAddress(req.params.id);
            res.status(200).json({ message: 'Endereço excluído com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao excluir endereço' });
        }
    });

    // CRUD para 'collaborators_contacts'
    router.post('/collaborators_contacts', async (req, res) => {
        try {
            const contactId = await collaboratorsController.createCollaboratorContact(req.body);
            res.status(201).json({ message: 'Contato criado com sucesso', id: contactId });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar contato' });
        }
    });

    router.get('/collaborators_contacts/:id', async (req, res) => {
        try {
            const contact = await collaboratorsController.getCollaboratorContactById(req.params.id);
            res.status(200).json(contact);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar contato' });
        }
    });

    router.get('/collaborators_contacts', async (req, res) => {
        try {
            const contacts = await collaboratorsController.getAllCollaboratorContacts();
            res.status(200).json(contacts);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao listar contatos' });
        }
    });

    router.put('/collaborators_contacts/:id', async (req, res) => {
        try {
            await collaboratorsController.updateCollaboratorContact(req.params.id, req.body);
            res.status(200).json({ message: 'Contato atualizado com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar contato' });
        }
    });

    router.delete('/collaborators_contacts/:id', async (req, res) => {
        try {
            await collaboratorsController.deleteCollaboratorContact(req.params.id);
            res.status(200).json({ message: 'Contato excluído com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao excluir contato' });
        }
    });

    // CRUD para 'collaborators_qualifications'
    router.post('/collaborators_qualifications', async (req, res) => {
        try {
            const qualificationId = await collaboratorsController.createCollaboratorQualification(req.body);
            res.status(201).json({ message: 'Qualificação criada com sucesso', id: qualificationId });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar qualificação' });
        }
    });

    router.get('/collaborators_qualifications/:id', async (req, res) => {
        try {
            const qualification = await collaboratorsController.getCollaboratorQualificationById(req.params.id);
            res.status(200).json(qualification);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar qualificação' });
        }
    });

    router.get('/collaborators_qualifications', async (req, res) => {
        try {
            const qualifications = await collaboratorsController.getAllCollaboratorQualifications();
            res.status(200).json(qualifications);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao listar qualificações' });
        }
    });

    router.put('/collaborators_qualifications/:id', async (req, res) => {
        try {
            await collaboratorsController.updateCollaboratorQualification(req.params.id, req.body);
            res.status(200).json({ message: 'Qualificação atualizada com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar qualificação' });
        }
    });

    router.delete('/collaborators_qualifications/:id', async (req, res) => {
        try {
            await collaboratorsController.deleteCollaboratorQualification(req.params.id);
            res.status(200).json({ message: 'Qualificação excluída com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao excluir qualificação' });
        }
    });

    // CRUD para 'collaborators_bank_info'
    router.post('/collaborators_bank_info', async (req, res) => {
        try {
            const bankInfoId = await collaboratorsController.createCollaboratorBankInfo(req.body);
            res.status(201).json({ message: 'Informação bancária criada com sucesso', id: bankInfoId });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar informação bancária' });
        }
    });

    router.get('/collaborators_bank_info/:id', async (req, res) => {
        try {
            const bankInfo = await collaboratorsController.getCollaboratorBankInfoById(req.params.id);
            res.status(200).json(bankInfo);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar informação bancária' });
        }
    });

    router.get('/collaborators_bank_info', async (req, res) => {
        try {
            const bankInfos = await collaboratorsController.getAllCollaboratorBankInfo();
            res.status(200).json(bankInfos);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao listar informações bancárias' });
        }
    });

    router.put('/collaborators_bank_info/:id', async (req, res) => {
        try {
            await collaboratorsController.updateCollaboratorBankInfo(req.params.id, req.body);
            res.status(200).json({ message: 'Informação bancária atualizada com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar informação bancária' });
        }
    });

    router.delete('/collaborators_bank_info/:id', async (req, res) => {
        try {
            await collaboratorsController.deleteCollaboratorBankInfo(req.params.id);
            res.status(200).json({ message: 'Informação bancária excluída com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao excluir informação bancária' });
        }
    });

    // CRUD para 'collaborators_benefits'
    router.post('/collaborators_benefits', async (req, res) => {
        try {
            const benefitId = await collaboratorsController.createCollaboratorBenefit(req.body);
            res.status(201).json({ message: 'Benefício criado com sucesso', id: benefitId });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar benefício' });
        }
    });

    router.get('/collaborators_benefits/:id', async (req, res) => {
        try {
            const benefit = await collaboratorsController.getCollaboratorBenefitById(req.params.id);
            res.status(200).json(benefit);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar benefício' });
        }
    });

    router.get('/collaborators_benefits', async (req, res) => {
        try {
            const benefits = await collaboratorsController.getAllCollaboratorBenefits();
            res.status(200).json(benefits);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao listar benefícios' });
        }
    });

    router.put('/collaborators_benefits/:id', async (req, res) => {
        try {
            await collaboratorsController.updateCollaboratorBenefit(req.params.id, req.body);
            res.status(200).json({ message: 'Benefício atualizado com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar benefício' });
        }
    });

    router.delete('/collaborators_benefits/:id', async (req, res) => {
        try {
            await collaboratorsController.deleteCollaboratorBenefit(req.params.id);
            res.status(200).json({ message: 'Benefício excluído com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao excluir benefício' });
        }
    });

    // CRUD para 'collaborators_documents'
    router.post('/collaborators_documents', async (req, res) => {
        try {
            const documentId = await collaboratorsController.createCollaboratorDocument(req.body);
            res.status(201).json({ message: 'Documento criado com sucesso', id: documentId });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar documento' });
        }
    });

    router.get('/collaborators_documents/:id', async (req, res) => {
        try {
            const document = await collaboratorsController.getCollaboratorDocumentById(req.params.id);
            res.status(200).json(document);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar documento' });
        }
    });

    router.get('/collaborators_documents', async (req, res) => {
        try {
            const documents = await collaboratorsController.getAllCollaboratorDocuments();
            res.status(200).json(documents);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao listar documentos' });
        }
    });

    router.put('/collaborators_documents/:id', async (req, res) => {
        try {
            await collaboratorsController.updateCollaboratorDocument(req.params.id, req.body);
            res.status(200).json({ message: 'Documento atualizado com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar documento' });
        }
    });

    router.delete('/collaborators_documents/:id', async (req, res) => {
        try {
            await collaboratorsController.deleteCollaboratorDocument(req.params.id);
            res.status(200).json({ message: 'Documento excluído com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao excluir documento' });
        }
    });

    // CRUD para 'collaborators_notes'
    router.post('/collaborators_notes', async (req, res) => {
        try {
            const noteId = await collaboratorsController.createCollaboratorNote(req.body);
            res.status(201).json({ message: 'Nota criada com sucesso', id: noteId });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar nota' });
        }
    });

    router.get('/collaborators_notes/:id', async (req, res) => {
        try {
            const note = await collaboratorsController.getCollaboratorNoteById(req.params.id);
            res.status(200).json(note);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar nota' });
        }
    });

    router.get('/collaborators_notes', async (req, res) => {
        try {
            const notes = await collaboratorsController.getAllCollaboratorNotes();
            res.status(200).json(notes);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao listar notas' });
        }
    });

    router.put('/collaborators_notes/:id', async (req, res) => {
        try {
            await collaboratorsController.updateCollaboratorNote(req.params.id, req.body);
            res.status(200).json({ message: 'Nota atualizada com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar nota' });
        }
    });

    router.delete('/collaborators_notes/:id', async (req, res) => {
        try {
            await collaboratorsController.deleteCollaboratorNote(req.params.id);
            res.status(200).json({ message: 'Nota excluída com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao excluir nota' });
        }
    });

    // CRUD para 'collaborators_other_info'
    router.post('/collaborators_other_info', async (req, res) => {
        try {
            const otherInfoId = await collaboratorsController.createCollaboratorOtherInfo(req.body);
            res.status(201).json({ message: 'Informação adicional criada com sucesso', id: otherInfoId });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar informação adicional' });
        }
    });

    router.get('/collaborators_other_info/:id', async (req, res) => {
        try {
            const otherInfo = await collaboratorsController.getCollaboratorOtherInfoById(req.params.id);
            res.status(200).json(otherInfo);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar informação adicional' });
        }
    });

    router.get('/collaborators_other_info', async (req, res) => {
        try {
            const otherInfos = await collaboratorsController.getAllCollaboratorOtherInfo();
            res.status(200).json(otherInfos);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao listar informações adicionais' });
        }
    });

    router.put('/collaborators_other_info/:id', async (req, res) => {
        try {
            await collaboratorsController.updateCollaboratorOtherInfo(req.params.id, req.body);
            res.status(200).json({ message: 'Informação adicional atualizada com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar informação adicional' });
        }
    });

    router.delete('/collaborators_other_info/:id', async (req, res) => {
        try {
            await collaboratorsController.deleteCollaboratorOtherInfo(req.params.id);
            res.status(200).json({ message: 'Informação adicional excluída com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao excluir informação adicional' });
        }
    });
    return router;

};
