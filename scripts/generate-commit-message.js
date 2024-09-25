const { execSync } = require('child_process');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const readline = require('readline');
require('dotenv').config(); // Carregar a chave da API do arquivo .env

// Inicializar a API da Google Generative AI com a chave de API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Função para listar os arquivos modificados
function listModifiedFiles() {
    try {
        const changes = execSync('git status -s').toString().trim();
        if (!changes) {
            console.log('Nenhuma alteração foi encontrada.');
            process.exit(1);
        }
        return changes.split('\n').map(line => line.trim().split(' ').pop());
    } catch (error) {
        console.error('Erro ao listar os arquivos modificados:', error.message);
        process.exit(1);
    }
}

// Função para perguntar ao usuário quais arquivos devem ser adicionados ao stage
function askUserForFiles(files) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(`Arquivos modificados:\n${files.join('\n')}\n\nEscolha os arquivos para adicionar ao commit (separe por vírgula ou digite "todos" para incluir todos): `, (answer) => {
            rl.close();
            if (answer.toLowerCase() === 'todos') {
                resolve(files);
            } else {
                const selectedFiles = answer.split(',').map(file => file.trim()).filter(file => files.includes(file));
                resolve(selectedFiles);
            }
        });
    });
}

// Função para validar se há mudanças staged
function validateGitChanges(selectedFiles) {
    try {
        if (selectedFiles.length === 0) {
            console.log('Nenhum arquivo foi selecionado para o commit.');
            process.exit(1);
        }

        // Adiciona os arquivos selecionados ao stage
        execSync(`git add ${selectedFiles.join(' ')}`);

        const stagedChanges = execSync('git diff --cached').toString().trim();
        if (!stagedChanges) {
            console.log('Erro: Não há alterações staged para o commit.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Erro ao validar as mudanças do Git:', error.message);
        process.exit(1);
    }
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

// Função para perguntar se o usuário quer fazer o push
function askUserForPush() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Você deseja realizar o push após o commit? (s/n): ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 's');
        });
    });
}

// Função para enviar as alterações para a API do Google Generative AI e gerar a mensagem de commit
async function sendToGoogleGenerativeAI(changes) {
    const prompt = `
    NÃO FAÇA NENHUM TIPO DE MARCAÇÃO OU ROTULO APENAS NA PRIMEIRA LINHA DA RESPOSTA RETORNE O TITULO DO COMMIT E NAS LINHAS SUBSEQUENTES A DESCRIÇÃO.
    Não inclua nenhum tipo de rótulos, apenas forneça o texto final que será utilizado para o commit.
    Não inclua nenhum tipo de rótulos, apenas forneça o texto final que será utilizado para o commit.
    NÃO UTILIZE MARKDOWN OU QUALQUER TIPO DE FORMATAÇÃO, APENAS TEXTO SIMPLES.
    ATENÇÃO POIS SEUS RESTA SERÁ DIRETAMENTE ENVIADO PARA COMMIT DO GIT.
    VOCÊ DEVE ATUAL COMO UM DEV SENIOR EM JAVASCRIPT E GIT.
    Aqui estão as alterações feitas no projeto (com detalhes do diff):
    ${changes}
    Por favor, forneça apenas um título (na primeira linha) e uma descrição (nas linhas subsequentes) para o commit.
    Não inclua rótulos como "Título" ou "Descrição", apenas forneça o texto final que será utilizado para o commit.`;

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

// Função principal para gerar o commit
async function generateCommitMessage() {
    // Listar arquivos modificados e perguntar ao usuário quais incluir
    const modifiedFiles = listModifiedFiles();
    const selectedFiles = await askUserForFiles(modifiedFiles);

    // Validar se há mudanças no stage (apenas os arquivos selecionados)
    validateGitChanges(selectedFiles);

    const changes = execSync(`git diff --cached`).toString().trim();

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

        // Limpa a mensagem de commit
        commitMessage = commitMessage.trim();

        // Exibe a mensagem gerada e pergunta ao usuário
        approved = await askUserApproval(commitMessage);
        if (!approved) {
            console.log('Gerando uma nova mensagem...');
        }
    }

    // Se a mensagem foi aprovada, separa título e descrição e faz o commit
    console.log('Mensagem de commit aprovada:');

    try {
        const [title, ...descriptionLines] = commitMessage.split('\n').filter(line => line.trim() !== '');
        const formattedDescription = descriptionLines.join('\n').trim();
        const finalCommitMessage = `${title.trim()}\n\n${formattedDescription}`;

        // Salva a mensagem no arquivo commit_message.txt
        fs.writeFileSync('commit_message.txt', finalCommitMessage);
        console.log('Mensagem salva em commit_message.txt. Fazendo o commit...');

        // Realiza o commit automaticamente com a mensagem aprovada
        execSync('git commit -F commit_message.txt');
        console.log('Commit realizado com sucesso.');

        // Pergunta se o usuário deseja realizar o push
        const shouldPush = await askUserForPush();
        if (shouldPush) {
            try {
                // Tenta realizar o push
                execSync('git push');
                console.log('Mudanças enviadas para o repositório remoto.');
            } catch (pushError) {
                console.log('Push falhou. Tentando fazer git pull para mesclar as mudanças remotas...');
                try {
                    // Faz o pull para atualizar o repositório local
                    execSync('git pull --rebase');
                    console.log('Pull realizado com sucesso. Tentando fazer o push novamente...');
                    // Tenta o push novamente após o pull
                    execSync('git push');
                    console.log('Mudanças enviadas para o repositório remoto.');
                } catch (pullError) {
                    console.error('Erro ao realizar o pull/rebase ou ao tentar fazer o push novamente:', pullError.message);
                }
            }
        } else {
            console.log('Push foi cancelado pelo usuário.');
        }
    } catch (error) {
        console.error('Erro ao salvar a mensagem de commit ou ao realizar o commit/push:', error.message);
    }
}

// Executa o script
generateCommitMessage();
