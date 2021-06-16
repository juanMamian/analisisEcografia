<template>
  <div id="app">
    <div id="zonaSelectImagen">
      <img
        src="@/assets/upload.png"
        alt="Cargar imágen"
        id="botonUploadEco"
        @click="$refs.inputEcografia.click()"
      />     

      <input
        ref="inputEcografia"
        style="visibility: hidden"
        type="file"
        name="inputEcografia"
        id="inputEcografia"
        @change="mostrarImagenSeleccionada"
      />

      <center>
        <div
          id="zonaImagenSeleccionada"
          v-show="imagenSelected"
          @click.ctrl="iniciarDibujoZonaAnalisis"
          @mousemove="resizeZonaAnalisis"
          @keyup.left="setZonaAnalisis"
        >
          <canvas id="canvasAnalisis"></canvas>

          <img
            draggable="false"
            src=""
            alt="Ninguna imágen seleccionada"
            ref="imagenSeleccionada"
            id="imagenSeleccionada"
          />

          <div id="zonaAnalisis" :style="[offsetZonaAnalisis]">
            <div id="controlesZonaAnalisis">
              <radio name="showContornoEco" id="showContornoEco" v-model="showContornoEco"></radio>
            </div>
            <div class="marcaQuiebre" v-for="(quiebre, index) of quiebres" :key="'quiebre'+index" :style="[{left: (quiebre.left-1)+'px'}]">              
              <div class="controlesQuiebre">
                
              </div>              
              <div class="infoQuiebre infoIntervalo" v-if="quiebre.intervalo!=null">{{quiebre.intervalo.toFixed(2)}}ms</div>
            </div>

            <div
              class="agarraderoZonaAnalisis"
              id="agarraderoZonaAnalisis1"
              @mousedown.left="iniciarResize(0)"
              @mousemove="resizeZonaAnalisis(0, $event)"
              @mouseup.left="endResize(0)"
            >
              <div
                v-show="resizingZonaAnalisis[0] == true"
                class="burbujaHover"
              ></div>
            </div>
            <div
              class="agarraderoZonaAnalisis"
              id="agarraderoZonaAnalisis2"
              @mousedown.left="iniciarResize(1)"
              @mousemove="resizeZonaAnalisis(1, $event)"
              @mouseup.left="endResize(1)"
            >
              <div
                v-show="resizingZonaAnalisis[1] == true"
                class="burbujaHover"
              ></div>
            </div>
            <div
              class="agarraderoZonaAnalisis"
              id="agarraderoZonaAnalisis3"
              @mousedown.left="iniciarResize(2)"
              @mousemove="resizeZonaAnalisis(2, $event)"
              @mouseup.left="endResize(2)"
            >
              <div
                v-show="resizingZonaAnalisis[2] == true"
                class="burbujaHover"
              ></div>
            </div>
            <div
              class="agarraderoZonaAnalisis"
              id="agarraderoZonaAnalisis4"
              @mousedown.left="iniciarResize(3)"
              @mousemove="resizeZonaAnalisis(3, $event)"
              @mouseup.left="endResize(3)"
            >
              <div
                v-show="resizingZonaAnalisis[3] == true"
                class="burbujaHover"
              ></div>
            </div>
          </div>
        </div>
      </center>

      <button @click="uploadEcografia">Aceptar</button>
    </div>

    <div id="tablaResultados">
      <div class="cosa"></div><div class="valor"></div>

    </div>

  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "App",
  data() {
    return {
      montado: false,
      enviandoEco: false,

      respuestaAnalisis: null,
      respuestaRecibida: false,
      urlImagenRespuesta: null,
      quiebres:[],

      sizeImagenSeleccionada: {
        x: null,
        y: null,
      },
      imagenSelected: false,

      posicionesZonaAnalisis: {
        x1: 0,
        y1: 0,

        x2: 0,
        y2: 0,
      },
      umbralSize: 30,
      resizingZonaAnalisis: [false, false, false, false],
      showContornoEco:true
      
    };
  },
  methods: {
    setZonaAnalisis() {
      this.resizingZonaAnalisis = false;
    },

    iniciarResize(agarradero) {
      this.quiebres=[];
      this.resizingZonaAnalisis.fill(false);
      this.resizingZonaAnalisis.splice(agarradero, 1, true);
    },

    endResize(agarradero) {
      console.log(`Ending resize desde ${agarradero}`);
      this.resizingZonaAnalisis.splice(0, 1, false);
      this.resizingZonaAnalisis.splice(1, 1, false);
      this.resizingZonaAnalisis.splice(2, 1, false);
      this.resizingZonaAnalisis.splice(3, 1, false);
    },

    resizeZonaAnalisis(agarradero, e) {
      if (!this.resizingZonaAnalisis[agarradero]) return;

      console.log(`Rezising desde el agarradero ${agarradero}`);

      const posParent = document
        .getElementById("zonaImagenSeleccionada")
        .getBoundingClientRect();
      const posClick = {
        x: e.clientX - posParent.left,
        y: e.clientY - posParent.top,
      };
      var absc = "x";
      var oord = "y";

      if (agarradero == 0) {
        absc = "x1";
        oord = "y1";
      } else if (agarradero == 1) {
        absc = "x2";
        oord = "y1";
      } else if (agarradero == 2) {
        absc = "x1";
        oord = "y2";
      } else if (agarradero == 3) {
        absc = "x2";
        oord = "y2";
      }

      this.$set(this.posicionesZonaAnalisis, absc, posClick.x);
      this.$set(this.posicionesZonaAnalisis, oord, posClick.y);

      if (this.posicionesZonaAnalisis.x1 < 0)
        this.$set(this.posicionesZonaAnalisis, "x1", 0);
      if (this.posicionesZonaAnalisis.x2 < this.umbralSize)
        this.$set(this.posicionesZonaAnalisis, "x2", this.umbralSize);
      if (this.posicionesZonaAnalisis.y1 < 0)
        this.$set(this.posicionesZonaAnalisis, "y1", 0);
      if (this.posicionesZonaAnalisis.y2 < this.umbralSize)
        this.$set(this.posicionesZonaAnalisis, "y2", this.umbralSize);

      if (this.posicionesZonaAnalisis.x2 > posParent.width)
        this.$set(this.posicionesZonaAnalisis, "x2", posParent.width);
      if (this.posicionesZonaAnalisis.y2 > posParent.height)
        this.$set(this.posicionesZonaAnalisis, "y2", posParent.height);

      if (
        this.posicionesZonaAnalisis.x1 >
        this.posicionesZonaAnalisis.x2 - this.umbralSize
      )
        this.$set(
          this.posicionesZonaAnalisis,
          "x1",
          this.posicionesZonaAnalisis.x2 - this.umbralSize
        );
      if (
        this.posicionesZonaAnalisis.y1 >
        this.posicionesZonaAnalisis.y2 - this.umbralSize
      )
        this.$set(
          this.posicionesZonaAnalisis,
          "y1",
          this.posicionesZonaAnalisis.y2 - this.umbralSize
        );
    },
    mostrarImagenSeleccionada() {
      const archivo = this.$refs.inputEcografia.files[0];
      const dis = this;
      this.imagenSelected = true;
      if (FileReader && archivo) {
        var fr = new FileReader();
        fr.onload = function () {
          dis.$refs.imagenSeleccionada.src = fr.result;
          dis.$nextTick(() => {
            var anchoImagen = dis.$refs.imagenSeleccionada.offsetWidth;
            var altoImagen = dis.$refs.imagenSeleccionada.offsetHeight;

            dis.$set(dis.sizeImagenSeleccionada, "x", anchoImagen);
            dis.$set(dis.sizeImagenSeleccionada, "y", altoImagen);

            dis.posicionesZonaAnalisis = {
              x1: 0,
              y1: 0,

              x2: anchoImagen,
              y2: altoImagen,
            };
            dis.setcanvasAnalisis;
          });
        };
        fr.readAsDataURL(archivo);
      }
    },
    uploadEcografia() {
      const inputEco = document.getElementById("inputEcografia");
      var datos = new FormData();
      const eco = inputEco.files[0];
      datos.append("ecografia", eco);
      datos.append(
        "posicionesZonaAnalisis",
        JSON.stringify(this.posicionesZonaAnalisis)
      );

      this.enviandoEco = true;
      var dis = this;

      axios({
        method: "post",
        url: this.serverUrl + "/ecografias/analizarImagen",
        data: datos,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        //responseType:"blob"
      })
        .then(function ({ data }) {
          dis.enviandoEco = false;
          //console.log(`Eco analizada: ${JSON.stringify(data)}`);
          dis.trazarContornoEco(JSON.parse(data.linea));
          dis.trazarContornoNegroInferior(JSON.parse(data.lineaNegroInferior));
          console.log(`Marcas tiempo: ${data.marcasTiempo}`);
          dis.marcarTiempos(data.marcasTiempo);
          //dis.marcarQuiebres(data.puntosQuiebre);
          dis.quiebres=data.puntosQuiebre;          
          // var urlCreator = window.URL || window.webkitURL;
          // urlCreator.revokeObjectURL(dis.urlImagenRespuesta);
          // dis.urlImagenRespuesta = urlCreator.createObjectURL(data);
        })
        .catch(function (error) {
          dis.enviandoEco = false;
          console.log(`Error analizando la ecografía. E: ${error}`);
        });
    },
    trazarContornoEco(linea) {
      var posZona = document.getElementById("zonaAnalisis");
      var canvas = document.getElementById("canvasAnalisis");

      console.log(`Ubicando canvas. Height: ${posZona.style.height}`);
      canvas.style.left = posZona.style.left;
      canvas.style.top = posZona.style.top;
      canvas.style.width = posZona.style.width;
      canvas.style.height = posZona.style.height;
      canvas.width = parseInt(posZona.style.width);
      canvas.height = parseInt(posZona.style.height);

      var lapiz = canvas.getContext("2d");
      lapiz.fillStyle="red";

      console.log(`Trazando contorno`);
      for (var x = 0; x < parseInt(posZona.style.width); x++) {
        lapiz.fillRect((x), linea[x], 1, 1);
      }
    },
    trazarContornoNegroInferior(linea) {
      var posZona = document.getElementById("zonaAnalisis");
      var canvas = document.getElementById("canvasAnalisis");
      
      var lapiz = canvas.getContext("2d");
      lapiz.fillStyle="blue";

      for (var x = 0; x < parseInt(posZona.style.width); x++) {
        lapiz.fillRect((x), linea[x], 1, 1);
      }
    },
    marcarTiempos(marcas){
      var posZona = document.getElementById("zonaAnalisis").getBoundingClientRect();
      var canvas = document.getElementById("canvasAnalisis");
      var lapiz = canvas.getContext("2d");

      lapiz.fillStyle="yellow";
      for(var i=0;i<marcas.length;i++){
        lapiz.fillRect(marcas[i], posZona.height-10, 1, 7);

      }
    },
    marcarQuiebres(marcas){
      console.log(`Trazando quiebres: ${marcas}`);
      var posZona = document.getElementById("zonaAnalisis").getBoundingClientRect();
      var canvas = document.getElementById("canvasAnalisis");
      var lapiz = canvas.getContext("2d");

      lapiz.fillStyle="green";
      for(var i=0;i<marcas.length;i++){
        lapiz.fillRect(marcas[i], 0, 1, posZona.height);

      }
    }
  },
  computed: {
    offsetZonaAnalisis() {
      if (!this.montado) return;

      return {
        left: this.posicionesZonaAnalisis.x1 + "px",
        top: this.posicionesZonaAnalisis.y1 + "px",

        width:
          this.posicionesZonaAnalisis.x2 -
          this.posicionesZonaAnalisis.x1 +
          "px",
        height:
          this.posicionesZonaAnalisis.y2 -
          this.posicionesZonaAnalisis.y1 +
          "px",
      };
    },
  },
  mounted() {
    this.montado = true;
  },
};
</script>

