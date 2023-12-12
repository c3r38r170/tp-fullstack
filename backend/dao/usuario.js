const {Usuario,Token,Amistades,ESTADOS_AMISTADES} = require('../modelos/usuario');
const {Permiso,UsuarioPermiso} = require('../modelos/permiso');
const permisoDao = require('./permiso');
const Sequelize =require('sequelize');
var usuarioDao = {
    findAll: findAll,
    create: create,
    findById: findById,
    deleteById: deleteById,
    updateUsuario: updateUsuario
    ,buscarNoAmigosPorNombre: buscarNoAmigosPorNombre
    ,cambiarHabilitado
    ,findByUsername
    ,invitar
    ,eliminarInvitacion
    ,aceptarInvitacion
    ,eliminarAmigo
    ,buscarPorNombre
    ,actualizarPermisos
    
    ,cantidadPorPagina:10
}

var include=[
    {
        model:Token
        ,as:'tokensAsociadas'
    }
    ,Permiso
    ,{
        model:Usuario
        ,as:'amigosInvitados'
    }
    ,{
        model:Usuario
        ,as:'amigosAceptados'
    }
];
// var atributosIniciales=; // ? si lo toco en un par de metodos, se altera?
function valoresEspecialesUsuario(usuario,incluirTokensAsociadas=false,incluirAmigos=true) {
    usuario.setDataValue('tokens',usuario.tokensAsociadas.length);
    if(!incluirTokensAsociadas){ // TODO
        // attributes.push([Sequelize.fn('count', Sequelize.col('tokensAsociadas.ID')), 'tokens']);
        // findOptions.group=['usuario.ID'];
    }
    // TODO incluirAmigos?
    usuario.amigos=[...usuario.amigosInvitados,...usuario.amigosAceptados];
    return usuario;
}

const CANTIDAD_POR_PAGINA=usuarioDao.cantidadPorPagina;

function permisosIDsAPermisos(permisos){
    return Promise.all(permisos.map(p=>permisoDao.findById(p.ID)));
}

function findAll({
    incluirContrasenia=false
    ,incluirHabilitado=false
    ,incluirTokensAsociadas=false
    // ,incluirAmigos=false
    ,where=null

    // TODO Esto es horrible, encontrar una solución genérica para las propiedades extra necesarias.
    // * Veces que necesité darle atención a esta parte: II
    ,order=null
    ,limit=null
    ,offset=null
}={}) {
    let attributes =[
        'ID'
        ,'nombreCompleto'
        ,'nombreUsuario'
        ,'DNI'
        ,'correo'
    ];
    let findOptions={
        include
    }

    if(incluirContrasenia)
        attributes.push('contrasenia');
    if(incluirHabilitado)
        attributes.push('habilitado');
    /* if(incluirAmigos){
        attributes.push('amigos');
    } */
    if(where){
        findOptions.where=where;
    }
    if(order)
        findOptions.order=order;
    if(limit)
        findOptions.limit=limit;
    if(offset)
        findOptions.offset=offset;

    // ? findOptions está de más?
    findOptions.attributes = attributes;
    return Usuario.findAll(findOptions)
        .then(all=>{
            return all.map(usu=>valoresEspecialesUsuario(usu,incluirTokensAsociadas));
        })
    // return (await Usuario.findAll(findOptions)).map(usu=>valoresEspecialesUsuario(usu,incluirTokensAsociadas));
}

function findById(id,{incluirHabilitado=false}={}) {
    let attributes=[
        'ID'
        ,'nombreCompleto'
        ,'nombreUsuario'
        ,'DNI'
        ,'correo'
    ];
    if(incluirHabilitado)
        attributes.push('habilitado');

    return Usuario.findByPk(id,{
        include
        ,attributes
    })
        .then(usuario=>{
            if(usuario){
                usuario=valoresEspecialesUsuario(usuario);
            }
            return usuario;
        });
}

function deleteById(id) {
    return Usuario.destroy({ where: { id } });
}

function create(usuario) {
    usuario.tokensAsociadas=new Array(+(usuario.tokens||0)).fill({});
    let permisos=usuario.permisos;
    delete usuario.permisos;

    let nuevoUsuario;

    return Promise.all(
        [
            Usuario.create(usuario,{
                include:[{
                    model:Token
                    ,as:'tokensAsociadas'
                },Permiso]
            })
            ,(permisos?
                permisosIDsAPermisos(permisos)
                :Permiso.findAll({where:{predeterminado:true}})
            )
        ]
    )
        .then(([usuarioCreado,objetosPermisos])=>{
            nuevoUsuario=usuarioCreado;
            return nuevoUsuario.setPermisos(objetosPermisos);
        })
        .then(()=>{
            nuevoUsuario.save();
        })
        .then(()=>findById(nuevoUsuario.ID));
/* 
    let nuevoUsuario=await Usuario.create(usuario,{
        include:[{
            model:Token
            ,as:'tokensAsociadas'
        },Permiso]
    });

    if(permisos){
        let permisosReales=await permisosIDsAPermisos(permisos);
        nuevoUsuario.setPermisos(permisosReales);
    }else{
        let permisosPredeterminados=await Permiso.findAll({where:{predeterminao:true}});
        nuevoUsuario.setPermisos(permisosPredeterminados);
    }

    return nuevoUsuario.save()
        .then(()=>findById(nuevoUsuario.ID)); */
}

