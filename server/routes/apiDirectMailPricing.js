const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { direct_mail_pricing } = require('../controllers/direct_mail_pricing');
const { executeQuerySQL } = require('../connect/sqlServer');
const { Users } = require('../controllers/users');


module.exports = function(io) {
    // io.on('connection', (socket) => {
    //     // Handle socket events
    //     console.log('conectado')
    //   });

router.get('/getGroups', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getGroups();

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')   
    }
});

router.get('/getContactsByGroup/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getContactsByGroup(req.params.id);

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')   
    }
});

router.get('/getAllModel', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getAllModel();

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')   
    }
});

router.get('/getModelById/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getModelById(req.params.id);

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')   
    }
});

router.post('/getProposal', async (req, res, next) => {
    const {body} = req.body;
    try {
        const refProposalDecoded = decodeURIComponent(body);
        const result = await direct_mail_pricing.getProposal(refProposalDecoded);
        const table = await direct_mail_pricing.getProposalDetails(refProposalDecoded);
       

        res.status(200).json({result,table})
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.post('/getAllProposalByRef', async (req, res, next) => {
    const {body} = req.body;
    try {
        const refProposalDecoded = decodeURIComponent(body);
        let result = await direct_mail_pricing.getAllProposalByRef(refProposalDecoded);
        
        // console.log(result)
   
        let result_files = await direct_mail_pricing.getAllFilesProposalByRef(refProposalDecoded)

    
        // Formate o array para ser usado com o Choices.js
        // { value: 'opcao1', label: 'Casa' }
        result = result.map(function(element) {
            let allfiles = result_files.filter(proposta => proposta.IdProposta_Frete === element.IdProposta_Frete) || [];
            
            return {
                customProperties:{name:element.Numero_Proposta, files:allfiles},
                value: `${element.Numero_Proposta}`,
                label: `${element.Numero_Proposta} [${element.Incoterm}]`,
                selected: true,
            };
        });
       
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.post('/getFileByProposal', async (req, res, next) => {
    const {body} = req.body;
    try {

        const files = await direct_mail_pricing.getFileByProposal(body);

        res.status(200).json({files})
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.post('/editingNameGroup', async (req, res, next) => {
    const {body} = req.body;
    try {

        const result = await direct_mail_pricing.editingNameGroup(body);

        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.post('/getFilesEmailsHistory', async (req, res, next) => {
    const {body} = req.body;
    try {

        const result = await direct_mail_pricing.getFilesEmailsHistory(body.id);

        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/downloadPDF', async (req, res, next) => {
   
    const result = await executeQuerySQL(`
            DECLARE @IdArquivo INT = 21399;

            -- Selecione os dados do arquivo
            DECLARE @DadosArquivo VARBINARY(MAX);

            SELECT @DadosArquivo = Dados_Arquivo
            FROM arq_Arquivo
            WHERE IdArquivo = @IdArquivo;

            SELECT @DadosArquivo AS DadosArquivo;
        `)
    // console.log(result)
        // Obtenha os dados do arquivo do resultado da consulta
    // const dadosArquivo = result[0].DadosArquivo;
    // console.log(dadosArquivo)

    const arquivoSalvo = fs.writeFileSync('./teste.pdf', dadosArquivo);
    // console.log(arquivoSalvo)
 
});

router.post('/sendMail', async (req, res, next) => {
    const {body, EmailTO, subject, ccAddress,ccOAddress, system_userID, proposalRef, files, revisaoPricing, changeStatusActivity, adicionarAtividadeCotando} = req.body;
    try {

        const result = await direct_mail_pricing.sendMail(body, EmailTO, subject, ccAddress,ccOAddress, system_userID, io, proposalRef, files, revisaoPricing, changeStatusActivity, adicionarAtividadeCotando);

        
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.post('/registerGroup', async (req, res, next) => {
    const {body} = req.body;
    try {
        const result = await direct_mail_pricing.registerGroup(body);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.post('/registerContact', async (req, res, next) => {
    const {name, email, groupID} = req.body;
    try {
        const result = await direct_mail_pricing.registerContact(name, email, groupID);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/getAllGroups', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getAllGroups();
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/getContactByGroup/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getContactByGroup(req.params.id);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/removeContact/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.removeContact(req.params.id);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/getContactByID/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getContactByID(req.params.id);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/removeGroup/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.removeGroup(req.params.id);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.post('/editContact', async (req, res, next) => {
    const {body} = req.body
    try {
        const result = await direct_mail_pricing.editContact(body);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.post('/registerModelEmail', async (req, res, next) => {
    const {body} = req.body;
    try {
        const result = await direct_mail_pricing.registerModelEmail(body);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.post('/editModelEmail', async (req, res, next) => {
    const {body} = req.body
    try {
        const result = await direct_mail_pricing.editModelEmail(body);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/removeModelEmail/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.removeModelEmail(req.params.id);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/ListAllEmails', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.ListAllEmails();

        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.post('/ListAllEmails', async (req, res, next) => {
    try {
        const attUser = await Users.ListUserByEmail(req.body.email);
        const result = await direct_mail_pricing.ListAllEmailsByDept(attUser[0]);

        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});

router.get('/getEmailById/:id', async (req, res, next) => {
    try {
        const result = await direct_mail_pricing.getEmailById(req.params.id);
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});


return router;

};







// module.exports = router;