<style>
#zonaSelectImagen {
  margin: 10px auto;
}
#zonaImagenSeleccionada {
  position: relative;
  display: inline-block;
  background-color: lightcoral;
}
#imagenSeleccionada {
  pointer-events: none;
  user-select: none;
}
#canvasAnalisis {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  max-width: 90%;
  pointer-events: none;
}
#zonaAnalisis {
  position: absolute;  
  border: 1px dotted purple;
  box-sizing: border-box;
}

#controlesZonaAnalisis{
  position: absolute;
  top: 2%;
  left: 101%;

}

.marcaQuiebre{
  width:1px;
  height: 100%;
  opacity: 0.5;
  position: absolute;
  top: 0px;
  
  background-color: rgb(128, 0, 0);
}

.agarraderoZonaAnalisis {
  width: 10px;
  height: 10px;
  cursor: pointer;
  position: absolute;
}

#agarraderoZonaAnalisis1 {
  border-left: 2px solid cadetblue;
  border-top: 2px solid cadetblue;
  top: 0px;
  left: 0px;
}
#agarraderoZonaAnalisis2 {
  border-right: 2px solid cadetblue;
  border-top: 2px solid cadetblue;
  top: 0px;
  right: 0px;
}
#agarraderoZonaAnalisis3 {
  border-left: 2px solid cadetblue;
  border-bottom: 2px solid cadetblue;
  bottom: 0px;
  left: 0px;
}
#agarraderoZonaAnalisis4 {
  border-right: 2px solid cadetblue;
  border-bottom: 2px solid cadetblue;
  bottom: 0px;
  right: 0px;
}
.burbujaHover {
  width: 180px;
  height: 180px;
  background-color: rgba(95, 158, 160, 0.219);
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

#botonUploadEco {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: cadetblue;
  cursor: pointer;
  display: block;
  margin: 10px auto;
}

#botonUploadEco:hover {
  background-color: rgb(140, 205, 207);
}

.simboloLoading {
  animation: girar 1.5s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  pointer-events: none;
  user-select: none;
}

.infoQuiebre{
  background-color: cadetblue;
  font-size: 10px;
  padding: 5px;
  border-radius: 6px;
  position: absolute;    
}

.infoIntervalo{
  right: 2px;
  bottom: 101%;
  font-size: 8px;
  padding: 2px 13px;
}

@keyframes girar {
  0% {
    transform: rotateZ(0deg);
  }
  100% {
    transform: rotateZ(360deg);
  }
}
</style>
