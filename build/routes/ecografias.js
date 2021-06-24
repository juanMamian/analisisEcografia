"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var router = require("express").Router();
var multer = require("multer");
var upload = multer();
var jimp_1 = __importDefault(require("jimp"));
router.post("/analizarImagen", upload.single("ecografia"), function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var ecografia, zona;
        var _this = this;
        return __generator(this, function (_a) {
            console.log("************");
            if (!req.file) {
                console.log("No hab\u00EDa archivo");
                return [2 /*return*/, res.status(400)];
            }
            ecografia = req.file;
            zona = JSON.parse(req.body.posicionesZonaAnalisis);
            jimp_1.default.read(ecografia.buffer).then(function (imagen) { return __awaiter(_this, void 0, void 0, function () {
                var linea, pisandoMarcaTiempo, marcasTiempo, actualMarcaTiempo, x, sum, i, prom, distanciasPx, j, segundoPx, combo, comboBreaker, puntosQuiebre, umbralComboBreaker, umbralCombo, posiblePuntoQuiebre, recordAltura, x, y, colorPixel, k, pendiente, k, promedioBpm, ajusteBpm, k, m;
                return __generator(this, function (_a) {
                    linea = [];
                    pisandoMarcaTiempo = false;
                    marcasTiempo = [];
                    actualMarcaTiempo = [];
                    //Analizando marcas de tiempo:
                    for (x = zona.x1; x <= zona.x2; x++) {
                        if (imagen.getPixelColor(x, zona.y2 - 1) > 0x1b1b1bff || imagen.getPixelColor(x, zona.y2 - 2) > 0x1b1b1bff || imagen.getPixelColor(x, zona.y2 - 3) > 0x1b1b1bff || imagen.getPixelColor(x, zona.y2 - 4) > 0x1b1b1bff) { //Deteccion de un blanco                    
                            if (pisandoMarcaTiempo === false) { //Inicio de marca tiempo
                                actualMarcaTiempo = [];
                            }
                            actualMarcaTiempo.push(x);
                            pisandoMarcaTiempo = true;
                        }
                        else { //deteccion de hueco                
                            if (pisandoMarcaTiempo) { //Venía pisando una marca tiempo. Se acabó. Ha quedado detectada
                                if (actualMarcaTiempo.length == 0) {
                                    console.log("Error. se detect\u00F3 un hueco sin haber detectado marcas de tiempo");
                                }
                                sum = 0;
                                for (i = 0; i < actualMarcaTiempo.length; i++) {
                                    sum += actualMarcaTiempo[i];
                                }
                                prom = sum / actualMarcaTiempo.length;
                                marcasTiempo.push(prom - zona.x1);
                            }
                            pisandoMarcaTiempo = false;
                        }
                    }
                    distanciasPx = [];
                    for (j = 0; j < (marcasTiempo.length - 1); j++) {
                        distanciasPx.push(marcasTiempo[j + 1] - marcasTiempo[j]);
                    }
                    console.log("Distancias entre marcas de tiempo (Px): " + distanciasPx);
                    segundoPx = (distanciasPx.reduce(function (a, b) { return a + b; }, 0) / distanciasPx.length) * 2;
                    console.log("Segundo en pixeles: " + segundoPx);
                    combo = 0;
                    comboBreaker = 0;
                    puntosQuiebre = [];
                    umbralComboBreaker = 3;
                    umbralCombo = Math.round(segundoPx / 35);
                    console.log("Umbral combo: " + umbralCombo);
                    posiblePuntoQuiebre = 0;
                    recordAltura = 0;
                    for (x = zona.x1; x <= zona.x2; x++) {
                        //Recorrido vertical de cada columna de pixeles
                        for (y = zona.y1; y <= zona.y2; y++) {
                            colorPixel = imagen.getPixelColor(x, y);
                            if (colorPixel > 0x1b1b1bff) { //Deteccion de un blanco                                                          
                                linea.push(y - zona.y1);
                                break;
                            }
                        }
                    }
                    for (k = 1; k < linea.length; k++) {
                        pendiente = linea[k - 1] - linea[k];
                        if (pendiente > 0) { //Subiendo                
                            if (combo === 0) { //Era el primer punto del combo
                                posiblePuntoQuiebre = k - 1;
                                recordAltura = linea[posiblePuntoQuiebre];
                                comboBreaker = 0;
                                console.log(posiblePuntoQuiebre);
                                // console.log(`Record altura: ${recordAltura}`);
                            }
                            combo++;
                            comboBreaker -= 0.5;
                            if (comboBreaker < 0)
                                comboBreaker = 0;
                        }
                        if (combo > 0) {
                            if (linea[k] >= (recordAltura)) { //Si la linea esta por debajo del record de altura tenemos combo breaker
                                comboBreaker++;
                            }
                            else {
                                comboBreaker = 0;
                                recordAltura = linea[k];
                            }
                            // console.log(`${k}: ${pendiente}. ${combo>0?'Combo: ' + combo:''}. Breaker: ${comboBreaker}`);
                            if (comboBreaker >= umbralComboBreaker || comboBreaker > combo || linea[k] >= ((recordAltura + linea[posiblePuntoQuiebre]) / 2)) {
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
                    for (k = 1; k < puntosQuiebre.length; k++) {
                        puntosQuiebre[k].intervalo = ((puntosQuiebre[k].left - puntosQuiebre[k - 1].left) / segundoPx) * 1000;
                        puntosQuiebre[k].bpm = 60000 / (puntosQuiebre[k].intervalo);
                    }
                    //calcular ajuste suma
                    console.log("Intervalos: " + puntosQuiebre.map(function (p) { return p.intervalo; }));
                    console.log("Bpms: " + puntosQuiebre.map(function (p) { return p.bpm; }));
                    promedioBpm = puntosQuiebre.filter(function (p) { return p.bpm; }).map(function (p) { return p.bpm; }).reduce(function (a, b) { return a + b; }, 0) / (puntosQuiebre.length - 1);
                    console.log("Promedio bpm: " + promedioBpm);
                    ajusteBpm = 150 - promedioBpm;
                    console.log("Ajuste: " + ajusteBpm);
                    for (k = 1; k < puntosQuiebre.length; k++) {
                        puntosQuiebre[k].bpmAjustado = puntosQuiebre[k].bpm + ajusteBpm;
                        puntosQuiebre[k].intervaloAjustado = 60000 / puntosQuiebre[k].bpmAjustado;
                    }
                    //Calcular variabilidades.
                    for (m = 2; m < (puntosQuiebre.length); m++) {
                        if (puntosQuiebre[m].intervalo && puntosQuiebre[m - 1].intervalo) {
                            puntosQuiebre[m].variacion = puntosQuiebre[m].intervalo - puntosQuiebre[m - 1].intervalo;
                            puntosQuiebre[m].variacionAjustada = puntosQuiebre[m].intervaloAjustado - puntosQuiebre[m - 1].intervaloAjustado;
                        }
                    }
                    // console.log(`Puntos quiebre; ${JSON.stringify(puntosQuiebre)}`);
                    return [2 /*return*/, res.send({ linea: linea, marcasTiempo: marcasTiempo, puntosQuiebre: puntosQuiebre, margenError: 500 / segundoPx })];
                });
            }); }).catch(function (error) {
                console.log("Error leyendo la ecograf\u00EDa: " + error);
                return res.status(400).send("Error leyendo archivo");
            });
            return [2 /*return*/];
        });
    });
});
router.get("/", function (_, res) {
    return res.send("test");
});
router.get("/test", function (_, res) {
    return res.send("test");
});
module.exports = router;
