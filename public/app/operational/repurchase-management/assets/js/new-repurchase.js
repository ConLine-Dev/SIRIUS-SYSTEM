











async function getfees(reference){    
    const response = await makeRequest('/api/headcargo/repurchase-management/GetFeesByProcess', 'POST', {reference});
    
    
    return response;
}





document.addEventListener('DOMContentLoaded', async function() {
  
    
    document.querySelector('[name=referenceProcess]').addEventListener('input', async function() {
        if(this.value.length > 6) {
            console.log(this.value)
            const teste = await getfees(this.value)
            console.log(teste)
        }
    });
  
  });
  

