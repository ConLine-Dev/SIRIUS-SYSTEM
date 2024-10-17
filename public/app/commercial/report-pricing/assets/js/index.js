// Função que gera a tabela de faturas a partir dos dados recebidos de uma API.
let startDateGlobal, endDateGlobal;

async function totalOffers() {
    const divTotalApprovedOffers = document.querySelector('.totalApprovedOffers')
    const divTotalPendentOffers = document.querySelector('.totalPendentOffers')
    const divTotalDisapproveOffers = document.querySelector('.totalDisapproveOffers')
    const divTotalOffers = document.querySelector('.totalOffers')
}



document.addEventListener("DOMContentLoaded", async () => {

    const countOffers = await makeRequest('/api/report-pricing/countOffers', 'POST');

    await totalOffers(countOffers);

   

    document.querySelector('#loader2').classList.add('d-none')
})