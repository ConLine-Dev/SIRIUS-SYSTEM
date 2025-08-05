async function getInfosLogin() {
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = JSON.parse(StorageGoogleData);

  return StorageGoogle;
};

function getLinkParams() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  return id;
}

async function printOcurrenceDetails() {
  const refundId = getLinkParams();
  const getDetails = await makeRequest(`/api/refunds/getDetails`, 'POST', { refundId });

  let totalValue = 0;
  let collabName = `${getDetails[0].name} ${getDetails[0].family_name}`
  const getFromTitle = await makeRequest(`/api/refunds/getFromTitle`, 'POST', { refundId });
  const divRelatedRefunds = document.getElementById('relatedRefunds');
  let printRelatedRefunds = `<table class="table text-nowrap table-bordered w-100" id="occurrenceTable">
                                <thead>
                                    <tr>
                                        <th scope="col" class="col-1">Id</th>
                                        <th scope="col" class="col-1">Categoria</th>
                                        <th scope="col" class="col-1">Subcategoria</th>
                                        <th scope="col" class="col-7">Descrição</th>
                                        <th scope="col" class="col-1">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>`;

  for (let index = 0; index < getFromTitle.length; index++) {
    totalValue += getFromTitle[index].value;
    let value = getFromTitle[index].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    let subcategory = getFromTitle[index].subcategory;
    if (getFromTitle[index].subcategory == null) {
      subcategory = ' '
    }
    printRelatedRefunds += `<tr>
                              <td>${getFromTitle[index].id}</td>
                              <td>${getFromTitle[index].category}</td>
                              <td>${subcategory}</td>
                              <td>${getFromTitle[index].description}</td>
                              <td>${value}</td>
                            </tr>`
  }
  printRelatedRefunds += `</tbody></table>`;
  divRelatedRefunds.innerHTML = printRelatedRefunds;

  const attachments = await makeRequest(`/api/refunds/getAttachments`, 'POST', { refundId });
  const divAttachments = document.getElementById('attachments');
  let printAttachments = '';

  for (let index = 0; index < attachments.length; index++) {
    let fileName = attachments[index].file;
    let fileUrl = `/uploads/refunds-attachments/${fileName}`;
    printAttachments += `
            <div class="mt-sm-0 mt-2 col-3" style="margin: 10px">
                <span class="bg-primary-transparent fw-semibold mx-1">Anexo ${index + 1}</span>
                <a href="${fileUrl}" class="btn btn-icon btn-sm btn-success" title="Baixar" download><i class="ri-download-2-line"></i></a>
                <a href="${fileUrl}" class="btn btn-icon btn-sm btn-info" title="Visualizar" target="_blank"><i class="ri-eye-line"></i></a>
            </div>`
  }
  divAttachments.innerHTML = printAttachments;

  document.getElementById('refundResponsible').value = collabName;
  document.getElementById('refundStatus').value = getDetails[0].statusTitle;
  document.getElementById('refundPix').value = getDetails[0].pix;
  document.getElementById('totalValue').value = totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

}

document.addEventListener('DOMContentLoaded', async function () {

  // const socket = io();

  // socket.on('updateCalendarEvents', (data) => {
  //   calendar.refetchEvents();
  // })

  await printOcurrenceDetails()

  document.querySelector('#loader2').classList.add('d-none')
});