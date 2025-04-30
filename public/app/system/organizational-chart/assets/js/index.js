var raw = []

async function createRoot() {
    const people = await makeRequest(`/api/organizational-chart/getPeople`)

    for (let index = 0; index < people.length; index++) {
        const element = people[index];
        let img = `https://cdn.conlinebr.com.br/colaboradores/${element.img}`
        if (!element.job_position) {
            element.job_position = 'Sem Cargo';
        }
        raw.push({
            id: element.id,
            parentId: element.parent,
            nome: element.name,
            cargo: element.job_position,
            foto: img,
            cor: "red"
        })
    }
}

function buildTree(list) {
    const map = new Map();   // id → nó no formato Treant
    let root = null;

    // 2.1 cria cada nó inicial
    list.forEach(p => {

        /* ---------- NÓ‑PSEUDO ---------- */
        if (p.pseudo) {                    // { pseudo:true }
            map.set(p.id, { pseudo: true, children: [] });
            return;                          // volta para o próximo item
        }

        /* ---------- NÓ NORMAL ---------- */
        map.set(p.id, {
            text: { name: p.nome, title: p.cargo },
            image: p.foto,
            children: []
        });

        if (p.cor) map.get(p.id).HTMLclass = p.cor;
    });

    // 2.2 liga pai ←→ filho
    list.forEach(p => {
        if (p.parentId === null || p.parentId === 0) {
            root = map.get(p.id);
        } else {
            map.get(p.parentId).children.push(map.get(p.id));
        }
    });

    return root;
}

async function createTree() {
    const chart_config = {
        chart: {
            container: '#custom-colored',
            CSSclass: 'orgchart-wrapper',
            nodeAlign: 'BOTTOM',
            connectors: { type: 'step' },
            node: { HTMLclass: 'nodeExample1', collapsable: true },
            collapsable: true
        },
        nodeStructure: buildTree(raw)
    };

    new Treant(chart_config);
}

function autoFitTree() {
    const wrapper = document.getElementById('tree-wrapper');
    const chart = document.getElementById('custom-colored');

    const chartRect = chart.getBoundingClientRect();
    const chartW = chartRect.width;
    const chartH = chartRect.height;

    const targetW = wrapper.clientWidth;
    const targetH = wrapper.clientHeight;

    const scaleW = targetW / chartW;
    const scaleH = targetH / chartH;
    const scale = Math.min(scaleW, scaleH, 1);

    chart.style.transform = `scale(${scale})`;
    chart.style.transformOrigin = 'top left';
}


document.addEventListener('DOMContentLoaded', async function () {

    await createRoot();
    await createTree();

    document.querySelector('#loader2').classList.add('d-none');
});