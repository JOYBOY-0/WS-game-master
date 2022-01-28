export const config = {
    // Declare the effect types you need.
    effects: {
      // Each effect is named by its key.
      // This creates a zero-config endTurn effect:
      endTurn: {},
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
      battleStart: {
        duration: 0,
      },
      battleEnd: {
        duration: 0,
      },
      draw: {
        duration: 0,
        create: (value) => value,
      }
    },
  };