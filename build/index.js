"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors = require("cors");
var app = express_1.default();
var dotenv = require("dotenv");
var rutasEcografias = require("./routes/ecografias");
dotenv.config();
app.use(express_1.default.json());
app.use("/ecografias", cors(), rutasEcografias);
app.use("/analisisDoppler", express_1.default.static(__dirname + '/analisisDoppler'));
var puerto = process.env.PORT || 3000;
app.listen(puerto, function () {
    console.log("\u00A1Aplicacion up!");
});