function updateUsuario(usuario, id) {
    return findById(id)
        .then(oldUsuario=>{
            let diferencia=usuario.tokens-oldUsuario.tokensAsociadas.length;

            let cambios=[
                permisosIDsAPermisos(usuario.permisos)
            ];

            if(diferencia>0){
                cambios.push(aniadirTokens(oldUsuario,diferencia));
            }else if(diferencia<0){
                cambios.push(quitarTokens(oldUsuario,-diferencia));
            }
            
            return Promise.all(cambios);
        })
        .then(([permisos])=>{
            usuario.permisos=permisos;

            // TODO Feature: usar save? probar la base de datos en Planet Scale
            return Usuario.update(usuario, { where: { id } });
        })
}

function aniadirTokens(usuario,cantidad){
    if(!cantidad)
        return;

    return Token.bulkCreate(new Array(cantidad).fill(new Token()))
        .then(nuevasTokens=>{
            return usuario.setTokensAsociadas(nuevasTokens);
        });
}

function quitarTokens(usuario,cantidad){
    // TODO Feature: qué pasa si un método que devuelve promesas falla? ver tambien en aniadirTokens  ... tiramos un error y se triguerea catch?
    if(!cantidad)
        return;

    return usuario.getTokensAsociadas()
        .then(tokensAsociadas=>{
            // TODO Feature: Creo que esto no anda a menos que devuelva una promise... cuyo caso sería Promise.all(new Array...)?? a menos que se implemente removeTokensAsociadas
            for(let i=0;i<cantidad;i++)
                tokensAsociadas[i].destroy();
            // TODO Refactor: Tratar de hacer esto.
            // await usuario.removeTokensAsociadas(tokensAsociadas.splice(0,cantidad));
        })
}

function buscarNoAmigosPorNombre(consulta,usuarioID,{pagina=0}){
    return buscarPorNombre(consulta,usuarioID,{pagina})
        .then(usuarios=>usuarios.filter(usu=>!usu.amigos.some(ami=>ami.ID==usuarioID)));
}

function buscarPorNombre(consulta,usuarioID,{pagina=0,soloHabilitados=true}={}){
    let where={
        ID:{
            [Sequelize.Op.not]:usuarioID
        }
    };
    if(soloHabilitados){
        where.habilitado=1;
    }
    if(consulta?.trim())
        where.nombreCompleto={
            [Sequelize.Op.like]:`%${consulta}%`
        };

    // ! Es un método de esta clase, no el auténtico findAll.
    return findAll({
        // incluirAmigos:true,
        where
        ,order:[
            ['nombreCompleto','ASC']
        ]
        ,limit:pagina?CANTIDAD_POR_PAGINA:null // TODO comprobar que esto funciona, si se tiene que poner undefined, o cómo hacerlo bien.
        ,offset:pagina?((pagina-1)*CANTIDAD_POR_PAGINA):null
        ,incluirHabilitado:!soloHabilitados
    });
}

function cambiarHabilitado(id,valor){
    return findById(id,{incluirHabilitado:true})
        .then(usuario=>{
            usuario.habilitado=valor;
            return usuario.save();
        });
}

function findByUsername(usuario){
    return findAll({
        where:{
            nombreUsuario:usuario
        }
        ,incluirContrasenia:true
    });
}

function invitar(invitadorID,invitadoID){
    return Promise.all([findById(invitadorID),findById(invitadoID)])
        .then(usuarios=>{
            usuarios[0].addAmigosInvitados(
                usuarios[1]
            );
            return usuarios[0].save();
        })
}

function eliminarInvitacion(invitadorID,invitadoID){
    let invitadorAGuardar;
    return Promise.all([findById(invitadorID),findById(invitadoID)])
        .then(([invitador,invitado])=>{
            invitadorAGuardar=invitador
            return invitadorAGuardar.removeAmigosInvitados(
                invitado
            );
        }).then(()=>{
            return invitadorAGuardar.save();
        })
}

function aceptarInvitacion(invitadoID,invitadorID){
    return findById(invitadorID)
        .then(invitador=>{
            let amistad=invitador.amigosInvitados.find(usu=>usu.ID==invitadoID);
            if(amistad){
                amistad.amistades.estado='amigos';

                return amistad.amistades.save();
            } // TODO Feature else fallar http
        });
}

function eliminarAmigo(usuarioID,amigoID){
    return findById(usuarioID)
        .then(usuario=>{
            let amistad=usuario.amigosAceptados.find(usu=>usu.ID==amigoID);
            if(amistad){
                return amistad.amistades.destroy();
            } // TODO Feature else fallar http // O, no-content
        });
}

function actualizarPermisos(id,permisos){
    // TODO Encontrar la forma de hacer esto implícito.  Quizá con un include?
    return Promise.all([findById(id,{incluirHabilitado:true}),...permisos.map(p=>(permisoDao.findById(p.ID)))])
        .then(([usuario,...permisos])=>{
            usuario.setPermisos(permisos);
            return usuario.save();
        });
}

module.exports = usuarioDao;