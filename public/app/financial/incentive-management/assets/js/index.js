document.addEventListener("DOMContentLoaded", async () => {
    await createElements();
    document.querySelector('#loader2').classList.add('d-none');
  
    // Event listener for the button click
    document.querySelector('#startComparison').addEventListener('click', handleFile);
  });
  
  async function createElements() {
    FilePond.registerPlugin(
      FilePondPluginImagePreview,
      FilePondPluginImageExifOrientation,
      FilePondPluginFileValidateSize,
      FilePondPluginFileEncode,
      FilePondPluginImageEdit,
      FilePondPluginFileValidateType,
      FilePondPluginImageCrop,
      FilePondPluginImageResize,
      FilePondPluginImageTransform
    );
  
    // Create the FilePond instance
    FilePond.create(document.querySelector('.file-upload'), {
      labelIdle: 'Arraste e solte seu arquivo aqui ou <span class="filepond--label-action">Procure</span> para comparar com o sistema.'
    });
  }
  
  function handleFile() {
    const filePondInstance = FilePond.find(document.querySelector('.file-upload'));
    const file = filePondInstance.getFile();
  
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
        populateTable(json);
      };
      reader.readAsArrayBuffer(file.file);
    } else {
      alert('Please upload a file first.');
    }
  }

  function formatToBRL(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  
  function populateTable(data) {
    const table = $('#incentive_management_table').DataTable();
    table.clear().draw(); // Clear existing data
  
    data.slice(2).forEach(row => {
      // Verifica se a linha não está vazia antes de adicionar
      if (row.some(cell => cell !== undefined && cell !== '')) {

        if(row[5] !== undefined && row[5] !== ''){
            table.row.add([
                row[4] || '',
                row[5] || '',
                row[6] || '',
                row[7] || '',
                row[8] || '',
                formatToBRL(row[9]) || ''
              ]).draw(false);
        }
       
      }
    });
  }
  

async function generateTable() {
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/launches_adm/getAllLaunches/`);

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#incentive_management_table')) {
        $('#table_despesasADM').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    $('#table_despesasADM').DataTable({
        dom: 'Bfrtip',
        pageLength: 15,
        order: [[0, 'desc']],
        data: dados.data,
        columns: [
            { data: 'Data_Vencimento' },
            { data: 'Situacao' },
            { data: 'Historico_Resumo' },
            { data: 'Pessoa' },
            { data: 'Tipo_Transacao' },
            { data: 'Valor' }
            // Adicione mais colunas conforme necessário
        ],
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
        },
    });
}
