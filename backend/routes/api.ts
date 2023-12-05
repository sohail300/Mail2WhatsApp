import express from "express";
import { Client } from "whatsapp-web.js";
import Imap from "imap";
import { inspect } from "util";
import dotenv from 'dotenv'

const route = express.Router();
dotenv.config();

const client = new Client({
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

const mailSecretKey=process.env.MAIL_SECRET_KEY;

route.get("/mail", (req, res) => {
    if(!mailSecretKey){
        throw new Error('MAIL_SECRET_KEY is undefined');
    }

    var imap = new Imap({
    user: "ekaksha2001@gmail.com",    
    password: 'techyguy05',
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    tlsOptions:{rejectUnauthorized:false}
  });

  function openInbox(cb: any) {
    imap.openBox("INBOX", true, cb);
  }

  imap.once("ready", function () {
    openInbox(function (err: any, box: any) {
      if (err) throw err;
      var f = imap.seq.fetch(box.messages.total + ":*", {
        bodies: ["HEADER.FIELDS (FROM)", "TEXT"],
      });
      f.on("message", function (msg, seqno) {
        console.log("Message #%d", seqno);
        var prefix = "(#" + seqno + ") ";
        msg.on("body", function (stream, info) {
          if (info.which === "TEXT")
            console.log(
              prefix + "Body [%s] found, %d total bytes",
              inspect(info.which),
              info.size
            );
          var buffer = "",
            count = 0;
          stream.on("data", function (chunk) {
            count += chunk.length;
            buffer += chunk.toString("utf8");
            if (info.which === "TEXT")
              console.log(
                prefix + "Body [%s] (%d/%d)",
                inspect(info.which),
                count,
                info.size
              );
          });
          stream.once("end", function () {
            if (info.which !== "TEXT")
              console.log(
                prefix + "Parsed header: %s",
                inspect(Imap.parseHeader(buffer))
              );
            else
              console.log(prefix + "Body [%s] Finished", inspect(info.which));
          });
        });
        msg.once("attributes", function (attrs) {
          console.log(prefix + "Attributes: %s", inspect(attrs, false, 8));
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

  imap.once("error", function (err: any) {
    console.log(err);
  });

  imap.once("end", function () {
    console.log("Connection ended");
  });

  imap.connect();
});

export default route;
