async function newCategory() {
   const body = {
       url: `/app/stock/new-category`,
       width: 700, 
       height: 600,
       resizable:false
   }
   window.ipcRenderer.invoke('open-exWindow', body);
};

document.getElementById('createCategory').addEventListener('click', async function(e) {
   e.preventDefault();
   await newCategory();
})

// Função que envia para a proxima janela o id do produto clicado
async function editCategory(id) {
   const body = {
      url: `/app/stock/edit-category?id=${id}`,
      width: 700, 
      height: 600,
      resizable:false
   }
   window.ipcRenderer.invoke('open-exWindow', body);
};

const table = [];

// Esta função cria ou recria a tabela de controle de senhas na página
async function generateTable() {
   // Destruir a tabela existente, se houver
   if ($.fn.DataTable.isDataTable('#table-list-categories')) {
      $('#table-list-categories').DataTable().destroy();
   }

   // Criar a nova tabela com os dados da API
   table['table-list-categories'] =  $('#table-list-categories').DataTable({
      columns: [
         { data: 'Category' },
         { data: 'Department' },
         { data: 'Observation' },
      ],
      paging: false,  // Desativa a paginação
      fixedHeader: true, // Cabeçalho fixo
      info: false,
      scrollY: 'calc(100vh - 200px)',  // Define a altura dinamicamente
      scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
      order: [[0, 'asc']],
      ajax: {
         url: `/api/product/listAllCategories`,
         dataSrc: ''
      },
      buttons: [
         'excel', 'pdf', 'print'
      ],
      language: {
         searchPlaceholder: 'Pesquisar...',
         sSearch: '',
         url: '../../assets/libs/datatables/pt-br.json'
      },
      createdRow: function(row, data, dataIndex) {
         // Adiciona o atributo com o id da senha 
         $(row).attr('category-id', data.id);
         // Adicionar evento click na linha 
         $(row).on('dblclick', async function() {
            const category_id = $(this).attr('category-id'); // Captura o id do produto
            await editCategory(category_id);
         });
      },
   });

   // Evento de input no campo personalizado para pesquisar
   $('#search').on('input', function () {
      const value = $(this).val().trim();
      // Faz a pesquisa no DataTables
      table['table-list-category'].search(value).draw();
   });
}

// Função executada após toda a página ser executada
window.addEventListener("load", async () => {
   await generateTable();

   const socket = io();

   socket.on('updateListCategories', (data) => {
      table['table-list-categories'].ajax.reload(null, false)
   })

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')
})