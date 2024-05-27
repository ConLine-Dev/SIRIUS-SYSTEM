document.addEventListener("DOMContentLoaded", async () => {
  
    await criarCameras();


    await eventosCliques()

    document.querySelector('#loader2').classList.add('d-none')
})


async function eventosCliques(){

    const botoesStart = document.querySelectorAll('.start-stream');
    for (let index = 0; index < botoesStart.length; index++) {
        const element = botoesStart[index];

        element.addEventListener('click', async function(e){
            e.preventDefault()
            const channel = this.getAttribute('channel')
            const port = this.getAttribute('port')
            const values = {
                channel:channel,
                port:port
            }
            await IniciarCamera(values)
           
        })
        
    }
}

async function IniciarCamera(values){
    // const dados = await makeRequest(`/api/launches_adm/getAllLaunches/`);
    const wsUrl = 'ws://127.0.0.1:'+port;
    player = new JSMpeg.Player(wsUrl, { canvas: canvas });
}


async function criarCameras(){
    const cameras = [
        {
            nome: 'Ti',
            channel: 1
        },
        {
            nome: 'Financeiro',
            channel: 2
        }
    ];

    const camerasComPorta = cameras.map(camera => {
        const { channel } = camera;
        return {
            ...camera,
            port: 9910+channel
        };
    });

    let listCam = ''
    for (let index = 0; index < camerasComPorta.length; index++) {
        const element = camerasComPorta[index];
        // console.log(element)
        listCam += `<div class="col-xxl-3 col-xl-6 col-lg-6 col-md-6 col-sm-12">
        <div class="card custom-card product-card">
          <div class="card-body">
            <a href="product-details.html" class="product-image">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQk-o2Nfj4GQEgpbehl48V4zLu6iU1Fslt2eWN7u8VAd2SRv6ITk7_UvtkcfRY5jat-Z4&usqp=CAU" class="card-img mb-3" alt="...">
            </a>
            <div class="product-icons">
              <a href="wishlist.html" channel="${element.channel}" port="${element.port}" class="wishlist start-stream">
                <i class="ri-heart-line"></i>
              </a>
              <a href="cart.html" class="cart">
                <i class="ri-shopping-cart-line"></i>
              </a>
              <a href="product-details.html" class="view">
                <i class="ri-eye-line"></i>
              </a>
            </div>
            <p class="product-name fw-semibold mb-0 d-flex align-items-center justify-content-between">Camera TI
             
            </p>

          </div>
        </div>
      </div>`


    }

    document.querySelector('.listCam').innerHTML = listCam
    
}



// async function criarCameras() {
//     // Fazer a requisição à API
//     // const dados = await makeRequest(`/api/launches_adm/getAllLaunches/`);

 
// }
