import WebSocket from "ws";
import fs from "fs";

import { exec } from 'child_process';

let ws;
let connected = false;
let reconnectInterval = 3000; // 10 secondes

let UUID = "";
let myID;

fs.readFile("UUID.uuid", "utf8", (err, data) => {
      if (err) {
            console.error("Erreur lors de la lecture du fichier :", err);
            return;
      }
      UUID = data.toString().trim();
      console.log(UUID);
})

function connect() {
      ws = new WebSocket("ws://192.168.0.17:9876");

      ws.on("open", () => {
            console.log("Connexion ouverte");
            connected = false; // on réinitialise à chaque nouvelle ouverture

            const intervalID = setInterval(() => {
                  if (!connected) {
                        console.log("Tentative de connexion...");
                        if (ws.readyState === WebSocket.OPEN) {
                              if (UUID.length > 0) {
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
                        clearInterval(intervalID);
                  }
            }, 5000);
      });

      ws.on("message", (data) => {

            data = JSON.parse(data)

            console.log(data)

            if (data.type == "newConnected") {
                  connected = true;
                  console.log("Connexion établie avec ID:", data.UUID);
                  writeUUID(data.UUID)
                  UUID = data.UUID
                  myID = data.id
                  console.log("myid : ", myID)
                  return;
            }

            if (data.type == "connectedWithRole") {
                  connected = true
                  console.log("En attente d ordre")
                  myID = data.id
                  console.log("myid : ", myID)
                  return;
            }

            if (data.type == "shutdown"){
                  shutdownPC()
            }

            connected = true
            console.log("En attente D acceptation pour avoir un role")

      });

      ws.on("close", () => {
            console.log("Connexion fermée, nouvelle tentative dans 10 secondes...");
            connected = false;
            setTimeout(connect, reconnectInterval);
      });

      ws.on("error", (error) => {
            console.error("Erreur WebSocket:", error);
            // En cas d'erreur, on ferme la connexion pour déclencher la reconnexion
            ws.close("zzzzzzzzzzzzzzzzzzzzzzzzzzz");
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


function shutdownPC() {
  const platform = process.platform;

  let shutdownCommand;

  if (platform === 'win32') {
    // Windows : arrêt immédiat
    shutdownCommand = 'shutdown /s /t 0';
  } else if (platform === 'linux' || platform === 'darwin') {
    // Linux ou macOS : arrêt immédiat (nécessite souvent sudo)
    shutdownCommand = 'shutdown -h now';
  } else {
    console.error('Système d’exploitation non supporté pour l’arrêt automatique');
    return;
  }

  exec(shutdownCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors de l’arrêt : ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erreur (stderr) : ${stderr}`);
      return;
    }
    console.log('Commande d’arrêt envoyée avec succès.');
  });
}



connect();
