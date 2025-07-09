const table = [];

// Esta função é executada quando o documento HTML é completamente carregado e analisado
document.addEventListener("DOMContentLoaded", async () => {
    // Chama a função para gerar a tabela
    await generateTable();

    // Configura o socket para atualizações em tempo real
    const socket = io();

    socket.on('updateActiveClients', (data) => {
        table['table_active_clients'].ajax.reload(null, false);
    });

    // Configura o botão de exportação para Excel
    document.getElementById('btn-export-excel').addEventListener('click', exportToExcel);

    // Esconde o loader quando tudo estiver carregado
    document.querySelector('#loader2').classList.add('d-none');
});

// Esta função cria ou recria a tabela de clientes ativos na página
async function generateTable() {
    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_active_clients')) {
        $('#table_active_clients').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    table['table_active_clients'] = $('#table_active_clients').DataTable({
        dom: 'Bfrtip',
        paging: false,  // Desativa a paginação
        fixedHeader: true, // Cabeçalho fixo
        info: false,
        scrollY: 'calc(100vh - 240px)',  // Define a altura dinamicamente
        scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
        order: [[0, 'asc']],
        ajax: {
            url: `/api/marketing/active-clients/getAll`,
            dataSrc: ''
        },
        columns: [
            { data: 'Email' },
            { data: 'Empresa' }
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        },
        buttons: [
            {
                extend: 'excelHtml5',
                text: 'Exportar Excel',
                title: 'Clientes Ativos - Marketing',
                className: 'd-none', // Esconde o botão padrão
                exportOptions: {
                    columns: [0, 1] // Exporta todas as colunas visíveis
                }
            }
        ]
    });

    // Espera o carregamento completo dos dados via AJAX
    table['table_active_clients'].on('xhr.dt', function() {
        // Coloque aqui o código que precisa ser executado após os dados serem carregados
        document.querySelector('#table_active_clients_filter input').focus();
    });
}

// Função para exportar a tabela para Excel usando método manual
function exportToExcel() {
    // Mostrar o loader durante a exportação
    document.querySelector('#loader2').classList.remove('d-none');
    
    // Buscar os dados diretamente da API
    fetch('/api/marketing/active-clients/getAll')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar dados: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data && data.length > 0) {
                try {
                    // Criar um workbook do Excel
                    const wb = XLSX.utils.book_new();
                    
                    // Converter os dados para o formato de planilha
                    const ws = XLSX.utils.json_to_sheet(data);
                    
                    // Adicionar a planilha ao workbook
                    XLSX.utils.book_append_sheet(wb, ws, "Clientes Ativos");
                    
                    // Gerar o arquivo Excel e fazer o download
                    XLSX.writeFile(wb, "clientes_ativos_marketing.xlsx");
                    
                    // Mostrar mensagem de sucesso
                    Swal.fire({
                        title: 'Sucesso!',
                        text: `Exportação concluída com sucesso. ${data.length} registros exportados.`,
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
                } catch (err) {
                    console.error('Erro ao processar Excel:', err);
                    Swal.fire({
                        title: 'Erro!',
                        text: 'Ocorreu um erro ao processar o arquivo Excel: ' + err.message,
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            } else {
                // Mostrar mensagem de erro se não houver dados
                Swal.fire({
                    title: 'Aviso',
                    text: 'Não há dados para exportar.',
                    icon: 'warning',
                    confirmButtonText: 'OK'
                });
            }
            
            // Esconder o loader após a exportação
            document.querySelector('#loader2').classList.add('d-none');
        })
        .catch(error => {
            console.error('Erro ao exportar dados:', error);
            
            // Esconder o loader em caso de erro
            document.querySelector('#loader2').classList.add('d-none');
            
            // Mostrar mensagem de erro
            Swal.fire({
                title: 'Erro!',
                text: 'Ocorreu um erro ao exportar os dados: ' + error.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
} 