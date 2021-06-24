import express, {Application, Request, Response} from "express"
const cors= require("cors");
const app:Application =express();
const dotenv=require("dotenv");
const rutasEcografias=require("./routes/ecografias")
dotenv.config();
app.use(express.json());

app.use("/ecografias", cors() , rutasEcografias);
app.use("/analisisDoppler", express.static(__dirname + '/analisisDoppler'));



const puerto= process.env.PORT || 3000;
app.listen(puerto, ()=>{
    console.log(`¡Aplicacion up!`);
})