import { INVALID_MOVE } from 'boardgame.io/core';
import { deck } from "./deck";
import { EffectsPlugin } from 'bgio-effects/plugin';
import { config } from './plugins/effects-config';
import { effectsLibrary } from './functions/Effects'

export const WsGame = {

    setup: prepareGame,

    plugins: [EffectsPlugin(config)],

    moves: {
        summon: summon,
        setBattle: setBattle,
        battle: battle
    },

    turn: {
        onBegin: (G, ctx) => {
            G.player_0.deck = ctx.random.Shuffle(G.player_0.deck);
            G.player_1.deck = ctx.random.Shuffle(G.player_1.deck);

            if (ctx.turn === 1){
            for(let i=0; i<4; i++){ 
                effectsLibrary.draw(G, ctx, 0); 
                effectsLibrary.draw(G, ctx, 1); } 
            } 
            if (ctx.turn > 1){ draw(G, ctx, ctx.currentPlayer) }
        },
    },

    phases: {
        drawPhase: {
            moves: {draw}
        },
        playPhase: {
            start: true,
            moves: { summon, setBattle, battle},
        },
        battle: {
            moves: {battle},
            onBegin: (G, ctx) => battle(G, ctx)
        }
    },

    events: {
        endGame: false,
        endTurn: true,

    },
  
    minPlayers: 2,
    maxPlayers: 2,

    disableUndo: true,
    
}

function prepareGame() {
    return{
        player_0 : {
            deck: deck, 
            hand: [], 
            selected: { card: null, idx: null }
        },
        player_1 : {
            deck: deck, 
            hand: [], 
            selected: {card: null, idx: null }
        },
        slots: {
            player_0: Array(4).fill(null),
            player_1: Array(4).fill(null)
        },
        graveyard: {
            player_0: [],
            player_1: []
        },
        HP: {
            player_0: 100,
            player_1: 100
        }

    }

}

function draw (G, ctx, player) {
    let playerID = 'player_' + player;
    let currentPlayer = G[playerID];
    if (currentPlayer.deck.length > 0){
    const card = currentPlayer.deck.pop();
    currentPlayer.hand.push(card) }
}

function summon (G, ctx, index, slot) {

    let playerID = 'player_' + ctx.currentPlayer;
    let currentPlayer = G[playerID];
    const card = currentPlayer.hand[index];

    if (card !== null
    && Number(card.stats.rank) < 1
    && G.slots[playerID][slot] === null){

        currentPlayer.hand.splice(index, 1);
        G.slots[playerID][slot] = card;
        G.slots[playerID][slot].summoned = ctx.turn

        if (card.effect !== undefined && card.effect.trigger === 'summon') {
            effectsLibrary[card.effect.effect](
                G, 
                ctx,   
                ctx.currentPlayer,
                card.effect.params
            )
        }
    } else if (card !== null
        && Number(card.stats.rank) === 1
        && Number(G.slots[playerID][slot].stats.rank) === 0
        && G.slots[playerID][slot].summoned < ctx.turn){
            
            let sacrifice = G.slots[playerID][slot]
            currentPlayer.hand.splice(index, 1);
            G.slots[playerID][slot] = card;
            G.slots[playerID][slot].summoned = ctx.turn
            G.graveyard[playerID].push(sacrifice);

            if (card.effect !== undefined && card.effect.trigger === 'summon') {
                effectsLibrary[card.effect.effect](
                    G, 
                    ctx,   
                    ctx.currentPlayer,
                    card.effect.params
                )
            }
    }    
    
    else if (card !== null
        && Number(card.stats.rank) === 2
        && Number(G.slots[playerID][slot].stats.rank) >= 1
        && G.slots[playerID][slot].summoned < ctx.turn){

            let sacrifice = G.slots[playerID][slot]
            currentPlayer.hand.splice(index, 1);
            G.slots[playerID][slot] = card;
            G.slots[playerID][slot].summoned = ctx.turn
            G.graveyard[playerID].push(sacrifice);

            if (card.effect !== undefined && card.effect.trigger === 'summon') {
                effectsLibrary[card.effect.effect](
                    G, 
                    ctx,   
                    ctx.currentPlayer,
                    card.effect.params
                )
            }

    } else { return INVALID_MOVE}
}

function setBattle (G, ctx) {
    ctx.events.setPhase('battle');
}

const objetiveOwner = obj => obj === 'player_0' ? 'player_1' : 'player_0'

function attack (G, ctx, player, idx1, idx2){
    let attack = Number(G.slots[player][idx1].stats.attack)
    let defense = Number(G.slots[objetiveOwner(player)][idx2].stats.defense)

    if (attack > defense) {
        effectsLibrary.destroy(G, ctx, objetiveOwner(player), idx2)
        // let card = G.slots[objetiveOwner(player)][idx2];
        // G.slots[objetiveOwner(player)][idx2] = null;
        // ctx.effects.destroyAnim({player: objetiveOwner(player), idx: idx2});
        // G.graveyard[objetiveOwner(player)].push(card)
    }
    else if (attack < defense ){
        effectsLibrary.destroy(G, ctx, player, idx1)

        // let card = G.slots[player][idx1];
        // G.slots[player][idx1] = null;
        // ctx.effects.destroyAnim({player: player, idx: idx1});
        // G.graveyard[player].push(card)
    }
}

function attackRouter (G, ctx, attacker) {
    let cardOwner = attacker.position.player
    let index = attacker.position.idx
    // let indexR = [[1, 2, 3], [2, 3, 0], [3, 0, 1], [0, 1, 2]]

    if (G.slots[cardOwner][index] !== null){
        ctx.effects.attackAnim(attacker.position);

        if(G.slots[objetiveOwner(cardOwner)][index] != null){
            attack (G, ctx, cardOwner, index , index)
        }
        // else if(G.slots[objetiveOwner(cardOwner)][indexR[index][0]] != null){
        //     attack (G, ctx, cardOwner, index , indexR[index][0])
        // }
        // else if(G.slots[objetiveOwner(cardOwner)][indexR[index][1]] != null){
        //     attack (G, ctx, cardOwner, index , indexR[index][1])
        // }
        // else if(G.slots[objetiveOwner(cardOwner)][indexR[index][2]] != null){
        //     attack (G, ctx, cardOwner, index , indexR[index][2])
        // }
        else{
            G.HP[objetiveOwner(cardOwner)] = G.HP[objetiveOwner(cardOwner)] - G.slots[cardOwner][index].stats.attack;
            ctx.effects.directAtkAnim({player: objetiveOwner(cardOwner), hp: G.HP[objetiveOwner(cardOwner)]});
        }
    }
}

// function destroy (G, ctx) {

// }

function battle (G, ctx) {

    ctx.effects.battleStart()

    let p0_cards = G.slots.player_0;
    let p1_cards = G.slots.player_1;
    let filteredCards = [];

    for (let i=0; i < p0_cards.length; i++){

        if (p0_cards[i] != null) {
            let card = p0_cards[i];
            card.position = {idx: i, player: 'player_0'}   
            filteredCards.push(card)}
    };

    for (let i=0; i < p1_cards.length; i++){

        if (p1_cards[i] != null) {
            let card = p1_cards[i];
            card.position = {idx: i, player: 'player_1'}
            filteredCards.push(card)}
    };

    let sortedCards = filteredCards.sort(function (a, b) {
        return Number(b.stats.speed) - Number(a.stats.speed)
      });

    for (let i=0; i < sortedCards.length; i++){
        attackRouter(G, ctx, sortedCards[i]);
    }
    ctx.effects.battleEnd()
}
