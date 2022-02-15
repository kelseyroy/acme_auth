const Sequelize = require('sequelize');
const { STRING } = Sequelize;
const config = {
    logging: false
};
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")


if (process.env.LOGGING) {
    delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
    username: STRING,
    password: STRING
});

const Note = conn.define('note', {
    text: STRING,
})

Note.belongsTo(User);
User.hasMany(Note);

const secretSigningPhrase = process.env.AUTH_JWT_SECRET

User.byToken = async (token) => {
    try {
        const unscrambledToken = jwt.verify(token, secretSigningPhrase)
        const user = await User.findByPk(unscrambledToken.userId);
        if (user) {
            return user;
        }
        const error = Error('bad credentials');
        error.status = 401;
        throw error;
    }
    catch (ex) {
        const error = Error('bad credentials');
        error.status = 401;
        throw error;
    }
};

User.authenticate = async ({ username, password }) => {
    const user = await User.findOne({
        where: {
            username,
        }
    });
    if (!user) {
        const error = Error('bad credentials');
        error.status = 401;
        throw error;
    }

    const passwordsMatch = bcrypt.compareSync(password, user.password);

    if (passwordsMatch) {
        const newToken = jwt.sign({ userId: user.id }, secretSigningPhrase)
        return newToken;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
};

const syncAndSeed = async () => {
    await conn.sync({ force: true });
    const credentials = [
        { username: 'lucy', password: bcrypt.hashSync('lucy_pw', 10) },
        { username: 'moe', password: bcrypt.hashSync('moe_pw', 10) },
        { username: 'larry', password: bcrypt.hashSync('larry_pw', 10) }
    ];
    const notes = [
        { text: 'review redux' },
        { text: 'get a full 8 hours of sleep' },
        { text: 'go outside breathe some air, touch some grass' },
        { text: 'get groceries, and cook dinner (no more takeout)' }
    ];
    const [lucy, moe, larry] = await Promise.all(
        credentials.map(credential => User.create(credential))
    );
    const [redux, sleep, outside, groceries] = await Promise.all(notes.map(note => Note.create(note)))
    await lucy.setNotes([redux, groceries]);
    await moe.setNotes(outside);
    await larry.setNotes(sleep);

    return {
        users: {
            lucy,
            moe,
            larry
        },
        notes: {
            redux, 
            sleep, 
            outside, 
            groceries
        }
    };
};


module.exports = {
    syncAndSeed,
    models: {
        User,
        Note
    }
};
