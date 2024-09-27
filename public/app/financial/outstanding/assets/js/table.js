// Função para receber o id da categoria que esta sendo aberta nesta janela
async function getUrlData() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const status = urlParams.get('status');
    const startDate = urlParams.get('startDate');
    const endDate = urlParams.get('endDate');
    
    return {status, startDate, endDate};
 };

 let datatable_list_invoice;

 async function listInvoices(data) {
 
    if (datatable_list_invoice) {
       $('#fullTable').empty();
    };
 
    datatable_list_invoice = $('#fullTable').DataTable({
       "data": data,
       "columns": [
          { 
             "data": "Numero_Processo",
             "className": "Numero_Processo",
             "render": function (data, type, row) {
                   return data;
             }
          },
          { 
            "data": "Pessoa",
            "className": "Pessoa",
            "render": function (data, type, row) {
                  return data;
            }
         },
         { 
            "data": "Data",
            "className": "Data",
            "render": function (data, type, row) {
                  return formattedDateTime(data);
            }
         },
          { 
             "data": "Valor_Total",
             "className": "Valor_Total",
             "render": function (data, type, row) {
                if (data) {
                    return `<span>${data.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</span>`;
                } else {
                    return '<span>R$ 0,00</span>'; // Valor padrão quando o dado for inválido
                }
             }
          },
          { 
            "data": "Tipo_Fatura",
            "className": "Tipo_Fatura",
            "render": function (data, type, row) {
                  return data;
            }
         },
       ],
       "language": {
         "searchPlaceholder": 'Pesquisar...',
         "sSearch": '',
          "url": '../../assets/libs/datatables/pt-br.json'
       },
       "order": [[1, 'desc']],
       "scrollX": false,
       "autoWidth": false,
       "destroy": true, // Permite recriar o DataTable
       "dom": 'Bfrtip', // Adiciona o dom para botões
       "buttons": [
          {
             extend: 'excelHtml5',
             text: 'Exportar para Excel',
             titleAttr: 'Exportar para Excel'
          }
       ],

       "pageLength": 15, // Define o limite máximo de linhas por página
       "lengthMenu": [15], // Remove as outras opções de paginação e fixa em 13 linhas
       
    });
};

 // Função para formatar a data (dia, mês, ano) no gráfico
function formattedDateTime(time) {
   const date = new Date(time);

   const year = date.getUTCFullYear();
   const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // meses começam de 0 a 11, então adicionamos 1
   const day = String(date.getUTCDate()).padStart(2, '0');

   return `${day}/${month}/${year}`;
};



document.addEventListener("DOMContentLoaded", async () => {
    const url = await getUrlData();
    const result = await makeRequest(`/api/financial-indicators/${url.status}`, 'POST', {startDateGlobal: url.startDate, endDateGlobal: url.endDate});

    await listInvoices(result)

    document.querySelector('#loader2').classList.add('d-none')
})