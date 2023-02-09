const process = require("process")
const qrcode = require("qrcode-terminal");
const { Client } = require("whatsapp-web.js");
import { ChatGPTAPIBrowser } from 'chatgpt'

// Environment variables
require("dotenv").config()

// Prefix check
const prefixEnabled = process.env.PREFIX_ENABLED == "true"
const prefix = '/'

// Whatsapp Client
const client = new Client()

// ChatGPT Client
const api = new ChatGPTAPIBrowser({
    email: process.env.EMAIL,
    password: process.env.PASSWORD
    //apiKey: process.env.API_KEY
})

// Entrypoint
const start = async () => {
    // Ensure the API is properly authenticated
    try {
        await api.initSession()
    } catch (error: any) {
        console.error("[Whatsapp ChatGPT] Failed to authenticate with the ChatGPT API: " + error.message)
        process.exit(1)
    }

    // Whatsapp auth
    client.on("qr", (qr: string) => {
        console.log("[Whatsapp ChatGPT] Scan this QR code in whatsapp to log in:")
        qrcode.generate(qr, { small: true });
    })

    // Whatsapp ready
    client.on("ready", () => {
        console.log("[Whatsapp ChatGPT] Client is ready!");
    })

    // Whatsapp message
    client.on("message", async (message: any) => {
        if (message.body.length == 0) return
        if (message.from == "status@broadcast") return

        if (prefixEnabled) {
            if (message.body.startsWith(prefix)) {
                // Get the rest of the message
                const prompt = message.body.substring(prefix.length + 1);
                await handleMessage(message, prompt)
            }
        } else {
            await handleMessage(message, message.body)
        }
    })

    client.initialize()
}

const handleMessage = async (message: any, prompt: any) => {
    try {
        const start = Date.now()

        // Send the prompt to the API
        console.log("[Whatsapp ChatGPT] Received prompt from " + message.from + ": " + prompt)
        const response = await api.sendMessage(prompt)

        console.log(`[Whatsapp ChatGPT] Answer to ${message.from}: ${response.response}`)

        const end = Date.now() - start

        console.log("[Whatsapp ChatGPT] ChatGPT took " + end + "ms")

        // Send the response to the chat
        message.reply(response.response)
    } catch (error: any) {
        console.error("An error occured", error)
        message.reply("An error occured, please contact the administrator. (" + error.message + ")")
    }
}

start()

//store messages from last 24h and embed
// import low from 'lowdb';
// import FileSync from 'lowdb/adapters/FileSync';

// const adapter = new FileSync('db.json');
// const db = low(adapter);

// const handleMessage = async (message: any, prompt: any) => {
//   try {
//     const start = Date.now();

//     console.log(`[Whatsapp ChatGPT] Received prompt from ${message.from}: ${prompt}`);

//     // Add the prompt to the DB
//     db.get('messages')
//       .push({
//         from: message.from,
//         message: prompt,
//         timestamp: start,
//       })
//       .write();

//     // Send the prompt to the API
//     const response = await api.sendMessage(prompt);

//     console.log(`[Whatsapp ChatGPT] Answer to ${message.from}: ${response.response}`);

//     const end = Date.now() - start;
//     console.log(`[Whatsapp ChatGPT] ChatGPT took ${end}ms`);

//     // Add the response to the DB
//     db.get('messages')
//       .push({
//         from: 'ChatGPT',
//         message: response.response,
//         timestamp: end,
//       })
//       .write();

//     // Clean up old messages
//     const now = Date.now();
//     db.set(
//       'messages',
//       db
//         .get('messages')
//         .filter(m => now - m.timestamp <= 24 * 60 * 60 * 1000)
//         .value()
//     )
//       .write();

//     // Send the response to the chat
//     message.reply(response.response);
//   } catch (error) {
//     console.error('An error occured', error);
//     message.reply(`An error occured, please contact the administrator. (${error.message})`);
//   }
// };

// // Set default values for the DB
// db.defaults({ messages: [] }).write();
