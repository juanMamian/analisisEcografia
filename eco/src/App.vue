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
          <canvas id="canvasContorno" ref="canvasContorno" v-show="showContornoEco"></canvas>

          <img
            draggable="false"
            src=""
            alt="Ninguna imágen seleccionada"
            ref="imagenSeleccionada"
            id="imagenSeleccionada"
          />

          <div id="zonaAnalisis" :style="[offsetZonaAnalisis]">
            <img class="simboloLoading" src="@/assets/loading.png" v-show="enviandoEco">
            <div id="controlesZonaAnalisis" v-show="respuestaRecibida">
              <div class="bloqueControl">
                <label for="showContornoEco" class="labelCheckbox">Contorno</label><input class="checkControlAnalisis" type="checkbox" name="showContornoEco" id="showContornoEco" v-model="showContornoEco"> 
              </div>
              <div class="bloqueControl">
                <label for="showMarcasR" class="labelCheckbox">R</label><input type="checkbox" class="checkControlAnalisis" name="showMarcasR" id="showMarcasR" v-model="showMarcasR">
              </div>
              <div id="infoVariabilidad" class="infoAnalisis" v-if="variabilidad">
                Variación promedio: {{variabilidad.toFixed(2)}} <br>
                Ajustada: {{variabilidadAjustada.toFixed(2)}}
              </div>
              <div id="infoMargenError" class="infoAnalisis" v-if="margenError">
                Margen de error: {{margenError.toFixed(2)}}ms
              </div>
            </div>
            <div class="marcaQuiebre" v-show="showMarcasR" v-for="(quiebre, index) of quiebres" :key="'quiebre'+index" :style="[{left: (quiebre.left-1)+'px'}]">              
              <div class="controlesQuiebre">
                
              </div>              
              <div class="infoQuiebre infoIntervalo" v-if="quiebre.intervalo!=null">{{quiebre.intervalo.toFixed(2)}}ms</div>
              <div class="infoQuiebre infoIntervaloAjustado" v-if="quiebre.intervalo!=null">{{quiebre.intervaloAjustado.toFixed(2)}}ms</div>
            </div>

            <div id="lineaMarcasTiempo"></div>

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
        <br><br>
      <input v-show="imagenSelected" type="color" v-model="umbralEco">
      <button v-show="imagenSelected" @click="uploadEcografia" ref="botonEnviarEco" id="botonEnviarEco" :class="{deshabilitado:enviandoEco}">Analizar</button>

      </center>

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
      margenError: null,

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
      showContornoEco:true,
      showMarcasR:true,

      umbralEco: "#1B1B1B"
      // umbralEco: 0x1b1b1bff,
      
    };
  },
  methods: {
    setZonaAnalisis() {
      this.resizingZonaAnalisis = false;
    },
    vaciarAnalisis(){
      this.quiebres=[];
      var canvas=this.$refs.canvasContorno;
      var lapiz=canvas.getContext("2d");
      lapiz.clearRect(0,0, canvas.width, canvas.height);
    },
    iniciarResize(agarradero) {
      this.vaciarAnalisis();
      this.respuestaRecibida=false;
      this.resizingZonaAnalisis.fill(false);
      this.resizingZonaAnalisis.splice(agarradero, 1, true);
    },
    endResize() {
      this.resizingZonaAnalisis.splice(0, 1, false);
      this.resizingZonaAnalisis.splice(1, 1, false);
      this.resizingZonaAnalisis.splice(2, 1, false);
      this.resizingZonaAnalisis.splice(3, 1, false);
    },
    resizeZonaAnalisis(agarradero, e) {
      if (!this.resizingZonaAnalisis[agarradero]) return;
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

      this.$set(this.posicionesZonaAnalisis, absc, Math.round(posClick.x));
      this.$set(this.posicionesZonaAnalisis, oord, Math.round(posClick.y));

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
        this.vaciarAnalisis();
        this.respuestaRecibida=false;
        var fr = new FileReader();
        fr.onload = function () {
          dis.$refs.imagenSeleccionada.src = fr.result;
          dis.$nextTick(() => {
            var anchoImagen = dis.$refs.imagenSeleccionada.offsetWidth;
            var altoImagen = dis.$refs.imagenSeleccionada.offsetHeight;
            console.log(`AnchoImagen: ${anchoImagen}`);
            console.log(`AltoImagen: ${altoImagen}`);
            dis.$set(dis.sizeImagenSeleccionada, "x", anchoImagen);
            dis.$set(dis.sizeImagenSeleccionada, "y", altoImagen);
            if(dis.posicionesZonaAnalisis.x2-dis.posicionesZonaAnalisis.x1==0 || dis.posicionesZonaAnalisis.y2-dis.posicionesZonaAnalisis.y1==0){
              dis.posicionesZonaAnalisis = {
                x1: 0,
                y1: 0,

                x2: anchoImagen,
                y2: altoImagen,
              };            
            }
            dis.$set(dis.posicionesZonaAnalisis, "y2", altoImagen);
            
          });
        };
        fr.readAsDataURL(archivo);
      }
    },
    uploadEcografia() {
      if(this.enviandoEco)return;
      const inputEco = document.getElementById("inputEcografia");
      var datos = new FormData();
      const eco = inputEco.files[0];
      datos.append("ecografia", eco);
      datos.append(
        "posicionesZonaAnalisis",
        JSON.stringify(this.posicionesZonaAnalisis)
      );
      datos.append("umbralEco", this.umbralEco);

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
          dis.respuestaRecibida=true;
          dis.enviandoEco = false;
          //console.log(`Eco analizada: ${JSON.stringify(data)}`);
          dis.trazarContornoEco(data.linea);          
          dis.marcarTiempos(data.marcasTiempo);
          //dis.marcarQuiebres(data.puntosQuiebre);
          dis.quiebres=data.puntosQuiebre;     
          dis.margenError=data.margenError;     
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
      var canvas = document.getElementById("canvasContorno");

      canvas.style.left = posZona.style.left;
      canvas.style.top = posZona.style.top;
      canvas.style.width = posZona.style.width;
      canvas.style.height = posZona.style.height;
      canvas.width = parseInt(posZona.style.width);
      canvas.height = parseInt(posZona.style.height);

      var lapiz = canvas.getContext("2d");
      lapiz.fillStyle="red";

      for (var x = 0; x < parseInt(posZona.style.width); x++) {
        lapiz.fillRect((x), linea[x], 1, 1);
      }
    },    
    marcarTiempos(marcas){
      var posZona = document.getElementById("zonaAnalisis").getBoundingClientRect();
      var canvas = document.getElementById("canvasContorno");
      var lapiz = canvas.getContext("2d");

      lapiz.fillStyle="yellow";
      for(var i=0;i<marcas.length;i++){
        lapiz.fillRect(marcas[i], posZona.height-10, 1, 7);

      }
    },
    marcarQuiebres(marcas){
      console.log(`Trazando quiebres: ${marcas}`);
      var posZona = document.getElementById("zonaAnalisis").getBoundingClientRect();
      var canvas = document.getElementById("canvasContorno");
      var lapiz = canvas.getContext("2d");

      lapiz.fillStyle="green";
      for(var i=0;i<marcas.length;i++){
        lapiz.fillRect(marcas[i], 0, 1, posZona.height);

      }
    },
    teclaPresionada(e){
      
      if(e.which===13 && this.imagenSelected){
        this.$refs.botonEnviarEco.click();
      }
      if(e.which===78){
        this.$refs.inputEcografia.click();
      }
      if(e.which===82){
        document.getElementById("showMarcasR").click();
      }
      if(e.which===67){
        document.getElementById("showContornoEco").click();        
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
    variabilidad(){
      var variaciones=this.quiebres.filter(q=>q.variacion).map(q=>q.variacion);
      if(variaciones.length<1)return null;

      return variaciones.reduce((a, b)=>{return (Math.abs(a)+Math.abs(b))}, 0)/variaciones.length
    },
    variabilidadAjustada(){
      var variaciones=this.quiebres.filter(q=>q.variacionAjustada).map(q=>q.variacionAjustada);
      if(variaciones.length<1)return null;

      return variaciones.reduce((a, b)=>{return (Math.abs(a)+Math.abs(b))}, 0)/variaciones.length
    }
  },
  mounted() {
    this.montado = true;
    document.addEventListener('keyup', this.teclaPresionada);
    
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
#canvasContorno {
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

#lineaMarcasTiempo{
  height: 1px;
  width: 100%;
  position: absolute;
  left: 0px;
  bottom: 2px;
  background-color: yellow;
}


.marcaQuiebre{
  width:1px;
  height: 100%;
  opacity: 0.9;
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
  position: absolute;
  top: 50%;
  left:50%;
  transform: translate(-50%, -50%);
}

.infoQuiebre{
  background-color: rgb(169, 231, 233);
  font-size: 11px;
  padding: 5px;
  border-radius: 6px;
  position: absolute;    
}

.infoIntervalo{
  right: 2px;
  bottom: 101%;
  padding: 2px 13px;
}
.infoIntervaloAjustado{
  right: 2px;
  top: -40px;
  padding: 2px 13px;
  background-color: rgb(255, 151, 133);
}

#controlesZonaAnalisis{
  position: absolute;
  top: -80px;
  left: 50%;
  background-color: rgb(245, 178, 168);
  border:1px solid rgb(71, 17, 7);
  border-radius: 10px;
  transform:translate(-50%, -100%);
  padding: 15px;
}

.bloqueControl{
  min-width: 120px;
  margin: 5px 0px;
  display: grid;
  grid-template-columns: 1fr 50px;
}

.labelCheckbox{
  font-size: 13px;
}
.checkControlAnalisis{
  margin-left: auto;
}

.infoAnalisis{
  font-size: 13px;
}

#infoVariabilidad{
  padding: 5px;
  border: 1px solid black;
}

#botonEnviarEco{
  padding: 15px;
}

.deshabilitado{
  opacity: 0.6;
  pointer-events: none;
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
