const usuarioDao = require('../dao/usuario');
const bcrypt = require('bcrypt');
var usuarioController = {
    addUsuario: addUsuario,
    findUsuarios: findUsuarios,
    findUsuarioById: findUsuarioById,
    updateUsuario: updateUsuario,
    deleteById: deleteById,
    enviarTokens: enviarTokens
    ,findUsuariosFuzzilyByName
    ,cambiarHabilitado
    ,ingresar
    ,invitar
}

function addUsuario(req, res) {
    let usuario = req.body;
    usuario.habilitado=true;
    usuarioDao.create(usuario)
        .then((data) => {
            res.send(data);
        })
        .catch((error) => {
            console.log(error);
        });
}

function findUsuarioById(req, res) {
    usuarioDao.findById(req.params.id)
        .then((data) => {
            if(data)
                res.send(data);
            else res.status(404).send();
        })
        .catch((error) => {
            res.status(500).send(error);
        });
}

function deleteById(req, res) {
    usuarioDao.deleteById(req.params.id).
        then((data) => {
            res.status(200).json({
                message: "Usuario deleted successfully",
                usuario: data
            })
        })
        .catch((error) => {
            console.log(error);
        });
}

function updateUsuario(req, res) {
    usuarioDao.updateUsuario(req.body, req.params.id).
        then((data) => {
            res.status(200).json({
                message: "Usuario updated successfully",
                usuario: data
            })
        })
        .catch((error) => {
            console.log(error);
        });
}

function findUsuarios(req, res) {
    usuarioDao.findAll({incluirHabilitado:req.query.incluirHabilitado!=undefined}).
        then((data) => {
            res.send(data);
        })
        .catch((error) => {
            console.log(error);
        });
}

function enviarTokens(req, res) {
    usuarioDao.enviarTokens(req.params.id,req.body.receptorID,req.body.tokens)
        .then((data) => {
            res.send(data);
        })
        .catch((error) => {
            console.log(error);
        });
}

function findUsuariosFuzzilyByName(req, res) {
    usuarioDao.findFuzzilyByName(req.params.query,req.session.usuarioID)
        .then((data) => {
            res.send(data);
        })
        .catch((error) => {
            console.log(error);
        });
}

function cambiarHabilitado(req, res) {
    usuarioDao.cambiarHabilitado(req.params.id,req.body.valor)
        .then((data) => {
            res.send(data);
        })
        .catch((error) => {
            console.log(error);
        });
}

function ingresar(req, res) {
    usuarioDao.findByUsername(req.body.usuario)
        .then((usuarios) => {
            for(let usuario of usuarios){
                if(bcrypt.compareSync(req.body.contrasenia, usuario.contrasenia)){
                    req.session.usuarioID=usuario.ID;
                    res.send(usuario);
                    return; // break;
                }
            }
        })
        .catch((error) => {
            res.status(500).send(error);
        });
}

function invitar(req,res){
    console.log('controlador',req.session,req.session.usuarioID,req.params.id);
    usuarioDao.invitar(req.session.usuarioID,req.params.id)
        .then((usuario) => {
            // console.log(usuario);
            res.send(/* usuario.amistad */);
        })
        .catch((error) => {
            console.log(error);
            res.status(500).send(error);
        });
}

module.exports = usuarioController;