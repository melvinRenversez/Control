import WebSocket from "ws";
import fs from "fs";

let ws;
let connected = false;
let reconnectInterval = 3000; // 10 secondes

let UUID = "";

fs.readFile("UUID.uuid", "utf8", (err, data) => {
      if (err) {
            console.error("Erreur lors de la lecture du fichier :", err);
            return;
      }
      UUID = data.toString().trim();
      console.log(UUID);
})

console.log(UUID)

function connect() {
      ws = new WebSocket("ws://localhost:9876");

      ws.on("open", () => {
            console.log("Connexion ouverte");
            connected = false; // on réinitialise à chaque nouvelle ouverture

            const intervalID = setInterval(() => {
                  if (!connected) {
                        console.log("Tentative de connexion...");
                        if (ws.readyState === WebSocket.OPEN) {
                              console.log("in")
                              if (UUID.length > 0) {
                                    console.log("UUID existe deja")
                                    ws.send(
                                          JSON.stringify({
                                                type: "connection",
                                                data: { UUID: UUID },
                                          })
                                    );
                              } else {
                                    ws.send(
                                          JSON.stringify({
                                                type: "getUUID"
                                          })
                                    );
                              }
                        }
                  } else {
                        console.log("clear interval")
                        clearInterval(intervalID);
                  }
            }, 5000);
      });

      ws.on("message", (data) => {

            data = JSON.parse(data)
            console.log("Réponse serveur:", data);
            console.log("Réponse serveur:", data.status);

            if (data.type == "newConnected") {
                  connected = true;
                  console.log("Connexion établie avec ID:", data.UUID);
                  writeUUID(data.UUID)
                  UUID = data.UUID
            }else if (data.type == "connected"){
                  console.log("connected sans nex IS")
                  connected = true
            }

      });

      ws.on("close", () => {
            console.log("Connexion fermée, nouvelle tentative dans 10 secondes...");
            connected = false;
            setTimeout(connect, reconnectInterval);
      });

      ws.on("error", (error) => {
            console.error("Erreur WebSocket:", error);
            // En cas d'erreur, on ferme la connexion pour déclencher la reconnexion
            ws.close();
      });
}


function writeUUID(UUID) {
      fs.writeFile('UUID.uuid', UUID, (err) => {
            if (err) {
                  console.error('Erreur lors de l\'écriture du fichier:', err);
            } else {
                  console.log('UUID écrit dans UUID.txt');
            }
      });
      // Démarre la connexion la première fois
}
connect();
