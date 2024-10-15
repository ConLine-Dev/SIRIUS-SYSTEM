const { executeQuery } = require('../connect/mysql');

const safetyInspection = {
    // Lista todos os departamentos;
    safety_monitoring: async function() {
        let result = await executeQuery(`SELECT * FROM safety_monitoring ORDER BY name`)
        return result;
    },
    inspections: async function() {
        let result = await executeQuery(`SELECT ssi.*, sm.name as nameLocation FROM safety_scheduled_inspections  ssi
        JOIN safety_monitoring sm ON sm.id = ssi.location`)
        return result;
    },
    corrective_actions: async function() {
        let result = await executeQuery(`SELECT * FROM safety_corrective_actions ORDER BY id desc`)
        return result;
    },
    corrective_actions_pending: async function() {
        let result = await executeQuery(`SELECT * FROM safety_corrective_actions WHERE status = 0 ORDER BY id desc`)
        return result;
    },
    corrective_actions_completed: async function() {
        let result = await executeQuery(`SELECT * FROM safety_corrective_actions WHERE status = 1 ORDER BY id desc`)
        return result;
    },

}


module.exports = {
    safetyInspection,
};