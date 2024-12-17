const { executeQuery } = require('../connect/mysql');
// Importa a função sendEmail do arquivo emailService.js
const { sendEmail } = require('../support/send-email');

const internalComments = {
   deptsByUser: async function (collabId) {

      let result = await executeQuery(`
         SELECT dr.department_id, dp.name
         FROM departments_relations dr
         LEFT OUTER JOIN departments dp ON dp.id = dr.department_id
         WHERE dr.collaborator_id = ${collabId}`)

      return result;
   },
   modulesByUser: async function (userId) {

      let result = await executeQuery(`
         SELECT ma.modules_id, ma.user_id, md.title
         FROM modules_acess ma
         LEFT OUTER JOIN modules md ON md.id = ma.modules_id
         WHERE ma.user_id = ${userId}`)

      return result;
   },
   commentsByDept: async function (deptId) {

      let result = await executeQuery(`
         SELECT ic.title, ic.description, ic.comment_date,
         cl.id_headcargo, cl.name, cl.family_name, md.title as 'module'
         FROM internal_comments ic
         LEFT OUTER JOIN collaborators cl on cl.id = ic.collab_id
         LEFT OUTER JOIN modules md on md.id = ic.module_id
         WHERE department_id = ${deptId}
         ORDER BY ic.comment_date DESC`)

      return result;
   },
   saveComment: async function (answer) {

      const date = new Date(answer.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      answer.date = `${year}-${month}-${day}`;

      if (!answer.modules) {
         answer.modules = null;
      }
      if (!answer.dept) {
         answer.dept = null;
      }

      await executeQuery(`
      INSERT INTO internal_comments (title, description, module_id, department_id, comment_date, collab_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [answer.title, answer.comment, answer.modules, answer.dept, answer.date, answer.collabId]);

      return true;
   },
}

module.exports = {
   internalComments,
};