const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { headcargo } = require('../controllers/headCargo');


module.exports = function(io) {
// INICIO API CONTROLE DE COMISSÃO
router.post('/createRegister', async (req, res, next) => {
    const {process, type, dateFilter, user} = req.body;

    try {
        const result = await headcargo.createRegisterComission(process, type, dateFilter, user);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)

        res.status(404).json('Erro')   
    }
});

router.get('/overdueInvoices', async (req, res, next) => {
    const { id, idresponsavel } = req.query;
    try {
        const result = await headcargo.getOverdueInvoices(id || null, idresponsavel || null);

        res.status(200).json(result);
    } catch (error) {
        console.log(error);

        res.status(404).json('Erro');
    }
});

router.get('/ListInvoicesByProcessId/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        console.log(id)
        const result = await headcargo.ListInvoicesByProcessId(id);

        res.status(200).json(result);
    } catch (error) {
        console.log(error);

        res.status(404).json('Erro');
    }
});


// INICIO API CONTROLE DE COMISSÃO
router.post('/filter', async (req, res, next) => {
    const {filters} = req.body;

    try {
        const result = await headcargo.filterLog(filters);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)

        res.status(404).json('Erro')   
    }
});

router.post('/getRegisterById', async (req, res, next) => {
    const {id} = req.body;

    try {
        const result = await headcargo.getRegisterById(id);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)

        res.status(404).json('Erro')   
    }
});

router.post('/sendEmailRegisters', async (req, res, next) => {
    try {
        const result = await headcargo.sendEmailRegisters(req.body);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)

        res.status(404).json('Erro')   
    }
});

router.post('/sendEmailRegistersByColab', async (req, res, next) => {
    try {
        const result = await headcargo.sendEmailRegistersByColab(req.body);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)

        res.status(404).json('Erro')   
    }
});

router.post('/confirmPayment', async (req, res, next) => {
    const {id} = req.body;
    try {
        const result = await headcargo.confirmPayment(id);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)

        res.status(404).json('Erro')   
    }
});

router.post('/listRegister', async (req, res, next) => {
    try {
        const result = await headcargo.listRegisterComission();

        res.status(200).json(result)
    } catch (error) {
        console.log(error)

        res.status(404).json('Erro')   
    }
});

router.post('/filterComission', async (req, res, next) => {
    const {filters} = req.body;

    try {
        const result = await headcargo.gerenateCommission(filters);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});

router.post('/listSettings', async (req, res, next) => {
    const {id, type} = req.body;

    try {
        const result = await headcargo.listSettings(id, type);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});

router.post('/removeSetting', async (req, res, next) => {
    const {id} = req.body;
    try {
        const result = await headcargo.removeSetting(id);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});

router.post('/verifyRegisters', async (req, res, next) => {
    const {filters} = req.body;
    try {
      
        const result = await headcargo.verifyRegisters(filters);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});

router.post('/verifyPercentageComission', async (req, res, next) => {
    const {id} = req.body;
    try {

        const result = await headcargo.verifyPercentageComission(id);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});


router.post('/registerPercentage', async (req, res, next) => {
    try {
        const result = await headcargo.registerPercentage(req.body);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});

router.post('/cancelRegister', async (req, res, next) => {
    const {id} = req.body;
    try {
        const result = await headcargo.cancelRegister(id);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});
// FIM API CONTROLE DE COMISSÃO



// INICIO API Gestão de Inatividade Comercial
router.post('/listAllClienteInactive', async (req, res, next) => {
    const {filters} = req.body;
    try {
        const result = await headcargo.listAllClienteInactive(filters);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});


// FIM API Gestão de Inatividade Comercial




router.post('/GetFeesByProcess', async (req, res, next) => {
    const {reference} = req.body;

    try {
        const result = await headcargo.GetFeesByProcess(reference);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});


router.post('/getAllProcessByRef', async (req, res, next) => {
    const {body} = req.body;
    console.log(body)
    try {
        const refProposalDecoded = decodeURIComponent(body);
        let result = await headcargo.getAllProcessByRef(refProposalDecoded);
        


    
        // Formate o array para ser usado com o Choices.js
        // { value: 'opcao1', label: 'Casa' }
        result = result.map(function(element) {
            
            return {
                customProperties:{reference:element.Numero_Processo, id:element.IdLogistica_House},
                value: `${element.Numero_Processo}`,
                label: `${element.Numero_Processo}`,
                selected: true,
            };
        });
       
        res.status(200).json(result)
    } catch (error) {
        res.status(404).json('Erro')   
    }
});


// Rota para criar uma nova recompra
router.post('/CreateRepurchase', async (req, res, next) => {
    const {alteredFees, observation, idCollaborator} = req.body;

    try {
        const result = await headcargo.createRepurchase(alteredFees, observation, idCollaborator);
        io.emit('updateRepurchase', '')
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json('Erro ao criar a recompra');
    }
});

// Rota para obter recompras por processo
router.get('/GetRepurchases', async (req, res, next) => {
    const { process_id, status } = req.query;

    try {
        const result = await headcargo.getRepurchases(process_id, status);
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(404).json('Erro ao buscar recompras');
    }
});

// Rota para aprovar ou rejeitar uma recompra
router.post('/UpdateRepurchaseStatus', async (req, res, next) => {
    const { repurchase_id, status, user_id } = req.body;

    try {
        const result = await headcargo.updateRepurchaseStatus({ repurchase_id, status, user_id });
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json('Erro ao atualizar o status da recompra');
    }
});

// Rota para obter o histórico de uma recompra específica
router.post('/GetRepurchaseHistory', async (req, res, next) => {
    const { repurchase_id } = req.body;

    try {
        const result = await headcargo.getRepurchaseHistory(repurchase_id);
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(404).json('Erro ao buscar o histórico da recompra');
    }
});


    return router;
}

