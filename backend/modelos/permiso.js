
const Sequelize = require('sequelize');
const db = require('../datos/db');
const {Usuario}=require('./usuario');

const Permiso = db.define('permiso', {
    ID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    descripcion: {
        type: Sequelize.STRING,
        allowNull: false
    },
    predeterminado:{
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue:true
    }
});

const UsuarioPermiso = db.define('usuario_permiso');

const opcionesUsuarioPermiso={
    through: UsuarioPermiso
    ,constraints:false
};

// TODO Refactor: enumeración de permisos para toda la aplicación
/* 
const PermisosIDs={
    GENERAR_TOKENS:1
    ,ADMINISTRAR_USUARIOS:2
    ,ENVIAR_TOKENS:3
}
// Y, admemás, que se tomen las IDs de la base de datos?

// Ver cómo se debería hacer este chequeo, si por IDs o por objetos...
*/

Permiso.sync()
    .then(()=>{
        Permiso.findAll()
            .then(permisos=>{
                if(! permisos.length){
                    Permiso.bulkCreate([
                        {
                            descripcion:'Generar Tokens'
                            ,predeterminado:false
                        }
                        ,{
                            descripcion:'Administrar Usuarios'
                            ,predeterminado:false
                        }
                        ,{
                            descripcion:'Enviar Tokens'
                            ,predeterminado:true
                        }
                    ])
                }
            });

        Usuario.belongsToMany(Permiso, opcionesUsuarioPermiso);
        Permiso.belongsToMany(Usuario, opcionesUsuarioPermiso);
    
        UsuarioPermiso.sync();
    });

module.exports = {Permiso,/* PermisosIDs */};