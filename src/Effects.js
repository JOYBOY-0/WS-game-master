const effectsLibrary = {
    draw : (G, ctx, player, params = [1]) => {

        let playerID = 'player_' + player;
        let currentPlayer = G[playerID];

        for (let i=0; i < params[0]; i++){
            if (currentPlayer.deck.length > 0){
            const card = currentPlayer.deck.pop();
            currentPlayer.hand.push(card) }
        }
    },
    discard : (G, ctx, player, idx) => {

    },
    discardRandomAlly : (G, ctx, player) => {
        let playerID = 'player_' + player;
        let currentPlayer = G[playerID];

        if (currentPlayer.hand.length > 0){
            let rand = ctx.random.Die(currentPlayer.hand.length)
            let card = currentPlayer.hand[rand - 1]
            currentPlayer.hand.splice(rand - 1, 1);
            G.graveyard[playerID].push(card);
        }
        
    },
    discardRandom : (G, ctx, player) => {
        let enemy;
        player === '0' ? enemy = 'player_1' : enemy = 'player_0';
        let currentPlayer = G[enemy];

        if (currentPlayer.hand.length > 0){
            let rand = ctx.random.Die(currentPlayer.hand.length)
            let card = currentPlayer.hand[rand - 1]
            currentPlayer.hand.splice(rand - 1, 1);
            G.graveyard[enemy].push(card);
        }
        
    },

    destroy : (G, ctx, targetOwner, target) => {
        let card = G.slots[targetOwner][target];
        G.slots[targetOwner][target] = null;
        ctx.effects.destroyAnim({player: targetOwner, idx: target});
        G.graveyard[targetOwner].push(card)
    },
    revive: (G, ctx, player, idx) => {

    },

}

export {effectsLibrary}