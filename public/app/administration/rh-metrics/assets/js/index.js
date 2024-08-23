
// Conecta-se ao servidor Socket.io
const socket = io();

 // Evento para receber mensagens do servidor
 socket.on('att-non-compliance', async (msg) => {
    // document.querySelector('#loader2').classList.remove('d-none')
    // await listPendingOccurrences();
    // await listAllOccurrences();
    // await listAllActions()
    // document.querySelector('#loader2').classList.add('d-none')
});



async function listPendingOccurrences(){
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/non-compliance/getPendingOccurrences`);

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#pending_occurrences_table')) {
        $('#pending_occurrences_table').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    $('#pending_occurrences_table').DataTable({
        dom: 'frtip',
        scrollY: '270px',  // Altura fixa com rolagem
        scrollCollapse: false, // Permite a tabela colapsar caso tenha menos dados
        paging: false, // Desativar paginação para usar rolagem
        order: [[0, 'desc']],
        data: dados,
        pageInfo: false,
        bInfo: false,
        columns: [
            { data: 'reference' },
            { data: 'title' },
            { data: 'type' },
            { data: 'responsibles' },
            { data: 'status' },
            { data: 'date_occurrence' },
            // { data: 'action' }
            // Adicione mais colunas conforme necessário
        ],
        buttons: [
            'excel', 'pdf'
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
            searchPlaceholder: 'Pesquisar...',
        },
        "rowCallback": function(row, data, index) {
            // Adiciona um atributo id a cada linha
            $(row).attr('occurrence-id', data.id);
        },
        initComplete: function () {
            requestAnimationFrame(async () => {
                await dblClickOnOccurrence('#pending_occurrences_table')
            });
        },
    });

    
}

async function generateCharts(data){
    // carrega as unidades cadastradas (filiais)
    const Units = await makeRequest(`/api/non-compliance/AllUnit`);
    console.log(Units,data)
   
     // Dados para preencher os elementos
     const occurrencesByUnit = await Promise.all(Units.map(async (unit) => {
        // Filtra as ocorrências para a unidade atual
        const unitOccurrences = data.filter(item => item.company_id === unit.id);
        const total = unitOccurrences.length.toString().padStart(4, '0');
        
        // Retorna um objeto com os dados da unidade
        return {
            city: unit.city,
            country: unit.country,
            total: total
        };
    }));

    // Preenche os elementos de ocorrências por unidade
    const occurrencesContainer = document.querySelector('.bodyOccurrencePerUnit');
    occurrencesContainer.innerHTML = '';
    occurrencesByUnit.forEach(unit => {
        const unitElement = `
            <div class="col-xxl-4 col-xl-4 col-lg-4 col-md-4 col-sm-12">
                <div class="d-flex align-items-top">
                    <div class="me-3"> <span class="avatar text-primary"> <i class="ti ti-files fs-18"></i> </span> </div>
                    <div> <span class="d-block mb-1 text-muted">${unit.city} | ${unit.country}</span>
                        <h6 class="fw-semibold mb-0">${unit.total}</h6> </div>
                </div>
            </div>
        `;
        occurrencesContainer.insertAdjacentHTML('beforeend', unitElement);
    });

      // Filtra ocorrências abertas neste mês
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
  
      const openOccurrences = data.filter(item => {
          const occurrenceDate = new Date(item.date_occurrence_noformat);
          return occurrenceDate.getMonth() === currentMonth && 
                 occurrenceDate.getFullYear() === currentYear;
      }).length;


      document.querySelector('.open-occurrences').textContent = openOccurrences.toString().padStart(openOccurrences.length >= 2 ? 4 : 2, '0');
      

     await occurrencesStatusChart(data)
     await occurrencesTypeChart(data)

   
}   



window.addEventListener("load", async () => {
    // inicio da função verificar tempo de carregamento da pagina e suas consultas no banco
    console.time(`A página "${document.title}" carregou em`)

    // await listPendingOccurrences();



    


    document.querySelector('#loader2').classList.add('d-none')
    // fim da função verificar tempo de carregamento da pagina e suas consultas no banco
    console.timeEnd(`A página "${document.title}" carregou em`);
})

