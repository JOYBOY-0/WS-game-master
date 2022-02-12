import { current } from 'immer';

const effectsLibrary = {
    //facility updates hand

    updateHand : (G, ctx) => ctx.effects.updateHand({
        player_0: current(G.player_0.hand),
        player_1: current(G.player_1.hand),
    }),

    draw : (G, ctx, player, params = [1]) => {

        for (let i=0; i < params[0]; i++){
            if (G[player].deck.length > 0){
                const card = G[player].deck.pop();
                G[player].hand.push(card) 
                effectsLibrary.updateHand(G,ctx);
                ctx.effects.draw({player: player})
            }
        }
    },

    discard : (G, ctx, player, idx) => {

    },

    summonToken : (G, ctx, player, params) => {
        for (let i=0; i < params[1]; i++){
            for (let x=0; x < 4; x++){
                if(G.slots[player][x] === null){
                    G.slots[player][x] = params[0]
                    G.slots[player][x].summoned = ctx.turn
                    ctx.effects.summonAnim({player: player, idx: x})
                    break;
                }
            }
        }
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
        player === 'player_0' ? enemy = 'player_1' : enemy = 'player_0';
        let currentPlayer = G[enemy];

        if (currentPlayer.hand.length > 0){
            let rand = ctx.random.Die(currentPlayer.hand.length)
            let card = currentPlayer.hand[rand - 1]
            currentPlayer.hand.splice(rand - 1, 1);
            G.graveyard[enemy].push(card);
        }
    },

    destroyEff : (G, ctx, player, params, index) => {
        let enemy;
        player === 'player_0' ? enemy = 'player_1' : enemy = 'player_0';
        effectsLibrary.destroy(G, ctx, enemy, index)
    },

    destroy : (G, ctx, targetOwner, target) => {
        let card = G.slots[targetOwner][target];
        if (card !== null){
            G.slots[targetOwner][target] = null;
            ctx.effects.destroyAnim({player: targetOwner, idx: target});
            G.graveyard[targetOwner].push(card)

            if (card.effect !== undefined && card.effect.trigger === 'destroy') {
                    effectsLibrary[card.effect.effect](
                        G,
                        ctx,
                        targetOwner,
                        card.effect.params
                    );
                    ctx.effects.effectActivateGY({player: targetOwner})
            }
        }
    },
    revive: (G, ctx, player, idx) => {

    },

}

export {effectsLibrary}