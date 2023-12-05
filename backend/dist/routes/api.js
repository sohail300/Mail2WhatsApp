"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const whatsapp_web_js_1 = require("whatsapp-web.js");
const imap_1 = __importDefault(require("imap"));
const util_1 = require("util");
const dotenv_1 = __importDefault(require("dotenv"));
const route = express_1.default.Router();
dotenv_1.default.config();
const client = new whatsapp_web_js_1.Client({
    puppeteer: {
        args: ["--no-sandbox"],
    },
});
route.get("/qr", (req, res) => {
    client.on("qr", (qr) => {
        console.log("QR RECEIVED", qr);
        console.log("finished");
        return res.status(200).send(qr);
    });
    client.on("ready", () => {
        console.log("Client is ready!");
    });
    client.initialize();
});
const mailSecretKey = process.env.MAIL_SECRET_KEY;
route.get("/mail", (req, res) => {
    if (!mailSecretKey) {
        throw new Error('MAIL_SECRET_KEY is undefined');
    }
    var imap = new imap_1.default({
        user: "ekaksha2001@gmail.com",
        password: 'techyguy05',
        host: "imap.gmail.com",
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
    });
    function openInbox(cb) {
        imap.openBox("INBOX", true, cb);
    }
    imap.once("ready", function () {
        openInbox(function (err, box) {
            if (err)
                throw err;
            var f = imap.seq.fetch(box.messages.total + ":*", {
                bodies: ["HEADER.FIELDS (FROM)", "TEXT"],
            });
            f.on("message", function (msg, seqno) {
                console.log("Message #%d", seqno);
                var prefix = "(#" + seqno + ") ";
                msg.on("body", function (stream, info) {
                    if (info.which === "TEXT")
                        console.log(prefix + "Body [%s] found, %d total bytes", (0, util_1.inspect)(info.which), info.size);
                    var buffer = "", count = 0;
                    stream.on("data", function (chunk) {
                        count += chunk.length;
                        buffer += chunk.toString("utf8");
                        if (info.which === "TEXT")
                            console.log(prefix + "Body [%s] (%d/%d)", (0, util_1.inspect)(info.which), count, info.size);
                    });
                    stream.once("end", function () {
                        if (info.which !== "TEXT")
                            console.log(prefix + "Parsed header: %s", (0, util_1.inspect)(imap_1.default.parseHeader(buffer)));
                        else
                            console.log(prefix + "Body [%s] Finished", (0, util_1.inspect)(info.which));
                    });
                });
                msg.once("attributes", function (attrs) {
                    console.log(prefix + "Attributes: %s", (0, util_1.inspect)(attrs, false, 8));
                });
                msg.once("end", function () {
                    console.log(prefix + "Finished");
                });
            });
            f.once("error", function (err) {
                console.log("Fetch error: " + err);
            });
            f.once("end", function () {
                console.log("Done fetching all messages!");
                imap.end();
            });
        });
    });
    imap.once("error", function (err) {
        console.log(err);
    });
    imap.once("end", function () {
        console.log("Connection ended");
    });
    imap.connect();
});
exports.default = route;
