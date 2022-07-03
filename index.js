const { Client, Intents } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES] });
const db = require('mongoose');
const { mongoUri, token } = require('./config.json');
const uuid = require('uuid');

// Connecting to DB
main().catch(err => console.log(err));

async function main() {
  await db.connect(mongoUri);
  console.log(`Connected to DB!`);
}

// Schemas
const userSchema = new db.Schema({ 
    UUID: String,
    UserID: Number,
    Nickname: String,
    Guilds: String,
    LastUpdated: Number,
});
const Users = db.model('User', userSchema);
const blacklisteduserSchema = new db.Schema({
    UUID: String,
    UserID: Number,
    Nickname: String,
    Guilds: String,
    BlacklistedByGuildId: Number,
    LastUpdated: Number,
});
const BlacklistedUsers = db.model('blacklistedUser', blacklisteduserSchema);
// Code

client.on('guildMemberAdd', async (member) => {
    try {
        const isUserLogged = await Users.findOne({ UserID: member.id });
        if (isUserLogged != null) {
            // Found
            function isUserLoggedUnderCurrentGuild() {
                await Users.findOne({ UserID: member.id }, function(err, user) {
                    if (err) {
                        console.log(err);
                        return false;
                    }
                    if (user) {
                        console.log(user["Guilds"]);
                        if (toString(user["Guilds"]).match(`${member.guild.id}`)) {
                            return true;
                        } else {
                            return false;
                        }
                        
                    }
                });
            }
            if (isUserLoggedUnderCurrentGuild()) {
                // User is logged under current guild
                return;
            } else {
                // User is not logged under current guild
                await Users.findOne({ UserID: member.id }, function(err, user){
                    if (err) return console.log(err);
                    if (user) {
                        const currentGuilds = toString(user["Guilds"]).split(", ");
                        currentGuilds.push(`${member.guild.id}`);
                        const newGuilds = currentGuilds.join(`, `);
                        return await Users.findOneAndUpdate({ UserID: member.id }, { Guilds: newGuilds });
                    }
                });
            }

        } else {
            // Did not find
            const addUser = new Users({ UUID: `${uuid.v4()}`, UserID: member.id, Nickname: `${member.nickname}`, Guilds: `${member.guild.id}`, LastUpdated: new Date().getUTCMinutes()});
            await addUser.save();
        }
    } catch (err) {
        console.log(err);
    }
    

});
client.on('guildCreate', async (guild) => {
    try {
        guild.members.cache.forEach(function(member,key,map) {
            const isUserLogged = await Users.findOne({ UserID: member.id });
            if (isUserLogged != null) {
                // Found
                function isUserLoggedUnderCurrentGuild() {
                    await Users.findOne({ UserID: member.id }, function(err, user) {
                        if (err) {
                            console.log(err);
                            return false;
                        }
                        if (user) {
                            console.log(user["Guilds"]);
                            if (toString(user["Guilds"]).match(`${member.guild.id}`)) {
                                return true;
                            } else {
                                return false;
                            }
                            
                        }
                    });
                }
                if (isUserLoggedUnderCurrentGuild()) {
                    // User is logged under current guild
                    return;
                } else {
                    // User is not logged under current guild
                    await Users.findOne({ UserID: member.id }, function(err, user){
                        if (err) return console.log(err);
                        if (user) {
                            const currentGuilds = toString(user["Guilds"]).split(", ");
                            currentGuilds.push(`${member.guild.id}`);
                            const newGuilds = currentGuilds.join(`, `);
                            return await Users.findOneAndUpdate({ UserID: member.id }, { Guilds: newGuilds });
                        }
                    });
                }
    
            } else {
                // Did not find
                const addUser = new Users({ UUID: `${uuid.v4()}`, UserID: member.id, Nickname: `${member.nickname}`, Guilds: `${member.guild.id}`, LastUpdated: new Date().getUTCMinutes()});
                await addUser.save();
            }
        });
    } catch (err) {
        console.log(err);
    }
});

client.once('ready', () => {
    console.log(`Online as ${client.user.tag}`);
});

client.login(token);