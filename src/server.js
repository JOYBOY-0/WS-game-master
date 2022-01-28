const { Server } = require('boardgame.io/server');
const { WsGame } = require('./Game');

const port = process.env.PORT || 8000

const server = Server(
  {games: [WsGame],
  origins: [
    // Allow your game site to connect.
    'https://www.world-seekers.com/'
  ],
  });

server.run(8000, () => console.log('server running ' + port ));