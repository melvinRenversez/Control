import { WebSocketServer } from "ws";
import crypto from "crypto"
import fs from "fs"

const wss = new WebSocketServer({ port: 9876 })


let users = []

wss.on("connection", (ws, req) => {
      const ip = req.socket.remoteAddress;
      console.log("Client connecté depuis l'IP :", ip);
      ws.on("message", (message) => {
            console.log(JSON.parse(message))
            let data;
            try {
                  data = JSON.parse(message)
            } catch {
                  ws.send("Erreur : message JSON invalid")
                  return
            }

            console.log(data.type)

            if (data.type == "getUUID") {
                  getUUID(ws)
            } else if (data.type == "connection") {
                  connection(ws, data.data)
            } else {
                  ws.send("command invalid")
            }

      })
})

function getUUID(ws) {
      console.log("_______________________________________")

      console.log(ws)

      const UUID = crypto.randomUUID();
      console.log(UUID)


      const user = {
            name: "undefined",
            role: "undefined",
            UUID: UUID
      }

      writeNewUser(user)

      user.ws = ws

      console.log(user)

      users.push(user)

      ws.send(JSON.stringify({ type: "newConnected", UUID: UUID }))

      console.log("_______________________________________")


      console.log(users)
      console.log(users.length)

}

function connection(ws, conData) {

      console.log("CONNECTION")


      let lastUsers = []


      fs.readFile("users.json", "utf8", (err, data) => {
            if (!err && data) {
                  try {
                        const users = JSON.parse(data); // convertir la chaîne en tableau d’objets

                        const user = users.find(u => u.UUID === conData.UUID);

                        if (user) {
                              console.log("Utilisateur trouvé :", user);
                        } else {
                              console.log("Utilisateur non trouvé.");
                        }
                  } catch (e) {
                        console.error("Erreur de parsing JSON :", e);
                  }
            } else {
                  console.error("Erreur de lecture :", err);
            }
      })

      ws.send(JSON.stringify({ type: "connected" }))

      console.log(users)

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