const express = require('express'); // Importa o Express
const router = express.Router(); // Cria uma nova instância do router
const { meetingControl } = require('../controllers/meeting-control'); // Importa o módulo de gerenciamento

module.exports = function(io) {
    // Rota para obter todos os módulos
    router.get('/getAllCategoryCalendar', async (req, res, next) => {
        try {
            const result = await meetingControl.getAllCategoryCalendar();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/getEventsByUser', async (req, res, next) => {
        try {
            const result = await meetingControl.getEventsByUser(req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/getCollabsByDept', async (req, res, next) => {
        try {
            const result = await meetingControl.getCollabsByDept(req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.get('/getAllEventsFull', async (req, res, next) => {
        try {
            const result = await meetingControl.getAllEventsFull();
            res.status(200).json(result);
        } catch (error) {
            res.status(404).json(error);
        }
    });

    router.post('/saveEvent', async (req, res, next) => {
        try {
            const result = await meetingControl.saveEvent(req.body);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });

    router.post('/createMessage', async (req, res, next) => {
        try {
            const result = await meetingControl.createMessage(req.body);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });

    router.post('/updateEvent', async (req, res, next) => {
        try {
            const result = await meetingControl.updateEvent(req.body);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });

    router.post('/deleteEvent', async (req, res, next) => {
        const {id} = req.body
        try {
            const result = await meetingControl.deleteEvent(id);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });

    router.post('/getCollabData', async (req, res, next) => {
        try {
            const result = await meetingControl.getCollabData(req.body);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });

    router.post('/updateEventDate', async (req, res, next) => {
        const {id, days} = req.body
        try {
            const result = await meetingControl.updateEventDate(id, days);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });

    router.post('/verifyFreeRoom', async (req, res, next) => {
        const {firstDate, lastDate} = req.body
        try {
            const result = await meetingControl.verifyFreeRoom(firstDate, lastDate);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });

    router.post('/verifyFreeBooth', async (req, res, next) => {
        const {firstDate, lastDate} = req.body
        try {
            const result = await meetingControl.verifyFreeBooth(firstDate, lastDate);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });

    router.post('/getById', async (req, res, next) => {
        const {id} = req.body
        try {
            const result = await meetingControl.getById(id);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });

    router.post('/getDepartmentsbyEvent', async (req, res, next) => {
        try {
            const result = await meetingControl.getDepartmentsbyEvent(req.body.id);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });

    router.post('/getResponsiblesbyEvent', async (req, res, next) => {
        try {
            const result = await meetingControl.getResponsiblesbyEvent(req.body.id);
    
            res.status(200).json(result)
        } catch (error) {
            res.status(500).json(error);
        }
    });

    // Retorna o router configurado
    return router;
};
