var win = navigator.platform.indexOf('Win') > -1;
var sidenavScrollbar = document.querySelector('#sidenav-scrollbar');
if (win && sidenavScrollbar) {
    var options = { damping: '0.5' };
    Scrollbar.init(sidenavScrollbar, options);
}

var table = document.querySelectorAll('tbody')[0];

async function criarTabela() {
    try {
        // Fetch all data first
        const response = await fetch('/api/clientes');
        const dados = await response.json();

        // Use a DocumentFragment to reduce reflows
        const fragment = document.createDocumentFragment();

        dados.forEach(element => {
            // Create row element
            const tr = document.createElement('tr');

            // Create and append cells
            tr.innerHTML = `
                <td>
                    <div class="d-flex px-2 py-1">
                        <div>
                            <img src="http://cdn.conlinebr.com.br/colaboradores/${element.idSirius}" class="avatar avatar-sm me-3" alt="user1">
                        </div>
                        <div class="d-flex flex-column justify-content-center">
                            <h6 class="mb-0 text-sm">${element.Nome}</h6>
                            <p class="text-xs text-secondary mb-0">Vendedor: ${element.Vendedor}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <p class="text-xs font-weight-bold mb-0">${element.Cpf_Cnpj}</p>
                </td>
                <td class="align-middle text-center">
                    <span class="text-secondary text-xs font-weight-bold">${element.Link}</span>
                </td>
                <td class="align-middle">
                    <a href="javascript:;" class="text-secondary font-weight-bold text-xs" data-toggle="tooltip" data-original-title="Edit user" onclick="copiar('${element.Link}')">
                        Copiar
                    </a>
                </td>
            `;
            fragment.appendChild(tr);
        });

        // Append all rows at once
        table.appendChild(fragment);
    } catch (error) {
        console.error('Erro ao criar a tabela:', error);
    }
}

function copiar(link) {
    navigator.clipboard.writeText(link).then(() => {
        Swal.fire({
            title: 'Link Copiado!',
            icon: 'success',
            showConfirmButton: false,
            timer: 1100
        });
    }).catch(err => {
        console.error('Erro ao copiar o link:', err);
    });
}

$(document).ready(async function () {
    await criarTabela();
    $('#tableClientes').DataTable({
        info: false,
        paging: false
    });
});
