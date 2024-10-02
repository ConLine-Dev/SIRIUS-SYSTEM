async function newProduct() {
   const body = {
       url: `/app/stock/new-product`,
       width: 700, 
       height: 600,
       resizable:false
   }
   window.ipcRenderer.invoke('open-exWindow', body);
};

document.getElementById('createProduct').addEventListener('click', async function(e) {
   e.preventDefault();
   await newProduct();
})

// Função que envia para a proxima janela o id do produto clicado
async function editProduct(id) {
   const body = {
      url: `/app/stock/edit-product?id=${id}`,
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
   if ($.fn.DataTable.isDataTable('#table-list-products')) {
      $('#table-list-products').DataTable().destroy();
   }

   // Criar a nova tabela com os dados da API
   table['table-list-products'] =  $('#table-list-products').DataTable({
      columns: [
         { data: 'Product' },
         { data: 'ncm' },
         { data: 'Category' },
         { data: 'Department' },
         { data: 'observation' },
      ],
      paging: false,  // Desativa a paginação
      fixedHeader: true, // Cabeçalho fixo
      info: false,
      scrollY: 'calc(100vh - 200px)',  // Define a altura dinamicamente
      scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
      order: [[0, 'asc']],
      ajax: {
         url: `/api/product/listAllProducts`,
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
         $(row).attr('product-id', data.id);
         // Adicionar evento click na linha 
         $(row).on('dblclick', async function() {
            const product_id = $(this).attr('product-id'); // Captura o id do produto
            await editProduct(product_id);
         });
      },
   });

   // Evento de input no campo personalizado para pesquisar
   $('#search').on('input', function () {
      const value = $(this).val().trim();
      // Faz a pesquisa no DataTables
      table['table-list-products'].search(value).draw();
   });
}

// Função executada após toda a página ser executada
window.addEventListener("load", async () => {
   await generateTable();

   const socket = io();

   socket.on('updateListProducts', (data) => {
      table['table-list-products'].ajax.reload(null, false)
   })

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')
})