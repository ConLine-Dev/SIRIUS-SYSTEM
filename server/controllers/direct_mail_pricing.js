const { executeQuery } = require('../connect/mysql');

const direct_mail_pricing = {
    getGroups: async function(){
 
        let result = await executeQuery(`SELECT * FROM direct_mail_pricing_group ORDER BY name`);
    
        return result;
    },
    getContactsByGroup: async function(id){
 
        let result = await executeQuery('SELECT * FROM direct_mail_pricing_group_list WHERE `group` = '+id+'');
    
        return result;
    },
    getAllModel: async function(){
 
        let result = await executeQuery('SELECT * FROM direct_mail_pricing_models');
    
        return result;
    },
    getModelById: async function(id){
 
        let result = await executeQuery(`SELECT * FROM direct_mail_pricing_models WHERE id = ${id}`);
    
        return result;
    },
}


    module.exports = {
        direct_mail_pricing,
    };