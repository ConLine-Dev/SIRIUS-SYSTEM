const apiUrl = '/api/user-management';

/**
 * Função assíncrona para obter informações da ocorrência.
 */
async function getOccurenceInfo() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id');

    // const occurrence = await makeRequest(`/api/non-compliance/getOcurrenceById`, 'POST', { id });

}







document.addEventListener('DOMContentLoaded', async function() {

    await getOccurenceInfo()

    // Salvar novo usuário
    document.getElementById('userForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = new FormData(this);
        const userData = Object.fromEntries(formData.entries());
        await makeRequest(apiUrl, 'POST', userData);

        window.close()
    });

    document.querySelector('#loader2').classList.add('d-none')
});
