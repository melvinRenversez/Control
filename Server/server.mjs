import { WebSocketServer } from "ws";
import express from 'express';
import crypto, { verify } from "crypto"
import fs from "fs"
import { fileURLToPath } from 'url';
import path from "path"

const JSPort = 9876
const WEBPort = 3000

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const wss = new WebSocketServer({ port: JSPort })
console.log('SERVER JS en ligne sur le port', JSPort)



const app = express()
app.use(express.static(path.join(__dirname, 'public')));




let users = []


// setInterval(() => {
//       console.log("USERS /// ", users)
//       console.log("nb:", users.length)
// }, 10000);


// -----------------------------------------------------CODE---------------------------------

wss.on("connection", (ws, req) => {
      const ip = req.socket.remoteAddress;
      // console.log("Client connecté depuis l'IP :", ip);
      ws.on("message", (message) => {
            let data;
            try {
                  data = JSON.parse(message)
            } catch {
                  ws.send("Erreur : message JSON invalid")
                  return
            }

            console.log("data :: " , data.type)

            if (data.type == "getUUID") {
                  getUUID(ws)
                  return
            } 
            
            
            if (data.type == "connection") {
                  connection(ws, data.data)
                  return
            } 

            if (data.type == "getSlaveDevices"){
                  getSlaveDevices(data.data.UUID)
            }

      })


      ws.on('close', (code, reason) => {
            console.log(`Connexion fermée [${code}] ${reason}`);
      })
})

function getUUID(ws) {

      const UUID = crypto.randomUUID()

      const user = {
            name: "undefined",
            role: "undefined",
            UUID: UUID
      }

      writeNewUser(user)

      user.ws = ws

      users.push(user)

      ws.send(JSON.stringify({ type: "newConnected", UUID: UUID }))


}

function connection(ws, conData) {

      fs.readFile("users.json", "utf8", (err, data) => {
            if (!err && data) {
                  try {
                        const users = JSON.parse(data); // convertir la chaîne en tableau d’objets

                        const user = users.find(u => u.UUID === conData.UUID);

                        if (user) {
                              console.log("users", user.role)
                              addUserInUsersList(ws, user.name, user.role, user.UUID)
                        } else {
                              console.log("Utilisateur non trouvé.");
                              getUUID(ws)
                        }
                  } catch (e) {
                        console.error("Erreur de parsing JSON :", e);
                  }
            } else {
                  console.error("Erreur de lecture :", err);
            }
      })

}


function writeNewUser(user) {
      fs.readFile("users.json", "utf8", (err, data) => {
            let lastUsers = [];

            if (!err && data) {
                  try {
                        lastUsers = JSON.parse(data); // Parse les anciens utilisateurs
                        if (!Array.isArray(lastUsers)) lastusers = [];
                  } catch (e) {
                        console.error("Erreur de parsing JSON, fichier réinitialisé.");
                  }
            }

            delete user.ws

            lastUsers.push(user); // Ajoute le nouveau user

            fs.writeFile("users.json", JSON.stringify(lastUsers, null, 2), (err) => {
                  if (err) {
                        console.error("Erreur lors de l'écriture du fichier:", err);
                  } else {
                        console.log("Utilisateur ajouté à users.json");
                  }
            });
      });
}


function addUserInUsersList(ws, name, role, uuid) {


      let user;


      user = {
            ws: ws,
            name: name,
            role: role,
            uuid: uuid
      }

      users.push(user)

      console.log(name, 'connected with role', role, 'with UUID', uuid);

      if (user.role == "undefined") {
            ws.send(JSON.stringify({ type: "connectedWithoutRole"}))
      } else {
            ws.send(JSON.stringify({ type: "connectedWithRole"}))
      }

}


function getSlaveDevices(uuid){
      if (verifyUUIDRole(uuid, "master")){
            console.log("autorise")

            let slaveDevice;

            slaveDevice = users.filter(user => user.role == "slave")

            console.log(slaveDevice)

      }else{
            console.log("non autorise")
      }
}






function verifyUUIDRole(uuid, role){
      let uuidRole;
      uuidRole = users.filter(user => user.uuid == uuid)[0].role
      return uuidRole == role;
}

































































// ----------------------------------------------------SERVER WEB--------------------------------------------------------------

app.get("/", (req, res) => {
      console.log('Connection web')
      res.send("BIENVENUE")
})


app.listen(WEBPort, () => {
      console.log('Serveur WEB en ligne sur le port ', WEBPort);
});
