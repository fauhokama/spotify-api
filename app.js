const express = require("express"); // express -> Node web framework
const path = require("path"); // path: path to this dir to use html
const querystring = require("querystring"); // querystring: stringify -> json to string.
const fetch = require("node-fetch");

// Credentials:
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const scope = "playlist-read-private playlist-modify-private ";
const webApi = "https://api.spotify.com/v1/me/playlists";
const PORT = process.env.PORT || 5000;

// Express:
const app = express();

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/index.html"));
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
    const loadGenres = async () => {
        const token = await APIController._getToken(code);
        const playlist = await APIController._getPlaylist(token);
        return await playlist;
    }
    loadGenres().then((value) => {

        res.writeHead(200, {"Content-type": "text/plain"});
        for (const playlist of value.items) {
            res.write(playlist.name + "\n");
        }
        res.end();
    });
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
    },

    _getPlaylist: async function (token) {
        const result = await fetch(webApi, {
            method: 'GET',
            headers: {
                "Authorization": "Bearer " + token
            },
            redirect: 'follow'
        });

        const data = await result.json();
        return data;
    }

};

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));