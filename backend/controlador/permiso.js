const permisoDao = require('../dao/permiso');
var permisoController = {
    findPermisos: findPermisos
}

function findPermisos(req, res) {
    permisoDao.findAll()
        .then((data) => {
            res.send(data);
        })
        .catch((error) => {
            res.status(500).send(error.message);
        });
}

module.exports = permisoController;