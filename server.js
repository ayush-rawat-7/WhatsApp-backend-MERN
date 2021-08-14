import express from "express";
import mongoose from "mongoose";
import Pusher from "pusher"
import Messages from "./dbMessages.js"

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1250097",
    key: "ac776a713111e6b7b924",
    secret: "6c4ae60995cbd0336f25",
    cluster: "mt1",
    useTLS: true
});

// middlewares
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
})


// DB config
const connectUrl = 'mongodb+srv://ayush:ayush1rawat7@cluster0.6jvei.mongodb.net/whatsappDB?retryWrites=true&w=majority'
mongoose.connect(connectUrl, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connection Successful")
}).catch(err => console.error(err));

const db = mongoose.connection;
db.once('open', () => {
    console.log("DB is Connected");
    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);
        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    recieved: messageDetails.recieved,
                });
        } else {
            console.log("Error triggering pusher");
        }
    })
})

// ????


// api routes
app.get('/', (req, res) => {
    res.status(200).send("Hello World")
})
app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;
    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    })
})
app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data)
        }
    })
})


// listener
app.listen(port, (req, res) => {
    console.log(`Server running on localhost:${port}`)
})