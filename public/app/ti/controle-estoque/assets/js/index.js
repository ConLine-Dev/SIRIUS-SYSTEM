// [] Isto é um array de objetos
const listaDeMateriais = []

var tableEstoque = '';

const nomeItemInput = document.getElementById('nomeItem');
const quantidadeInput = document.getElementById('quantidade');
const btnCp = document.getElementById('btnCp');

function checkInputs() {
    const nomeItemValue = nomeItemInput.value
    const quantidadeValue = quantidadeInput.value

    if (nomeItemValue.length > 3 && quantidadeValue !== '') {
        btnCp.disabled = false
    } else {
        btnCp.disabled = true
    }

}

nomeItemInput.addEventListener('input', checkInputs)
quantidadeInput.addEventListener('input', checkInputs)

// Função para salvar dados no localStorage (opcional)
function adicionarMaterial(nomeItem, quantidade, tipoMaterial, fornecedor, valor, dataAquisicao, descricao) {
    listaDeMateriais.push({
        nome: nomeItem,
        quantidade: quantidade,
        tipo: tipoMaterial,
        fornecedor: fornecedor,
        valor: valor,
        data: dataAquisicao,
        descricao: descricao
    })
}

// Funçao para listar os materiais no formulário/tabela
function listarMateriais() {
    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_estoque')) {
        $('#table_estoque').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da 'API: é os dados onde vc busca la nso bancos de dados'  
    tableEstoque = $('#table_estoque').DataTable({
        // dom: '<"top"i>Bfr<"d-flex"t>p<"bottom"l>r',
        pageLength: 15,
        order: [[0, 'desc']],
        data: listaDeMateriais,
        columns: [
            { data: 'nome' },
            { data: 'quantidade' },
            { data: 'tipo' },
            { data: 'fornecedor' },
            { data: 'valor' },
            { data: 'data' }
            // Adicione mais colunas conforme necessário
        ],
        dom: 'Bfrtip',
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            "url": "../../assets/libs/datatables/pt-br.json"
        },
    });

}

function enviarItem() {
    // Pegar os valores dos inputs
    const nomeItem = document.getElementById('nomeItem').value;
    const quantidade = document.getElementById('quantidade').value;
    const tipoMaterial = document.getElementById('tipoMaterial').value;
    const fornecedor = document.getElementById('fornecedor').value;
    const valor = document.getElementById('valor').value;
    const dataAquisicao = document.getElementById('dataAquisicao').value;
    const descricao = document.getElementById('descricao').value;


    //Adicionar os materiais
    adicionarMaterial(nomeItem, quantidade, tipoMaterial, fornecedor, valor, dataAquisicao, descricao)

    //Lista os materiais na tela - 
    listarMateriais()

    // Limpa o formulário
    document.getElementById('materialForm').reset();

    // Fecho o modal 'hide=esconde'
    $('#add-estoque').modal('hide');
}


function clickCp() {
    const quantidadeInput = document.getElementById('quantidade');
    const quantidade = Number(quantidadeInput.value)

    const nomeInput = document.getElementById('nomeItem').value

    let html = '';

    for (let i = 0; i < quantidade; i++) {
        const item = quantidade[i];

        html += `<div class="row" style="align-items: center; margin-bottom: 8px;">
                        <div class="col-7">
                            <div class="form-group">
                                <input type="text" class="form-control" disabled value="${nomeInput}" >
                            </div>
                        </div>

                        <div class="col-3">
                            <div class="form-group">
                                <input type="number" class="form-control" placeholder="Cód. Patrimônio">
                            </div>
                        </div>
                    </div>`

    }

    const listaProdutos = document.getElementById('listaProdutos')

    listaProdutos.innerHTML = html
}

function eventoClick() {
    //Esta função formata o valor para Real
    new Cleave('#valor', {
        numeral: true,
        numeralThousandsGroupStyle: 'thousand',
        numeralDecimalMark: ',',
        delimiter: '.',
        prefix: 'R$ ',
        noImmediatePrefix: true,
        rawValueTrimPrefix: true
    });

    // Sincronizar o campo de busca personalizado com a busca do DataTable
    $('#btnPesquisa').on('keyup', function () {
        tableEstoque.search(this.value).draw();
    });

    //Lista os materiais na tela
    listarMateriais()

    //Cria um evento para adicionar os materiais
    document.getElementById('ButtonAddTicket').addEventListener('click', function (e) {
        e.preventDefault();
        enviarItem()
        checkInputs()
    });

    document.getElementById('btnCp').addEventListener('click', function (e) {
        e.preventDefault();
        clickCp()
    })
}



// Esta função é executada após toda a página ser executada
document.addEventListener("DOMContentLoaded", async () => {
    eventoClick()
    checkInputs() //Funçao que verifica se os inputs não estão vazios

    // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
    document.querySelector('#loader2').classList.add('d-none')

})