const { Server, Origins } = require('boardgame.io/server');
const { WsGame } = require('./Game');

const port = process.env.PORT || 8000

const server = Server({
  games: [WsGame],
  origins: [
    // Allow your game site to connect.
    'https://www.world-seekers.com',
    // Allow localhost to connect, except when NODE_ENV is 'production'.
    Origins.LOCALHOST_IN_DEVELOPMENT
  ],
});

server.run(8000, () => console.log('server running ' + port ));