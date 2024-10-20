import express from "express";
import dotenv from "dotenv";
import dns from "dns";
import mongoose from "mongoose";
const __dirname = import.meta.dirname;

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((res) => console.log("connected"))
  .catch((err) => {
    console.error(err);
  });

const Schema = mongoose.Schema;
const shortURLSchema = new Schema({
  url: String,
  shorthand: Number,
});

const ShortURL = mongoose.model("ShortURL", shortURLSchema);

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/add-url", (req, res) => {
  dns.lookup(req.body.url, async (err) => {
    if (err && !/^https?:\/\//.test(req.body.url)) {
      res.json({ error: "Invalid URL" });
      return;
    }

    if (/^https?:\/\//.test(req.body.url)) {
      try {
        await fetch(req.body.url, { method: "HEAD" });
      } catch (err) {
        console.log("invalid http url");
        res.json({ error: "Invalid URL" });
        return;
      }
    }

    ShortURL.findOne()
      .sort({ shorthand: -1 })
      .then((last_entry) => {
        const shortURL = new ShortURL({
          url: req.body.url,
          shorthand: last_entry ? last_entry.shorthand + 1 : 1,
        });
        shortURL
          .save()
          .then((doc) => {
            console.log("saved document");
            res.json({ url: doc.url, shorthand: doc.shorthand });
          })
          .catch((err) => console.error(err));
      });
  });
});

app.get("/shorthands", (req, res) => {
  ShortURL.find({}, { _id: 0, __v: 0 })
    .then((shortURLs) => {
      res.json(shortURLs);
    })
    .catch((err) => console.log(err));
});

app.get("/shorturl/:shorthand", (req, res) => {
  ShortURL.findOne({ shorthand: Number(req.params.shorthand) })
    .then((shortURL) => {
      if (shortURL) {
        const redirectUrl =
          !shortURL.url.startsWith("http://") &&
          !shortURL.url.startsWith("https://")
            ? "http://" + shortURL.url
            : shortURL.url;
        res.redirect(redirectUrl);
      } else res.send("Shorthand is not defined");
    })
    .catch((err) => console.log(err));
});

app.listen(PORT);
console.log(`Server is listening to port ${PORT}`);
