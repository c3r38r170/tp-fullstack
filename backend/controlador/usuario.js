const usuarioDao = require('../dao/usuario');
const bcrypt = require('bcrypt');
var usuarioController = {
    addUsuario: addUsuario,
    findUsuarios: findUsuarios,
    findUsuarioById: findUsuarioById,
    updateUsuario: updateUsuario,
    deleteById: deleteById
    ,findUsuariosFuzzilyByName
    ,cantidadDeUsuarios
    ,cambiarHabilitado
    ,ingresar
    ,invitar
    ,eliminarInvitacion
    ,aceptarInvitacion
    ,eliminarAmigo
    ,actualizarPermisos
    ,actualizarDatos

    ,salir
}

// TODO Refactor: Centralizar esto
let mensajeNoTienePermisos='No tiene los permisos necesarios.';

function addUsuario(req, res) {
    // * Registro. Lo puede hacer cualquiera.
    let usuario = req.body;
    // TODO Now: permisos por default
    usuario.habilitado=true;
    usuarioDao.create(usuario)
        .then((data) => {
            res.send(data);
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
}

function findUsuarioById(req, res) {
    usuarioDao.findById(req.params.id)
        .then((data) => {
            if(data)
                res.send(data);
            else res.status(404).send('Usuario no encontrado.');
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
}

function deleteById(req, res) {
    let eliminarUsuario=()=>{
        usuarioDao.deleteById(req.params.id)
        .then((data) => {
            // TODO Refactor: wtf xq json
            res.status(200).json({
                message: "Usuario deleted successfully",
                usuario: data
            })
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
    }

    if(req.session.usuarioID==req.params.id){
        eliminarUsuario();
    }else{
        // TODO Refactor: Enum para los permisos
        if(!req.session.usuario.permisos.some((per)=>per.ID==2)){ // * 2 es Administrar usuarios
            res.status(403).send(mensajeNoTienePermisos);
        }else{
            eliminarUsuario();
        }
    }
}

function updateUsuario(req, res) {
    usuarioDao.updateUsuario(req.body, req.params.id).
        then((data) => {
            // TODO Refactor: wtf xq json
            res.status(200).json({
                message: "Usuario updated successfully",
                usuario: data
            })
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
}

function findUsuarios(req, res) {
    // ! incluirHabilitado es si incluir que habilitado=true; so true here will bring you solo habilitados, false es todos.
    // TODO Refactor: Cambiar a "soloHabilitados"
    usuarioDao.findAll({incluirHabilitado:req.query.incluirHabilitado!=undefined}).
        then((data) => {
            res.send(data);
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
}

function findUsuariosFuzzilyByName(req, res) {
    usuarioDao[req.query.incluirAmigos?'buscarPorNombre':'buscarNoAmigosPorNombre'](
        req.params.consulta
        ,req.session.usuarioID
        ,{
            pagina:req.query.pagina
            ,soloHabilitados:!!+req.query.soloHabilitados
        }
    )
        .then((data) => {
            res.send(data);
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
}

function cantidadDeUsuarios(req, res) {
    let usuario=req.session.usuario;

    // TODO Refactor: Enum para los permisos (ver que en modelos/permiso.js tambien se propuso)
    if(!usuario.permisos.some((per)=>per.ID==2)){ //* Administrar Usuarios
        res.status(403).send(mensajeNoTienePermisos);
        return;
    }

    // ! El segundo parámetro es la persona a OMITIR; o sea, el usuario actual.
    usuarioDao.buscarPorNombre(req.params.consulta,req.session.usuarioID)
        .then((data) => {
            res.send(Math.ceil(data.length/usuarioDao.cantidadPorPagina).toString());
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
}

// TODO Refactor: Unir con actualizarDatos
function cambiarHabilitado(req, res) {
    let usuario=req.session.usuario;
    
    // TODO Refactor: Enum para los permisos
    // TODO Refactor: Algún control centralizado de permisos? Tipo tengo(permisoID)
    if(!usuario.permisos.some((per)=>per.ID==2)){ // * Administrar usuarios
        res.status(403).send(mensajeNoTienePermisos);
        return;
    }

    usuarioDao.cambiarHabilitado(req.params.id,req.body.valor)
        .then((data) => {
            res.send(data);
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
}

function ingresar(req, res) {
    usuarioDao.findByUsername(req.body.usuario)
        .then((usuarios) => {
            if(usuarios.length==0){
                res.status(404).send('Nombre de usuario incorrecto.');
            }else{
                for(let usuario of usuarios){
                    if(bcrypt.compareSync(req.body.contrasenia, usuario.contrasenia)){
                        req.session.usuarioID=usuario.ID;
                        res.send(usuario);
                        return; // ? break;
                    }
                }
                res.status(401).send('Contraseña incorrecta.');
            }
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
}

function salir(req, res) {
    req.session.destroy();
    // TODO Refactor: ¿Hace falta explicitar esto? Por lo menos dejarlo en un comentario
    res.status(200).send();
}

// TODO Refactor: En invitasr, eliminarInvitacion, cancelarInvitacion y rechazarInvitacion (y aceptarAmigo y eliminarAmigo (creo)) se usan las IDs, pero siempre tenemos uno de los 2 usuarios. Ver cómo evitar usar 2 veces findByIk

function invitar(req,res){
    usuarioDao.invitar(req.session.usuarioID,req.params.id)
        .then(() => {
            res.send();
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
}
function eliminarInvitacion(req,res){
    // TODO DRY? (ala window[?'':''])
    return req.body.soyInvitador?
        cancelarInvitacion(req,res)
        :rechazarInvitacion(req,res);
    
}
function cancelarInvitacion(req,res){
    usuarioDao.eliminarInvitacion(req.session.usuarioID,req.params.id)
        .then(() => {
            res.send();
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
}
function rechazarInvitacion(req,res){
    usuarioDao.eliminarInvitacion(req.params.id,req.session.usuarioID)
        .then(() => {
            res.send();
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
}
function aceptarInvitacion(req,res){
    usuarioDao.aceptarInvitacion(req.session.usuarioID,req.params.id)
        .then((usuario) => {
            res.send(usuario);
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
}
function eliminarAmigo(req,res){
    usuarioDao.eliminarAmigo(req.session.usuarioID,req.params.id)
        .then((usuario) => {
            // TODO mandar explicitamente un código??  no content
            res.send(/* usuario */);
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
}

function actualizarPermisos(req,res){
    let usuario=req.session.usuario;
    
    // TODO Refactor: Enum para los permisos
    if(!usuario.permisos.some((per)=>per.ID==2)){ // * Administrar permisos
        res.status(403).send(mensajeNoTienePermisos);
        return;
    }

    usuarioDao.actualizarPermisos(req.params.id,req.body.permisos)
    .then((data) => {
        res.send(data);
    })
    .catch((error) => {
        res.status(500).send(error.message);
    });
}

function actualizarDatos(req,res){
    let editadoID=req.params.id;
    let dato=req.body.dato;
    let datosPosibles=[
        'nombreCompleto'
        // TODO Now: setter de contraseña, ver cómo se hace en la creación
        ,'contrasenia'
        ,'correo'
    ]
    
        // TODO Refactor: No me acuerdo como funciona el hoisting acá, pero estaría bueno que semánticamente esta función vaya después de los chequeos de abajo. Lo mismo más arriba con los permisos o de donde sea que saqué parte del algoritmo.
    let realizarActualizacion=()=>{
        if(!datosPosibles.includes(dato)){
            res.status(400).send('Hay un dato que no tiene permiso de actualizar.');
        }
        usuarioDao.findById(editadoID)
            .then(usuario=>{
                // TODO Refactor: Enum para los permisos
                usuario[req.body.dato]=req.body.valor;
                usuario.save()
                    .then(()=>{
                        res.send();
                    })
            })
    }

    // TODO Refactor: quizá hacer algo con las rutas que se puedan si se tienen permisos
    if(req.session.usuarioID==editadoID){
        realizarActualizacion();
    }else{
        if(!req.session.usuario.permisos.some((per)=>per.ID==2)){
            res.status(403).send(mensajeNoTienePermisos);
        }else{
            // TODO Refactor: (duplicado) pasar habilitado para acá, de su propia función
            datosPosibles=datosPosibles.concat('DNI','nombreUsuario','habilitado');
            realizarActualizacion();
        }
    }
}

module.exports = usuarioController;