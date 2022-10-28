const PRECISION = 1e9;
const _2PI = Math.PI * 2;

/**
 *
 * @param {number} mean
 * @param {number} std
 * @param randFn - an optional function that returns a float between 0 (inclusive) and 1
 * (exclusive).  Use this if you want to pass in a random number generator other than
 * Math.random().
 * @returns {number}
 */
function generateGaussian(mean, std, randFn = null) {
    var u1;
    var u2;
    if (randFn) {
        u1 = randFn();
        u2 = randFn();
    }
    else {
        u1 = Math.random();
        u2 = Math.random();
    }

    var z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(_2PI * u2);
    var z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(_2PI * u2);

    return z0 * std + mean;
}