var win = navigator.platform.indexOf('Win') > -1;
if (win && document.querySelector('#sidenav-scrollbar')) {
    var options = {
        damping: '0.5'
    }
    Scrollbar.init(document.querySelector('#sidenav-scrollbar'), options);
}

var table = document.querySelectorAll('tbody')[0];

async function addRespostas() {

    const listaRespostas = await fetch('/api/respostas');
    const dados = await listaRespostas.json();

    let linha = '';
    dados.forEach(element => {
        var newDate = new Date(element.date);
        var dateDay = newDate.getDate();
        var dateMonth = newDate.getMonth() + 1;
        var dateYear = newDate.getFullYear();

        const printDate = `${dateDay}/${dateMonth}/${dateYear}`;

        if (element.satisfaction == 1) {
            var smile = 'satisfeito';
        } else {
            var smile = 'insatisfeito';
        }

        linha += `<tr>
                    <td>
                      <div class="d-flex px-2 py-1">
                        <div>
                          <img src="http://cdn.conlinebr.com.br/colaboradores/${element.idsirius}" class="avatar avatar-sm me-3" alt="user1">
                        </div>
                        <div class="d-flex flex-column justify-content-center">
                          <h6 class="mb-0 text-sm">${element.nomeempresa}</h6>
                          <p class="text-xs text-secondary mb-0">Vendedor: ${element.nomevendedor}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p class="text-xs font-weight-bold mb-0">${element.p1}</p>
                      <p class="text-xs text-secondary mb-0">Comercial</p>
                    </td>
                    <td>
                      <p class="text-xs font-weight-bold mb-0">${element.p2}</p>
                      <p class="text-xs text-secondary mb-0">Operacional</p>
                    </td>
                    <td>
                      <p class="text-xs font-weight-bold mb-0">${element.p3}</p>
                      <p class="text-xs text-secondary mb-0">Financeiro</p>
                    </td>
                    <td>
                      <p class="text-xs font-weight-bold mb-0">${smile}</p>
                    </td>
                    <td>
                      <a href="javascript:;" class="text-secondary font-weight-bold text-xs" data-toggle="tooltip" data-original-title="Visualizar" onclick="openSwal('${element.feedback}')">
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

function openSwal(feedback){

  if(feedback == ""){
    Swal.fire({
      icon: "error",
      title: "Opa!",
      text: "Neste caso o cliente não nos deu feedback",
    });
  } else{
    Swal.fire({
      title: feedback,
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
}

addRespostas();