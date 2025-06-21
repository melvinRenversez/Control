import { WebSocketServer } from "ws";
import express from 'express';
import crypto, { verify } from "crypto"
import fs from "fs"
import { fileURLToPath } from 'url';
import path from "path"
import { log } from "console";

const JSPort = 8008
const WEBPort = 8000

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

            console.log("data :: ", data.type)

            if (data.type == "getUUID") {
                  getUUID(ws)
                  return
            }


            if (data.type == "connection") {
                  connection(ws, data.data)
                  return
            }

            if (data.type == "getSlaveDevices") {
                  getSlaveDevices(ws, data.data.UUID)
                  return;
            }


            if (data.type == "shutdown") {
                  shutdownDevice(data.data)
                  return
            }


      })


      ws.on('close', (code, reason, message) => {
            try {
                  console.log("DISCONNECTED // ", users.filter(user => user.ws == ws)[0].name)
            }
            catch (e) {
                  return
            }

            users = users.filter(user => user.ws !== ws)
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
                              console.log(user)
                              addUserInUsersList(ws, user.name, user.role, user.UUID)
                        } else {
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

      console.log("//", name, 'connected with role', role, 'with UUID', uuid);

      if (user.role == "undefined") {
            ws.send(JSON.stringify({
                  type: "connectedWithoutRole", data: {
                        name,
                        role
                  }
            }))
      } else {
            ws.send(JSON.stringify({
                  type: "connectedWithRole", data: {
                        name,
                        role
                  }
            }))
      }


      console.log("USERS /// ", users)
      console.log("nb:", users.length)

}


function getSlaveDevices(ws, uuid) {
      if (verifyUUIDRole(uuid, "master")) {

            let slaveDevices;

            slaveDevices = users.filter(user => user.role == "slave").map(user => ({
                  id: user.uuid,
                  name: user.name
            }))


            ws.send(JSON.stringify({
                  type: "getSlaveDevices",
                  data: {
                        slaveDevices
                  }
            }))

            return;

      }

      if (verifyUUIDRole(uuid, "super master")) {

            fs.readFile("users.json", "utf8", (err, data) => {
                  if (!err && data) {
                        try {
                              data = JSON.parse(data)
                              ws.send(JSON.stringify({
                                    type: "getSlaveDevices",
                                    data: {
                                          data
                                    }
                              }))
                        } catch (e) {
                              console.error("Erreur de parsing JSON, fichier réinitialisé.");
                        }
                  }
            });


            return;

      }
}






function verifyUUIDRole(uuid, role) {
      let uuidRole;
      uuidRole = users.filter(user => user.uuid == uuid)[0].role
      return uuidRole == role;
}






function shutdownDevice(data) {
      console.log("shutdown :: ", data)

      if (verifyUUIDRole(data.UUID, "master")) {
            let deviceWS;
            deviceWS = users.find(user => user.uuid == data.deviceUUID)

            console.log(deviceWS)

            if (deviceWS && deviceWS.ws && deviceWS.ws.readyState === 1) { // 1 = WebSocket.OPEN
                  deviceWS.ws.send(JSON.stringify({
                        type: "shutdown"
                  }));
                  console.log(`Shutdown envoyé à l'appareil ID ${data.deviceId}`);
            } else {
                  console.warn(`Appareil ID ${data.deviceId} introuvable ou déconnecté`);
            }

      }
}


























































// ----------------------------------------------------SERVER WEB--------------------------------------------------------------

app.get("/", (req, res) => {
      console.log('Connection web')
      res.sendFile(path.join(__dirname, 'index.html'));
})


app.listen(WEBPort, () => {
      console.log('Serveur WEB en ligne sur le port ', WEBPort);
});
