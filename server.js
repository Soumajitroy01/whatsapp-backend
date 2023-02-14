//imports
import express from "express";
import mongoose from "mongoose";
import Pusher from "pusher";
import Messages from "./dbMessages.js";
import cors from "cors";

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1554367",
    key: "d27c9845c432e692e457",
    secret: "509ed5a9ea8e0e9c1490",
    cluster: "mt1",
    useTLS: true
});

// middlewares
app.use(express.json());
app.use(cors());

// db config
const connection_url = "mongodb+srv://admin:Babi2003@cluster0.wvjvpgs.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.set('strictQuery', true);
mongoose.connect(connection_url);

const db = mongoose.connection;

db.once('open', () => {
    console.log('DB is connected');

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log("A Change occured", change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;

            pusher.trigger("messages", "inserted",
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    recieved: messageDetails.recieved
                }
            );
        } else {
            console.log('Error triggering Pusher');
        }

    });
});

// api routes
app.get("/", (req, res) => res.status(200).send("Hello World!!"));

app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});


// listeners
app.listen(port, console.log(`Listening on localhost:${port}`));