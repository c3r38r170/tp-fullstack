// Use Express
var express = require("express");
// Use body-parser
var bodyParser = require("body-parser");
var cors = require("cors");
var session = require('express-session');

const usuarioDao = require('./dao/usuario');

// Create new instance of the express server
var app = express();

app.use(session({
    secret: 'sobambalauea',
    resave:true,
    saveUninitialized: false
}));

// Define the JSON parser as a default way 
// to consume and produce data through the 
// exposed APIs
app.use(bodyParser.json());
// TODO ver si esto es necesario para asociar permisos.
app.use(bodyParser.urlencoded({ extended: true }));

// Create link to Angular build directory
// The `ng build` command will save the result
// under the `dist` folder.
var distDir = __dirname + "/dist/";
app.use(express.static(distDir));

var corsOptions = {
    origin: true,
    credentials: true
};
app.use(cors(corsOptions));

app.use((req,res,next) => {
    // TODO Feature: Restringir verbo tambien (? ver si no es mejor hacerlo en cada uno... más que nada en api/usuarios)  sería agregar otro if

    if([
        '/api/usuarios' // Registro.
        ,'/api/usuarios/ingresar'
        ,'/api/usuarios/salir'
        // ,'/api/permisos' // * No porque pensemos que solo se podrían ver los permisos que tiene cada uno, no el resto. Alguien sin loguear no puede verlos.
    ].includes(req.path))
        next();
    else{
        if(!req.session.usuarioID){
            res.status(401).send('Inicie sesión.');
        }else{
            usuarioDao.findById(req.session.usuarioID,{incluirHabilitado:true})
                .then(usuario=>{
                    if(!usuario){
                        res.status(404).send('Sesión inválida.');
                        return;
                    }

                    if(usuario.habilitado){
                        req.session.usuario=usuario;
                        next();
                    }else res.status(403).send('Su cuenta ha sido deshabilitada.');
                    // TODO Feature log out
                })
                .catch(error=>res.status(500).send(error.message));
        }
    }
})

app.use('/api',require('./rutas/todas'))

// Init the server
var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

/*  "/api/status"
 *   GET: Get server status
 *   PS: it's just an example, not mandatory
 */
/*app.get("/api/status", function (req, res) {
    res.status(200).json({ status: "UP" });
});*/
