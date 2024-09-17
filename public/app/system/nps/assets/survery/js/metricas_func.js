var win = navigator.platform.indexOf('Win') > -1;
if (win && document.querySelector('#sidenav-scrollbar')) {
    var options = {
        damping: '0.5'
    }
    Scrollbar.init(document.querySelector('#sidenav-scrollbar'), options);
}

var table = document.querySelectorAll('tbody')[0];

async function addRespostas() {

    const listaRespostas = await fetch('/api/metricas');
    const dados = await listaRespostas.json();

    console.log(dados);

    let linha = '';
    dados.forEach(element => {
        var newDate = new Date(element.date);
        var dateDay = newDate.getDate();
        var dateMonth = newDate.getMonth() + 1;
        var dateYear = newDate.getFullYear();
        var feedback = '';

        if(element.tipoFeedback == 0){
          feedback = 'Crítica';
        }else if(element.tipoFeedback == 1){
          feedback = 'Elogio';
        }else{
          feedback = '-'
        }

        if(dateDay<10){
          dateDay = String(dateDay).padStart(2, '0');
        }
        if(dateMonth<10){
          dateMonth = String(dateMonth).padStart(2, '0');
        }

        if(!element.moeda){element.moeda = '-'}
        if(!element.valor){element.valor = '-'}
        if(!element.armador){element.armador = '-'}
        if(!element.setor){element.setor = '-'}

        const printDate = `${dateDay}/${dateMonth}/${dateYear}`;

        linha += `<tr>
                    <td>
                      <div class="d-flex px-2 py-1">
                        <div>
                          <img src="http://cdn.conlinebr.com.br/colaboradores/${element.idOperacional}" class="avatar avatar-sm me-3" alt="user1">
                        </div>
                        <div class="d-flex flex-column justify-content-center">
                          <h6 class="mb-0 text-sm">${element.name}</h6>
                          <p class="text-xs text-secondary mb-0">${element.cliente}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p class="text-xs text-secondary mb-0">${element.nomeMetrica}</p>
                    </td>
                    <td>
                      <p class="text-xs font-weight-bold mb-0">${element.setor}</p>
                    </td>
                    <td>
                      <p class="text-xs font-weight-bold mb-0">${element.armador}</p>
                    </td>
                    <td>
                      <p class="text-xs text-secondary mb-0">${element.moeda}</p>
                      <p class="text-xs font-weight-bold mb-0">${element.valor}</p>
                    </td>
                    <td>
                      <p class="text-xs text-secondary mb-0">${feedback}</p>
                      <a href="javascript:;" class="text-secondary font-weight-bold text-xs" data-toggle="tooltip" data-original-title="Visualizar" onclick="openSwal('${element.campoLivre}')">
                        Visualizar
                      </a>
                    </td>
                    <td class="align-middle text-center">
                      <span class="text-secondary text-xs font-weight-bold">${printDate}</span>
                    </td>
                  </tr>`
    });
    table.innerHTML = linha;
}

$(document).ready(async function () {
  await addRespostas();
  $('#tableMetricas').DataTable(
      {
          info: false,
          paging: false
      });

});

function openSwal(campoLivre){

    Swal.fire({
      title: campoLivre,
      showClass: {
        popup: `
          animate__animated
          animate__fadeInUp
          animate__faster
        `
      },
      hideClass: {
        popup: `
          animate__animated
          animate__fadeOutDown
          animate__faster
        `
      }
    });
}

addRespostas();