const express = require("express");
const path = require("path");
const querystring = require("querystring"); // querystring: stringify -> json to string.
const fetch = require("node-fetch");

// Credentials:
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const scope = "playlist-read-private";
const PORT = process.env.PORT || 5000;


const app = express();
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/github", (req, res) => {
    res.redirect('https://github.com/fauhokama/spotify-api');
});


app.get("/login", (req, res) => {
    res.redirect(
        "https://accounts.spotify.com/authorize?" +
        querystring.stringify({
            response_type: "code",
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
        })
    );
});

app.get("/callback", (req, res) => {
    const code = req.query.code;


    const _sendTokenToBrowser = async () => {
        const token = await APIController._getToken(code);
        res.redirect('/#' +
            querystring.stringify({
                access_token: token,
            }));
    }
    _sendTokenToBrowser();
});

const APIController = {

    _getToken: async function (code) {
        const b64 = Buffer.from(client_id + ":" + client_secret).toString("base64");

        const urlencoded = new URLSearchParams();
        urlencoded.append("grant_type", "authorization_code");
        urlencoded.append("code", code);
        urlencoded.append("redirect_uri", redirect_uri);

        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + b64,
            },
            body: urlencoded,
            redirect: "follow",
        });
        
        const data = await result.json();
        return data.access_token;
    }
};

app.listen(PORT, () => console.log(`Listening on ${PORT}`));