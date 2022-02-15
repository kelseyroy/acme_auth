const express = require('express');
const app = express();
app.use(express.json());
const { models: { User, Note } } = require('./db');
const path = require('path');

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
    try {
        res.send({ token: await User.authenticate(req.body) });
    }
    catch (ex) {
        next(ex);
    }
});

app.get('/api/auth', async (req, res, next) => {
    try {
        res.send(await User.byToken(req.headers.authorization));
    }
    catch (ex) {
        next(ex);
    }
});

app.get('/api/users/:id/notes', async (req, res, next) => {
    try {
        // console.log(req.params.id)
        const auth = await axios.get("/api/auth", {
            headers: {
                authorization: token,
            },
        });
        if (req.params.id === auth.id) {
            const user = await User.findByPk(req.params.id, {
                include: {
                    model: Note
                }

            });
            res.json(user.notes);
        } else {
            throw(err);
            console.log("nope")
        }
        
    } catch (err) {
        next(err)
    }
});

app.use((err, req, res, next) => {
    console.log(err);
    res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;