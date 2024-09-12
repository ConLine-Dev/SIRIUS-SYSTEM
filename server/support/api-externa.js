// const fetch = require('node-fetch');

const api = {
   // Pega os dados da pessoa pessada por parametro
   getCep: async function(cep) {
      // URL do endpoint da API
      const url = `https://viacep.com.br/ws/${cep}/json/`

      try {
         const response = await fetch(url);
         if (!response.ok) {
            throw new Error('Erro na solicitação');
         }
         const data = await response.json();
         return data;
      } catch (error) {
         console.error('Erro ao buscar o CEP:', error);
      }
   },

   getCnpjInfoCompany: async function(cnpj) {
      // URL do endPoint da API
      const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`

      try {
         const response = await fetch(url);
         if (!response.ok) {
            throw new Error('Erro na solicitação');
         }
         const data = await response.json();
         return data;
      } catch (error) {
         console.error('Erro ao buscar o CEP:', error);
      }
   },
}


module.exports = {
   api: api
};