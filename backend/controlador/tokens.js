const tokensDao = require('../dao/tokens');
const usuarioDao = require('../dao/usuario');
var tokensController = {
    obtenerCantidadCirculando
		,generar
		,enviar
}

function obtenerCantidadCirculando(req, res) {
	let usuario=req.params.usuario;

	if(!usuario.permisos.some((per)=>per.ID==1)){
		res.status(403).send('No tiene los permisos necesarios.');
		return;
	}

	tokensDao.obtenerCantidadCirculando()
		.then((data) => {
			res.send(data.count.toString());
		})
		.catch((error) => {
			res.status(500).send(error.message);
		});
}

function generar(req,res){
	let usuario=req.session.usuario;
	if(!usuario.permisos.some((per)=>per.ID==1)){
		res.status(403).send();
		return;
	}

	let cantidad = req.body.cantidad;
	tokensDao.generar(cantidad,usuario)
		.then(() => {
			res.send();
		})
		.catch((error) => {
			res.status(500).send(error.message);
		});
}

function enviar(req, res) {
	let emisor=req.session.usuario;
	
	if(!emisor.permisos.some(per=>per.ID==3)){
		res.status(403).send("No tiene los permisos necesarios.");
		return;
	}
	
	if(!emisor.amigos.some(ami=>(ami.ID==receptor.ID && ami.amistades.estado=='amigos'))){
		res.status(403).send("No se pueden enviar tokens a alguien que no sea de sus amistades.");
		return;
	}

	usuarioDao.findById(req.body.amigoID)
		.then(receptor=>{
			return tokensDao.enviar(emisor,receptor,req.body.cantidad);
		})
		.then((data) => {
				res/* .status(200) */.send(data);
		})
		.catch((error) => {
				res.status(500).send(error.message);
		});
}

module.exports = tokensController;