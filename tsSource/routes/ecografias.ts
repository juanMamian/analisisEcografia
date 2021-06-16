const router = require("express").Router();
const multer = require("multer");
const upload = multer();
import Jimp from "jimp"

type PuntoQuiebre={
    left: number,
    intervalo: number | null,
    variacion: number | null,
}

router.post("/analizarImagen", upload.single("ecografia"), async function (req: any, res: any) {

    if (!req.file) {
        console.log(`No había archivo`);
        return res.status(400);
    }
    const ecografia = req.file;



    console.log(`Recibido un archivo con nombre ${ecografia.originalname} y zonaAnalisis: ${req.body.posicionesZonaAnalisis}`);
    const zona = JSON.parse(req.body.posicionesZonaAnalisis);

    Jimp.read(ecografia.buffer).then(async (imagen) => {
        var linea = [];
        var lineaNegroInferior = [];
        const umbralNegroInferior = 30;

        var pisandoMarcaTiempo = false;
        var marcasTiempo = [];
        var actualMarcaTiempo = [];

        console.log(`Analizando en y desde ${zona.y1} hasta ${zona.y2}`);

        var combo = 0;
        var comboBreaker = 0;
        var puntosQuiebre: any[] = [];
        const umbralComboBreaker = 6;
        const umbralCombo = 9;
        var posiblePuntoQuiebre = 0;

        for (var x = zona.x1; x <= zona.x2; x++) {
            let area = "negroSuperior";
            let cambioNegroInferior = 0;
            var columnaMarcaTiempo = false;
            let contornoNegroInferiorDetected = false;
            let pendiente = 0;
            //Recorrido vertical de cada columna de pixeles
            for (var y = zona.y1; y <= zona.y2; y++) {
                // console.log(`${x} - ${area}`);       
                let colorPixel=imagen.getPixelColor(x, y);        
                if (colorPixel > 0x1b1b1bff) { //Deteccion de un blanco                    
                    if (area === "negroSuperior") {//Detección del contorno de la eco.
                        area = "blancoEco";
                        cambioNegroInferior = 0;
                        linea.push(y - zona.y1);

                    }
                    else if (area === "blancoEco") {
                        // console.log(`Color pixel: ${colorPixel}`);
                        cambioNegroInferior = 0;
                    }
                    else if (area === "negroInferior" && colorPixel>0xecd7d7ff && y>(zona.y2-10)) { //Detección de una marca de tiempo
                        console.log(`Marca tiempo en ${x}, ${y}: ${colorPixel}`);
                        actualMarcaTiempo.push(x);
                        pisandoMarcaTiempo = true;
                        columnaMarcaTiempo = true;
                        area = "final";
                    }
                }
                else {                                   //Deteccion de un negro
                    if (area === "blancoEco") {
                        cambioNegroInferior++;
                        if (cambioNegroInferior > umbralNegroInferior) {
                            //console.log(`${x} entrando en negro inferior`);
                            area = "negroInferior";
                            if (!contornoNegroInferiorDetected) {
                                lineaNegroInferior.push(y - zona.y1);
                                contornoNegroInferiorDetected = true;
                            }
                        }
                    }
                }
            }
            if (x > zona.x1) { //A partir del segundo pixel, análisis de pendientes.
                pendiente = linea[linea.length - 2] - linea[linea.length - 1];
                if (pendiente > 0) { //Subiendo
                    if (pendiente > 1) {
                        if (combo === 0) {//Era el primer punto del combo
                            posiblePuntoQuiebre = x - 1;
                        }
                        combo++;
                    }


                }
                else {            //Bajando o estancándose
                    comboBreaker++
                }

                if (comboBreaker > umbralComboBreaker) {
                    //Se ha terminado un combo.
                    //Verificar si es un combo suficientemente largo
                    if (combo > umbralCombo) {
                        puntosQuiebre.push({left: posiblePuntoQuiebre - zona.x1, intervalo:null, variacion: null,});
                    }
                    combo = 0;
                    comboBreaker = 0;

                }

            }
            //Calcular marca tiempo si no se tocó ninguna marca tiempo.                               

            if (!columnaMarcaTiempo) {
                if (pisandoMarcaTiempo && actualMarcaTiempo.length > 0) {
                    var sum = 0;
                    for (var i = 0; i < actualMarcaTiempo.length; i++) {
                        sum += actualMarcaTiempo[i];
                    }
                    var prom = sum / actualMarcaTiempo.length;
                    marcasTiempo.push(prom - zona.x1);
                    actualMarcaTiempo = [];
                }

                pisandoMarcaTiempo = false;
            }
        }

        //Calcular relacion pixeles-tiempo:
        var distanciasPx: number[] = [];
        for (var j = 0; j < (marcasTiempo.length - 1); j++) {
            distanciasPx.push(marcasTiempo[j + 1] - marcasTiempo[j]);
        }


        console.log(`Distancias entre marcas de tiempo: ${marcasTiempo}`);

        console.log(`Distancias entre marcas de tiempo (Px): ${distanciasPx}`);

        const segundoPx = (distanciasPx.reduce((a, b) => a + b, 0) / distanciasPx.length)*2;

        //Calcular longitudes de onda.        
        for (var k = 1; k < puntosQuiebre.length; k++) {
            puntosQuiebre[k].intervalo=((puntosQuiebre[k].left - puntosQuiebre[k-1].left)/segundoPx)*1000;
        }

        //Calcular variabilidades.
        
        for (var m = 2; m < (puntosQuiebre.length); m++) {
            if(puntosQuiebre[m].intervalo && puntosQuiebre[m-1].intervalo){
                puntosQuiebre[m].variacion=puntosQuiebre[m].intervalo-puntosQuiebre[m-1].intervalo;
            }
            
        }


        return res.send({ linea: JSON.stringify(linea), marcasTiempo, lineaNegroInferior: JSON.stringify(lineaNegroInferior), puntosQuiebre, });


    }).catch((error) => {
        console.log(`Error leyendo la ecografía: ${error}`);
        return res.status(400).send("Error letendo archivo");
    })

});

router.get("/", (_: any, res: any) => {
    return res.send("test");
})
router.get("/test", (_: any, res: any) => {
    return res.send("test");
})

module.exports = router