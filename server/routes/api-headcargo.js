const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const html_to_pdf = require('html-pdf-node');
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




router.post('/getTaxasProcessByRef', async (req, res, next) => {
    const {reference} = req.body;

    try {
        const result = await headcargo.getTaxasProcessByRef(reference);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});


router.post('/getAllHeadProcessByRef', async (req, res, next) => {
    const {body} = req.body;

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
    const { userID, status, groupBy} = req.query;
    try {
        const result = await headcargo.getRepurchases(userID, status, groupBy);
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(404).json('Erro ao buscar recompras');
    }
});

// Rota para obter recompras por processo
router.get('/GetRepurchasesPayment', async (req, res, next) => {
    try {
        const result = await headcargo.GetRepurchasesPayment();
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(404).json('Erro ao buscar recompras');
    }
});

// Rota para obter recompras por processo
router.post('/GetRepurchasesPaymentDetails', async (req, res, next) => {
    const { unique_id } = req.body;
    try {
        const result = await headcargo.GetRepurchasesPaymentDetails(unique_id);
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(404).json('Erro ao buscar recompras');
    }
});

// Rota para obter recompras por processo
router.post('/GetFeesByProcess', async (req, res, next) => {
    const { processId, status, userID, groupBy } = req.body;

    try {
        const result = await headcargo.getRepurchasesByProcess(processId, status, userID, groupBy);
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(404).json('Erro ao buscar recompras');
    }
});

// Rota para obter a taxa do dia de uma recompra e o lucro atual do processo
router.post('/get-value-and-rate-by-repurchase', async (req, res, next) => {
    const { userID, status } = req.body;


    try {
        const result = await headcargo.getValueAndRate(userID, status);
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(404).json('Erro ao buscar informações da recompra');
    }
});

// send-preview
router.post('/send-preview', async (req, res, next) => {
    const { userID, destination } = req.body;

    try {
        const result = await headcargo.sendEmailRepurchasePreview(userID, destination);
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(404).json('Erro ao enviar o preview');
    }
});

// Rota para gerar o PDF com formatação correta
router.post('/generate-pdf', async (req, res) => {
    const { userID } = req.body;

    try {
        // Obtenha os dados necessários
        const repuchases = await headcargo.getValueAndRate(userID, 'APPROVED');
        const repurchase = repuchases.fees;
        const total = repuchases.totalRepurchaseFomated;
        const commision = repuchases.commisionFormated;

          // Gerar as linhas da tabela
          const rows = repurchase.map(item => `
          <tr>
              <td>${item.referenceProcess}</td>
              <td>${item.fee_name}</td>
              <td>${item.oldPurchaseValueCell}</td>
              <td>${item.newPurchaseValueCell}</td>
              <td>${item.oldSaleValueCell}</td>
              <td>${item.newSaleValueCell}</td>
              <td>${item.percentRepurchaseComissionFormated}</td>
          </tr>`).join('');

        const name = repurchase[0].fullName;

        // HTML com o mesmo estilo que o e-mail
        const htmlContent = `<head>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
              
            }
            .container {
                max-width: 800px;
                margin: 20px auto;
                overflow: hidden;
            }
            .header {
                background-color: #f9423a;
                color: #ffffff;
                text-align: center;
                padding: 20px;
                font-size: 24px;
                font-weight: bold;
            }
            .summary-table, .table {
                width: 90%;
                margin: 0 auto;
                border-collapse: collapse;
                text-align: center;
            }
            .summary-table td, .table th, .table td {
                border: 1px solid #ddd;
                padding: 10px;
            }
            .summary-table {
                margin: 20px auto;
                font-size: 16px;
                font-weight: bold;
            }
            .summary-table td span {
                color: #f9423a;
                font-size: 18px;
            }
            .table th {
                background-color: #f9423a;
                color: #fff;
                padding: 10px;
                font-size: 10px;
            }
            .table {
                font-size: 10px !important;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Cabeçalho -->
            <div class="header">Recompras - ${name}</div>
    
            <!-- Summary como tabela -->
            <table class="summary-table">
                <tr>
                    <td>Recompras: <p><span>${repurchase.length}</span></p></td>
                    <td>Total em Recompras: <p><span>${total}</span></p></td>
                    <td>Valor Comissão: <p><span>${commision}</span></p></td>
                </tr>
            </table>
    
            <!-- Tabela de recompras -->
            <table class="table">
                <thead>
                    <tr>
                        <th>Processo</th>
                        <th>Taxa</th>
                        <th>Compra</th>
                        <th>Nova Compra</th>
                        <th>Venda</th>
                        <th>Nova Venda</th>
                        <th>Comissão</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    </body>`;

        // Opções do PDF
        const options = { format: 'A4', printBackground: true };

        // Criar o PDF
        const file = { content: htmlContent };
        const pdfBuffer = await html_to_pdf.generatePdf(file, options);

        // Configurar o cabeçalho e enviar o PDF
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="'+'Recompras - '+name+'.pdf"',
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erro ao gerar o PDF.');
    }
});

router.post('/mark-as-paid', async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: 'IDs inválidos' });
    }

    try {
        await headcargo.markaspaid(ids);
        res.status(200).json({ success: true, message: 'Recompras atualizadas para PAID.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar recompra(s).' });
    }
});



// Rota para aprovar ou rejeitar uma recompra
router.post('/UpdateRepurchaseStatus', async (req, res, next) => {
    const { repurchase_id, status, user_id } = req.body;


    try {
        const result = await headcargo.updateRepurchaseStatus({ repurchase_id, status, user_id });
        io.emit('updateRepurchase', '')
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


// Rota para pegar as tabelas do Head
router.post('/getTables', async (req, res, next) => {

    try {
        const result = await headcargo.getTables();

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});

// Rota para pegar as tabelas do Head
router.post('/getColumns', async (req, res, next) => {
    const { table } = req.body;

    try {
        const result = await headcargo.getColumns(table);

        res.status(200).json(result)
    } catch (error) {
        console.log(error)
        res.status(404).json('Erro')   
    }
});


    return router;
}

