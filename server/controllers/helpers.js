
const helpers = {
    getDateNow: async function(){
        // Criar uma nova instância do objeto Date
        const dataAtual = new Date();

        // Obter componentes individuais da data
        const ano = dataAtual.getFullYear();
        const mes = String(dataAtual.getMonth() + 1).padStart(2, '0'); // Os meses são baseados em zero
        const dia = String(dataAtual.getDate()).padStart(2, '0');
        const horas = String(dataAtual.getHours()).padStart(2, '0');
        const minutos = String(dataAtual.getMinutes()).padStart(2, '0');
        const segundos = String(dataAtual.getSeconds()).padStart(2, '0');

        // Criar a string formatada no estilo "YYYY-MM-DD HH:mm:ss"
        return `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
    }
}



module.exports = {
    helpers,
};