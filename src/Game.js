import { INVALID_MOVE } from 'boardgame.io/core';
import { deck } from "./deck";
import { EffectsPlugin } from 'bgio-effects/plugin';
import { config } from './effects-config';
import { effectsLibrary } from './Effects'
import { current } from 'immer';


export const WsGame = {

    name: 'standardTCG',

    setup: prepareGame,

    plugins: [EffectsPlugin(config)],

    moves: {
        summon: summon,
        setBattle: setBattle,
        battle: battle
    },

    endIf: (G, ctx) => {
        if (G.HP.player_0 < 0){
            return { winner: 1 };
        }
        else if (G.HP.player_1 < 0){
            return { winner: 0 };
        }
    },


    turn: {
        onBegin: (G, ctx) => {
            G.player_0.deck = ctx.random.Shuffle(G.player_0.deck);
            G.player_1.deck = ctx.random.Shuffle(G.player_1.deck);

            if (ctx.turn === 1){
                for(let i=0; i<4; i++){ 
                    effectsLibrary.draw(G, ctx, 'player_0'); 
                    effectsLibrary.draw(G, ctx, 'player_1');
                } 
            } 
            if (ctx.turn > 1){ effectsLibrary.draw(G, ctx, 'player_' + ctx.currentPlayer) }
        },
        onEnd: (G, ctx) => {
            ctx.effects.finishTurn()
        }
    },

    phases: {
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

//facility (get oposite)

const objetiveOwner = obj => obj === 'player_0' ? 'player_1' : 'player_0'

//facility updates hand

const updateHand = (G, ctx) => ctx.effects.updateHand({
    player_0: current(G.player_0.hand),
    player_1: current(G.player_1.hand),
})

function summon (G, ctx, index, slot) {

    let playerID = 'player_' + ctx.currentPlayer;
    let currentPlayer = G[playerID];
    const card = currentPlayer.hand[index];

    //summon rank 0

    if (card !== null
    && Number(card.stats.rank) < 1
    && G.slots[playerID][slot] === null){

        G[playerID].hand.splice(index, 1);
        G.slots[playerID][slot] = card;
        G.slots[playerID][slot].summoned = ctx.turn
        ctx.effects.summonAnim({player: playerID, idx: slot, handIdx: index})
        updateHand(G, ctx)
        ctx.effects.cleanSummonAnim()

        // checking trigger on summon

        if (card.effect !== undefined && card.effect.trigger === 'summon') {

            //if so, trigger the animation
            ctx.effects.effectActivate(current(G.slots[playerID][slot]))
            //resolve the effect
            effectsLibrary[card.effect.effect](
                G, 
                ctx,   
                'player_' + ctx.currentPlayer,
                card.effect.params,
                slot
            )
            ctx.effects.span()
        }

    //summon rank 1-2

    } else if (card !== null
        && Number(card.stats.rank) > 0
        && Number(G.slots[playerID][slot].stats.rank) === Number(card.stats.rank) - 1
        && G.slots[playerID][slot].summoned < ctx.turn){
            
            let sacrifice = G.slots[playerID][slot]
            G[playerID].hand.splice(index, 1);
            G.slots[playerID][slot] = card;
            G.slots[playerID][slot].summoned = ctx.turn
            G.graveyard[playerID].push(sacrifice);
            ctx.effects.summonAnim({player: playerID, idx: slot, handIdx: index})
            updateHand(G, ctx)
            ctx.effects.cleanSummonAnim()

            // checking trigger on summon

            if (card.effect !== undefined && card.effect.trigger === 'summon') {

                //if so, trigger the animation
                ctx.effects.effectActivate(current(G.slots[playerID][slot]))
                //resolve the effect
                effectsLibrary[card.effect.effect](
                    G, 
                    ctx,   
                    'player_' + ctx.currentPlayer,
                    card.effect.params,
                    slot
                )
                ctx.effects.span()
            }

            // checking trigger on sacrifice (graveyard)

            if (sacrifice.effect !== undefined && sacrifice.effect.trigger === 'sacrifice') {
                
                //if so, trigger the animation
                ctx.effects.effectActivateGY({player: playerID})

                effectsLibrary[card.effect.effect](
                    G,
                    ctx,
                    'player_' + ctx.currentPlayer,
                    sacrifice.effect.params
                );
                ctx.effects.span()
            }            
    } 

     else { return INVALID_MOVE}
}

function activateSpell (G, ctx, idx) {
    let playerID = 'player_' + ctx.currentPlayer;
    let currentPlayer = G[playerID];
    const spell = currentPlayer.hand[idx];

}

function setBattle (G, ctx) {
    ctx.events.setPhase('battle');
}

function attack (G, ctx, player, idx){
    let attacker = G.slots[player][idx]
    let defender = G.slots[objetiveOwner(player)][idx]
    let attack = Number(attacker.stats.attack)
    let defense = Number(defender.stats.defense)

    if (attack > defense) {

        //checking if attacker has trigger when attacks 

        if (attacker.effect !== undefined && attacker.effect.trigger === 'attack') {

            ctx.effects.effectActivate(current(attacker))

            effectsLibrary[attacker.effect.effect](
                G,
                ctx,
                player,
                attacker.effect.params
            )
        }

        //checking if defender has trigger when attacked 

        if (defender.effect !== undefined && defender.effect.trigger === 'attacked') {
    
            ctx.effects.effectActivateGY(current(defender))

            effectsLibrary[defender.effect.effect](
                G,
                ctx,
                objetiveOwner(player),
                defender.effect.params
            );
        }
        //resolves       
        effectsLibrary.destroy(G, ctx, objetiveOwner(player), idx)
    }

    else {
        //checking if attacker has trigger when attacks 

        if (attacker.effect !== undefined && attacker.effect.trigger === 'attack') {

            ctx.effects.effectActivateGY({player: player})

            effectsLibrary[attacker.effect.effect](
                G,
                ctx,
                player,
                attacker.effect.params
            )
        }

        //checking if defender has trigger when attacked 

        if (defender.effect !== undefined && defender.effect.trigger === 'attacked') {
    
            ctx.effects.effectActivate({player: objetiveOwner(player), idx: idx})

            effectsLibrary[defender.effect.effect](
                G,
                ctx,
                objetiveOwner(player),
                defender.effect.params
            );
        }
        //resolves       

        effectsLibrary.destroy(G, ctx, player, idx)
    }
}

function attackRouter (G, ctx, attacker) {
    let cardOwner = attacker.position.player
    let index = attacker.position.idx

    const card = G.slots[cardOwner][index]
    const target = G.slots[objetiveOwner(cardOwner)][index]

    if (G.slots[cardOwner][index] !== null){

        //triggers attack animation

        ctx.effects.attackAnim(attacker.position);

        if(G.slots[objetiveOwner(cardOwner)][index] !== null){

            //attack resolves
            attack (G, ctx, cardOwner, index)
        }

        else{
            //checking if attacker has trigger when attacks 

            if (card.effect !== undefined && card.effect.trigger === 'attack') {
                effectsLibrary[card.effect.effect](
                    G,
                    ctx,
                    cardOwner,
                    card.effect.params
                );
                ctx.effects.effectActivate({player: cardOwner, idx: index})
            }

            //damage calculation

            G.HP[objetiveOwner(cardOwner)] = G.HP[objetiveOwner(cardOwner)] - G.slots[cardOwner][index].stats.attack;
            ctx.effects.directAtkAnim({player: objetiveOwner(cardOwner), hp: G.HP[objetiveOwner(cardOwner)]});

            //checking if attacker has trigger when it inflicts damage

            if (card.effect !== undefined && card.effect.trigger === 'inflictDamage') {
                effectsLibrary[card.effect.effect](
                    G,
                    ctx,
                    cardOwner,
                    card.effect.params
                );
                ctx.effects.effectActivate({player: cardOwner, idx: index})
            }

            //checking if any of enemies has trigger when it receives damage

            const receiveDmgQueue = effectQueue(G, ctx, 'receiveDamage', objetiveOwner(cardOwner));
            
            if (receiveDmgQueue.length > 0) {
                
                for (let i=0; i < receiveDmgQueue.length; i++){
                    let card = receiveDmgQueue[i]
                    effectsLibrary[card.effect.effect](
                        G, 
                        ctx,   
                        objetiveOwner(cardOwner),
                        card.effect.params
                    );
                    ctx.effects.effectActivate({player: card.player, idx: card.idx})
                    ctx.effects.span()

                }
            }
        }
    }
}


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
    ctx.events.endTurn()

}

function effectQueue (G, ctx, trigger, player){

    let queue = [];
    let slots = G.slots[player]

    for (let i = 0; i < slots.length; i ++){
        if (slots[i] !== null && slots[i].effect !== undefined && slots[i].effect.trigger === trigger){
            let card = slots[i];
            card.player = player;
            card.idx = i;
            queue.push(card);
        }
    }       

    return queue;
}