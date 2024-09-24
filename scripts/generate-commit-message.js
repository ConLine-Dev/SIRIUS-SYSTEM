const { execSync } = require('child_process');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const readline = require('readline');
require('dotenv').config(); // Carregar a chave da API do arquivo .env

// Inicializar a API da Google Generative AI com a chave de API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Função para pegar as mudanças feitas no projeto usando Git (captura o diff completo)
function getGitChanges() {
    try {
        const changes = execSync('git diff HEAD').toString().trim(); // Captura o diff completo
        if (!changes) {
            console.log('Nenhuma alteração foi encontrada.');
            process.exit(1);
        }

        return changes;  // Retorna as mudanças sem sanitização para melhor contexto
    } catch (error) {
        console.error('Erro ao pegar as mudanças do Git:', error.message);
        process.exit(1);
    }
}

// Função para validar se há mudanças staged
function validateGitChanges() {
    try {
        const stagedChanges = execSync('git diff --cached').toString().trim();
        if (!stagedChanges) {
            console.log('Erro: Não há alterações staged para o commit. Adicionando as mudanças ao stage...');
            execSync('git add .');  // Adiciona todas as mudanças ao stage
        }
    } catch (error) {
        console.error('Erro ao validar as mudanças do Git:', error.message);
        process.exit(1);
    }
}

// Função para enviar as alterações para a API do Google Generative AI e gerar a mensagem de commit
async function sendToGoogleGenerativeAI(changes) {
    const prompt = `
    NÃO FAÇA NENHUM TIPO DE MARCAÇÃO OU ROTULO APENAS NA PRIMEIRA LINHA DA RESPOSTA RETORNE O TITULO DO COMMIT E NAS LINHAS SUBSEQUENTES A DESCRIÇÃO.
    Não inclua nenhum tipo de rótulos, apenas forneça o texto final que será utilizado para o commit.
    Não inclua nenhum tipo de rótulos, apenas forneça o texto final que será utilizado para o commit.
    ATENÇÃO POIS SEUS RESTA SERÁ DIRETAMENTE ENVIADO PARA COMMIT DO GIT.
    Aqui estão as alterações feitas no projeto (com detalhes do diff):
    ${changes}
    Por favor, forneça apenas um título (na primeira linha) e uma descrição (nas linhas subsequentes) para o commit.
    Não inclua rótulos como "Título" ou "Descrição", apenas forneça o texto final que será utilizado para o commit.
    `;

    try {
        const model = await genAI.getGenerativeModel({ model: "gemini-pro" });
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                maxOutputTokens: 4096,
            },
        });

        // Enviar a mensagem para a IA e obter a resposta
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = await response.text();

        return text;
    } catch (error) {
        console.error('Erro ao enviar as mudanças para o Google Generative AI:', error.message);
        return null;
    }
}

// Função para remover rótulos como "Título" ou "Descrição", se a IA os adicionar
function cleanCommitMessage(commitMessage) {
    return commitMessage
        .replace(/.*(?:título|descrição):/gi, '')  // Remove todas as variações de "Título" e "Descrição"
        .trim();                                   // Remove espaços em branco extras
}

// Função para perguntar ao usuário se ele aprova ou quer gerar uma nova mensagem
function askUserApproval(message) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(`Mensagem gerada:\n${message}\n\nVocê quer usar esta mensagem para o commit? (s/n): `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 's');
        });
    });
}

// Função principal para gerar o commit
async function generateCommitMessage() {
    const changes = getGitChanges(); // Agora pegando o diff completo

    let commitMessage;
    let approved = false;

    // Loop para continuar gerando mensagens até o usuário aprovar
    while (!approved) {
        commitMessage = await sendToGoogleGenerativeAI(changes);

        // Verifica se a mensagem de commit foi gerada com sucesso
        if (!commitMessage) {
            console.error('Falha ao gerar a mensagem de commit.');
            process.exit(1);
        }

        // Limpa a mensagem de commit, removendo rótulos indesejados
        commitMessage = cleanCommitMessage(commitMessage);

        // Exibe a mensagem gerada e pergunta ao usuário
        approved = await askUserApproval(commitMessage);
        if (!approved) {
            console.log('Gerando uma nova mensagem...');
        }
    }

    // Se a mensagem foi aprovada, separa título e descrição e faz o commit
    console.log('Mensagem de commit aprovada:');

    try {
        // Separa a primeira linha como o título e o restante como a descrição
        const [title, ...descriptionLines] = commitMessage.split('\n').filter(line => line.trim() !== '');
        const formattedDescription = descriptionLines.join('\n').trim();

        // Garante que a descrição não tenha rótulos desnecessários e está bem formatada
        const finalCommitMessage = `${title.trim()}\n\n${formattedDescription}`;

        // Salva a mensagem no arquivo commit_message.txt
        fs.writeFileSync('commit_message.txt', finalCommitMessage);
        console.log('Mensagem salva em commit_message.txt. Fazendo o commit...');

        // Valida se há mudanças staged e adiciona se não houver
        validateGitChanges();

        // Realiza o commit automaticamente com a mensagem aprovada
        execSync('git commit -F commit_message.txt');
        console.log('Commit realizado com sucesso.');

        // Agora faz o push das mudanças para o repositório remoto
        const shouldPush = readlineSync.question('Deseja fazer o push agora? (s/n): ');
        if (shouldPush.toLowerCase() === 's') {
            execSync('git push');
            console.log('Mudanças enviadas para o repositório remoto (GitHub).');
        } else {
            console.log('Lembre-se de fazer o push mais tarde.');
        }
        
    } catch (error) {
        console.error('Erro ao salvar a mensagem de commit ou ao realizar o commit/push:', error.message);
    }
}

// Executa o script
generateCommitMessage();
