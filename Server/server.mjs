import { WebSocketServer } from "ws";
import crypto from "crypto"
import { cursorTo } from "readline";
import { use } from "react";

const wss = new WebSocketServer({ port: 9876 })


let users = []

wss.on("connection", (ws) => {
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
            } else if (data.type == "connection"){
                  connection(ws)
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
            name: undefined,
            ws: ws,
            role: undefined,
            UUID: UUID 
      }

      console.log(user)

      users.push(user)

      ws.send(JSON.stringify({ type: "newConnected", UUID: UUID }))

      console.log("_______________________________________")

      console.log(users)

}

function connection(ws){
      console.log("CONNECTION")
      ws.send(JSON.stringify({ type: "connected" }))

      console.log(users)

}