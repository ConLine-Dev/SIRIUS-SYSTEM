const fs = require('fs');
const { executeQuery } = require('../connect/mysql');
const Stream = require('node-rtsp-stream');

const cam = {
    active: [],
    streams: [],
    start: async function(values) {
        const cams = await this.create();
        const main = this;
    
        for (let index = 0; index < cams.length; index++) {
            const element = cams[index];
    
            try {
                await main.connectCamera(element);
                console.log('teste ---------')
            } catch (error) {
                console.log('Falha ao conectar a câmera ' + element.name);
            }
        }
    
        return main.streams;
    },
    create: async function(){
        const cameras = [
            {
                name: 'Ti',
                channel: 1,
                user: 'admin',
                password: 'RWPZ2Y62',
                address: '10.0.0.22'
            },
            {
                name: 'Financeiro',
                channel: 2,
                password: 'admin',
                user: '',
                address: '10.0.0.23'
            }
        ];
    
        const camerasComPorta = cameras.map(camera => {
            const { channel } = camera;
            return {
                ...camera,
                port: 9909+channel
            };
        });

        this.active = camerasComPorta;

        return this.active

    },
    connectCamera: async function(element) {
        const main = this;
        return new Promise((resolve, reject) => {
            const stream = new Stream({
                name: element.name,
                streamUrl: `rtsp://${element.user}:${element.password}@${element.address}:554/cam/realmonitor?channel=${element.channel}&subtype=0&unicast=true&proto=Onvif`,
                wsPort: element.port,
                ffmpegOptions: {
                    '-r': '30', // Frame rate
                    '-vf': 'scale=640:360', // Resolução de saída
                },
            });
    
            stream.on('mpeg1data', () => {
                console.log(`Conectado a câmera ${element.name} na porta ${element.port}`);
                // Definir o status da câmera como conectada
                main.streams.push({
                    stream: stream,
                    port: element.port,
                    connected: true
                });
                resolve();
            });
    
            stream.on('error', (error) => {
                console.log('Falha ao conectar a câmera ' + element.name);
                // Definir o status da câmera como não conectada
                main.streams.push({
                    stream: stream,
                    port: element.port,
                    connected: false
                });
                reject(error);
            });
        });
    },
    restartAllCameras: function() {
        const main = this;
    
        main.streams.forEach(async (camera) => {
            try {
                await main.restartCamera(camera);
            } catch (error) {
                console.log('Falha ao reiniciar a câmera ' + camera.stream.name);
            }
        });
    },
    restartCamera: async function(camera) {
        return new Promise((resolve, reject) => {
            // Parar o stream da câmera
            camera.stream.stop();
    
            // Iniciar o stream novamente
            camera.stream.start();
    
            // Monitorar se o stream foi reiniciado com sucesso
            camera.stream.on('data', () => {
                console.log(`Câmera ${camera.stream.name} reiniciada`);
                resolve();
            });
    
            // Lidar com erros durante o reinício
            camera.stream.on('error', (error) => {
                console.log('Falha ao reiniciar a câmera ' + camera.stream.name);
                reject(error);
            });
        });
    },
    stopAllCameras: function() {
        const main = this;
    
        main.streams.forEach((camera) => {
            main.stopCamera(camera);
        });
    },
    stopCamera: function(camera) {
        // Parar o stream da câmera
        camera.stream.stop();
        console.log(`Stream da câmera ${camera.stream.name} parado`);
    }

}



module.exports = {
    cam,
};