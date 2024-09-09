document.addEventListener("DOMContentLoaded", async () => {

    //Chama a função
    await generateTable()
    
    document.querySelector('#loader2').classList.add('d-none')
})

async function generateTable() {

  // Destruir a tabela existente, se houver
  if ($.fn.DataTable.isDataTable('#table_control_password')) {
      $('#table_control_password').DataTable().destroy();
  }

  // Calcular a altura disponível dinamicamente
  const alturaDisponivel = window.innerHeight - document.querySelector('.card-header').offsetHeight

  const userLogged = await getInfosLogin()

  // Criar a nova tabela com os dados da API
  table['table_control_password'] =  $('#table_control_password').DataTable({
      dom: 'frtip',
      paging: false,  // Desativa a paginação
      fixedHeader: true, // Cabeçalho fixo
      info: false,
      scrollY: 'calc(100vh - 240px)',  // Define a altura dinamicamente
      scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
      order: [[0, 'asc']],
      ajax: {
          url: `/api/control-password/getAllByUser?id_collaborator=${userLogged.system_collaborator_id}`,
          dataSrc: ''
        },

      columns: [
          { data: 'title' },
          { data: 'login' },
          { data: 'responsibleName' },
          { data: 'departmentNames' },
          { data: 'update_at' },
          {
              data: null, // Esta coluna não vai buscar dados diretamente
              render: function (data, type, row) {
                  return `
                      <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-secondary-light product-btn" title="Editar" onclick="openPasswordEdit(${row.id})">
                          <i class="ri-edit-line"></i>
                      </a>
                      <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-danger-light product-btn" title="Deletar" onclick="confirmarDelecao(${row.id})">
                          <i class="ri-delete-bin-line"></i>
                      </a>
                  `;
              },
              orderable: false, // Impede que a coluna seja ordenável
          },
      ],
      createdRow: function(row, data, dataIndex) {
          // Adiciona o atributo com o id da senha 
          $(row).attr('password-id', data.id);
          // Adicionar evento click na linha 
          $(row).on('dblclick', async function() {
              const password_id = $(this).attr('password-id'); // Captura o id do password
              await openPassword(password_id);
          });
      },
      buttons: [
          'excel', 'pdf', 'print'
      ],
      language: {
          searchPlaceholder: 'Pesquisar...',
          sSearch: '',
          url: '../../assets/libs/datatables/pt-br.json'
      },
  });

  // Espera o carregamento completo dos dados via AJAX
  table['table_control_password'].on('xhr.dt', function() {
      // Coloque aqui o código que precisa ser executado após os dados serem carregados

      introMain()

      document.querySelector('#table_control_password_filter input').focus()
  });

  // Evento disparado quando a tabela é redesenhada
  table['table_control_password'].on('draw.dt', function() {
      // Coloque aqui o código que precisa ser executado após o redesenho da tabela
  });


 
}