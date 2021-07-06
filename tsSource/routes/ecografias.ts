const router = require("express").Router();
const multer = require("multer");
const upload = multer();
import Jimp from "jimp"

type PuntoQuiebre = {
    left: number,
    intervalo: number | null,
    intervaloAjustado: number | null,
    variacion: number | null,
    variacionAjustada: number | null,
    bpm: number | null,
    bpmAjustado: number | null,
}

router.post("/analizarImagen", upload.single("ecografia"), async function (req: any, res: any) {
    console.log(`************`);
    if (!req.file) {
        console.log(`No había archivo`);
        return res.status(400);
    }
    const ecografia = req.file;

    const zona = JSON.parse(req.body.posicionesZonaAnalisis);
    const umbralEco=parseInt(req.body.umbralEco.substr(1)+'ff', 16);
    console.log(`Analisis en ${JSON.stringify(zona)}`);
    console.log(`Umbral: ${umbralEco}`);    
    Jimp.read(ecografia.buffer).then(async (imagen) => {
        var linea = [];

        
        var pisandoMarcaTiempo = false;
        var marcasTiempo = [];
        var actualMarcaTiempo = [];

        //Analizando marcas de tiempo:
        for (var x = zona.x1; x <= zona.x2; x++) {
            let blancoDetected=false;
            for(var m=zona.y2-12; m<zona.y2;m++){
                if(imagen.getPixelColor(x, m)> 0xf3e3e3ff){
                    blancoDetected=true;
                }
            }
            if (blancoDetected) { //Deteccion de un blanco                    
                if (pisandoMarcaTiempo === false) {//Inicio de marca tiempo
                    actualMarcaTiempo = [];
                }
                actualMarcaTiempo.push(x)
                pisandoMarcaTiempo = true;
            }
            else {//deteccion de hueco                
                if (pisandoMarcaTiempo) {//Venía pisando una marca tiempo. Se acabó. Ha quedado detectada
                    if (actualMarcaTiempo.length == 0) {
                        console.log(`Error. se detectó un hueco sin haber detectado marcas de tiempo`);
                    }
                    let sum = 0;
                    console.log(`Marcas tiempo en: ${actualMarcaTiempo}`);
                    for (var i = 0; i < actualMarcaTiempo.length; i++) {
                        sum += actualMarcaTiempo[i];
                    }
                    let prom = sum / actualMarcaTiempo.length;
                    marcasTiempo.push(prom - zona.x1);
                    console.log(`Marca promedio en ${prom}`);
                }
                pisandoMarcaTiempo = false;
            }
        }

        //Calcular relacion pixeles-tiempo:
        var distanciasPx: number[] = [];
        for (var j = 0; j < (marcasTiempo.length - 1); j++) {
            let estaDistancia=marcasTiempo[j + 1] - marcasTiempo[j];
            distanciasPx.push(estaDistancia);
            if(distanciasPx.length>0 && Math.abs(distanciasPx[distanciasPx.length-1]-estaDistancia)>5){
                return res.status(400).send("Error analizando marcas de tiempo");
            }
        }

        if(distanciasPx.length<1){
            return res.status(400).send("Error analizando marcas de tiempo");
        }

        console.log(`Distancias entre marcas de tiempo (Px): ${distanciasPx}`);

        const segundoPx = (distanciasPx.reduce((a, b) => a + b, 0) / distanciasPx.length) * 2;
        console.log(`Segundo en pixeles: ${segundoPx}`);

        var combo = 0;
        var comboBreaker = 0;
        var puntosQuiebre: any[] = [];
        const umbralComboBreaker = 3;
        const umbralCombo = Math.round(segundoPx/35);
        var posiblePuntoQuiebre = 0;
        var recordAltura=0;

        //Encontrar pixeles de contorno
        for (var x = zona.x1; x <= zona.x2; x++) {
            //Recorrido vertical de cada columna de pixeles
            for (var y = zona.y1; y <= zona.y2; y++) {
                let colorPixel = imagen.getPixelColor(x, y);
                if (colorPixel > umbralEco) { //Deteccion de un blanco                                                          
                    linea.push(y - zona.y1);
                    break;
                }
            }
        }

        for (var k = 1; k < linea.length; k++) {
            let pendiente = linea[k-1] - linea[k];
            if (pendiente > 0) { //Subiendo                
                if (combo === 0) {//Era el primer punto del combo
                    posiblePuntoQuiebre = k - 1;
                    recordAltura=linea[posiblePuntoQuiebre];                    
                    comboBreaker=0;
                    // console.log(`Record altura: ${recordAltura}`);
                }
                combo++;
                comboBreaker-=0.5;
                if(comboBreaker<0)comboBreaker=0;                            
            }

            if(combo>0){
                if(linea[k]>=(recordAltura)){ //Si la linea esta por debajo del record de altura tenemos combo breaker
                    comboBreaker++;
                }
                else{
                    comboBreaker=0;
                    recordAltura=linea[k]
                }

                // console.log(`${k}: ${pendiente}. ${combo>0?'Combo: ' + combo:''}. Breaker: ${comboBreaker}`);

                if (comboBreaker >= umbralComboBreaker || comboBreaker>combo || linea[k]>=((recordAltura+linea[posiblePuntoQuiebre])/2)  ) {
                    // console.log(`Break`);
                    //Se ha terminado un combo.
                    //Verificar si es un combo suficientemente largo
                    if (combo > umbralCombo) {
                        puntosQuiebre.push({ left: posiblePuntoQuiebre, intervalo: null, variacion: null, });
                    }
                    combo = 0;
                    comboBreaker = 0;
                }    
            }                        
            


        }

        //Calcular longitudes de onda.        
        for (var k = 1; k < puntosQuiebre.length; k++) {
            puntosQuiebre[k].intervalo = ((puntosQuiebre[k].left - puntosQuiebre[k - 1].left) / segundoPx) * 1000;
            puntosQuiebre[k].bpm=60000/(puntosQuiebre[k].intervalo);
        }

        //calcular ajuste suma
        var promedioBpm= puntosQuiebre.filter(p=>p.bpm).map(p=>p.bpm).reduce((a, b)=> {return a+b}, 0)/(puntosQuiebre.length-1);
        

        var ajusteBpm=150-promedioBpm;

        for (var k = 1; k < puntosQuiebre.length; k++) {
            puntosQuiebre[k].bpmAjustado=puntosQuiebre[k].bpm+ajusteBpm;
            puntosQuiebre[k].intervaloAjustado=60000/puntosQuiebre[k].bpmAjustado;
        }

        //Calcular variabilidades.

        for (var m = 2; m < (puntosQuiebre.length); m++) {
            if (puntosQuiebre[m].intervalo && puntosQuiebre[m - 1].intervalo) {
                puntosQuiebre[m].variacion = puntosQuiebre[m].intervalo - puntosQuiebre[m - 1].intervalo;
                puntosQuiebre[m].variacionAjustada = puntosQuiebre[m].intervaloAjustado - puntosQuiebre[m - 1].intervaloAjustado;
            }
        }
        // console.log(`Puntos quiebre; ${JSON.stringify(puntosQuiebre)}`);

        return res.send({ linea, marcasTiempo, puntosQuiebre, margenError: 500/segundoPx });


    }).catch((error) => {
        console.log(`Error leyendo la ecografía: ${error}`);
        return res.status(400).send("Error leyendo archivo");
    })

});

router.get("/", (_: any, res: any) => {
    return res.send("test");
})
router.get("/test", (_: any, res: any) => {
    return res.send("test");
})

module.exports = router