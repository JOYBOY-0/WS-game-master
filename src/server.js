const { Server } = require('boardgame.io/server');
const { WsGame } = require('./Game');

const port = process.env.PORT || 8000

const server = Server(
  {games: [WsGame],
  origins: ['https://www.world-seekers.com'] });

server.run(8000, () => console.log('server running ' + port ));