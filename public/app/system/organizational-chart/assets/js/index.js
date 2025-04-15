async function printTree() {

    const people = await makeRequest(`/api/organizational-chart/getPeople`)

    // Criando um mapa de nós para facilitar a construção da árvore
    const nodes = {};
    
    // Criando os nós baseados nos dados do array
    people.forEach(person => {
        nodes[person.id] = {
            id: person.id,
            data: {
                imageURL: `https://cdn.conlinebr.com.br/colaboradores/${person.img}`,
                name: person.name,
            },
            options: {
                nodeBGColor: '#f8ad9d',
                nodeBGColorHover: '#f8ad9d',
            },
            children: []
        };
    });

    // Associando os filhos aos pais
    let root = {
        id: 45,
        data: {
            imageURL: 'https://cdn.conlinebr.com.br/colaboradores/48901',
            name: 'Marcone Vidal',
        },
        options: {
            nodeBGColor: '#f9423a',
            nodeBGColorHover: '#f9423a',
        },
        children: []
    };

    people.forEach(person => {
        if (person.parent === 45) {
            root.children.push(nodes[person.id]);
        } else {
            nodes[person.parent].children.push(nodes[person.id]);
        }
    });

    // Opções da árvore
    const options = {
        contentKey: 'data',
        width: window.innerWidth, 
        height: window.innerHeight, 
        nodeWidth: 150,
        nodeHeight: 120,
        fontColor: 'var(--custom-white);',
        borderColor: '#f9423a',
        childrenSpacing: 50,
        siblingSpacing: 10,
        direction: 'top',
        enableExpandCollapse: true,
        nodeTemplate: (content) =>
            `<div style='display: flex;flex-direction: column;gap: 10px;justify-content: center;align-items: center;height: 100%;'>
          <img style='width: 50px;height: 50px;border-radius: 50%;' src='${content.imageURL}' alt='' />
          <div class="row">
            <div class="col-12 d-flex justify-content-center">
                <label style="font-size: 12px; font-weight: bold;">${content.name}</label>
            </div>
            <div class="col-12 d-flex justify-content-center">
                <label style="font-size: 8px; font-weight: light;">${content.job_position}</label>
            </div>
          </div>
         </div>`,
        canvasStyle: 'border: 1px solid black; background: var(--custom-white);',
        enableToolbar: true,
    };

    // Renderizando a árvore
    const treeContainer = document.getElementById('svg-tree');
    treeContainer.innerHTML = ''; 
    const tree = new ApexTree(treeContainer, options);
    tree.render(root);
}

document.addEventListener('DOMContentLoaded', async function () {

    // const socket = io();

    // socket.on('updateCalendarEvents', (data) => {
    //   calendar.refetchEvents();
    // })

    await printTree();

});