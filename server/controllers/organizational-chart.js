const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const organizationalChart = {

    getPeople: async function () {

        const result = await executeQuery(`
            SELECT
                oc.id_collaborator AS 'id',
                CONCAT(SUBSTRING_INDEX(cl.name, ' ',  1), ' ', SUBSTRING_INDEX(cl.family_name, ' ', -1)) AS name,
                cl.id_headcargo AS 'img',
                oc.id_parent AS 'parent',
                cl.job_position
            FROM
                organizational_chart oc
            LEFT OUTER JOIN collaborators cl ON cl.id = oc.id_collaborator`);

        return result;
    },
};

module.exports = {
    organizationalChart,
};
