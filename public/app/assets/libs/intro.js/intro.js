async function introMain() {
    await intro();
  }
  
  // Função para verificar se um elemento existe no corpo do site
  function elementExists(selector) {
    return document.querySelector(selector) !== null;
  }
  
  async function intro() {
    const data = await makeRequest('../../assets/libs/intro.js/intro.json', 'GET')
    
      // Filtra o array, mantendo apenas os elementos encontrados na página
      const filteredArray = data.filter(item => {
        if (item.element) {
            return elementExists(item.element);
        }
        return true; // Se não há propriedade 'element', mantém o item
    });
  
    //INICIA O TUTORIAL COM INTROJS
    introJs()
      .setOptions({
        steps: filteredArray,
        dontShowAgain: true, 
        showProgress: true,
        showBullets: false
      })
      .start();
  }
  
  async function deleteCookie(cookieName) {
    document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  };
  
  const btn_tutorial = document.getElementById('btn-tutorial')
  
  btn_tutorial.addEventListener('click', async function () {
    await deleteCookie('introjs-dontShowAgain')
    await introMain()
  })
  