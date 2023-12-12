// const {Permiso} = require('../modelos/permiso');
const {Token} = require('../modelos/usuario');

var tokensDao = {
    obtenerCantidadCirculando
    ,generar
    ,enviar
}

function obtenerCantidadCirculando() {
    return Token.findAndCountAll();
}

function generar(cantidad,usuario){
    Token.bulkCreate(new Array(cantidad).fill(new Token()))
        .then(nuevasTokens=>{
            usuario.addTokensAsociadas(nuevasTokens);
        });
        // ! usuario.save se ejecuta antes que el addTokensAsociadas?
    return usuario.save();
}

function enviar(emisor,receptor,cantidad){
    return emisor.getTokensAsociadas().then(tokensEnJuego=>{
        receptor.addTokensAsociadas(tokensEnJuego.slice(0,cantidad));
        return receptor.save();
    })
    // TODO Security: Ver si se hace el chequeo de máximo antes
}

module.exports = tokensDao;