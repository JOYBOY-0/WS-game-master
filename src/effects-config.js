export const config = {
  // Declare the effect types you need.
  effects: {
    // Each effect is named by its key.
    // This creates a zero-config endTurn effect:
    endTurn: {},
    summonAnim: {
      duration: 1,
      create: (value) => value,
    },
    cleanSummonAnim: {
      create: (value) => value,
      duration: 0,
    },
    attackAnim: {
      duration: 2,
      create: (value) => value,
    },
    directAtkAnim: {
      duration: 1,
      create: (value) => value,
    },
    destroyAnim: {
      duration: 1,
      create: (value) => value,
    },
    effectActivate: {
      duration: 1,
      create: (value) => value,
    },
    effectActivateGY: {
      duration: 1,
      create: (value) => value,
    },
    battleStart: {
      duration: 0,
    },
    battleEnd: {
      duration: 0,
    },
    draw: {
      duration: 1,
      create: (value) => value,
    },
    finishTurn: {
      duration: 0,
    },
    updateHand: {
      create: (value) => value,
      duration: 0,
    },
    span: {
      duration: 1,
    }
  },
};