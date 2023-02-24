/*
 * Easing Functions - https://gist.github.com/gre/1650294
 */

// no easing, no acceleration
export const linear = (t) => t;

// accelerating from zero velocity
export const easeInQuad = (t) => t * t;

// decelerating to zero velocity
export const easeOutQuad = (t) => t * (2 - t);

// acceleration until halfway, then deceleration
export const easeInOutQuad = (t) =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// accelerating from zero velocity
export const easeInCubic = (t) => t * t * t;

// decelerating to zero velocity
export const easeOutCubic = (t) => --t * t * t + 1;

// acceleration until halfway, then deceleration
export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

// accelerating from zero velocity
export const easeInQuart = (t) => t * t * t * t;

// decelerating to zero velocity
export const easeOutQuart = (t) => 1 - --t * t * t * t;

// acceleration until halfway, then deceleration
export const easeInOutQuart = (t) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;

// accelerating from zero velocity
export const easeInQuint = (t) => t * t * t * t * t;

// decelerating to zero velocity
export const easeOutQuint = (t) => 1 + --t * t * t * t * t;

// acceleration until halfway, then deceleration
export const easeInOutQuint = (t) =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;

// elastic bounce effect at the beginning
export const easeInElastic = (t) => (0.04 - 0.04 / t) * Math.sin(25 * t) + 1;

// elastic bounce effect at the end
export const easeOutElastic = (t) => ((0.04 * t) / --t) * Math.sin(25 * t);

// elastic bounce effect at the beginning and end
export const easeInOutElastic = (t) =>
  (t -= 0.5) < 0
    ? (0.02 + 0.01 / t) * Math.sin(50 * t)
    : (0.02 - 0.01 / t) * Math.sin(50 * t) + 1;

export const easeInSin = (t) => 1 + Math.sin((Math.PI / 2) * t - Math.PI / 2);
export const easeOutSin = (t) => Math.sin((Math.PI / 2) * t);
export const easeInOutSin = (t) =>
  (1 + Math.sin(Math.PI * t - Math.PI / 2)) / 2;
