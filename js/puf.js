class PUF {

  static count = 0;
  
  constructor(stages = 4, options = {}) {
    const { fromDeltas, initialDeltas } = options;

    this.stages = stages;
    this.deltas = [];
    this.id = PUF.count++;

    if (fromDeltas) {
      for (let i=0; i<stages; i++) {
        this.deltas.push({
          0: initialDeltas[i],
          1: initialDeltas[i + stages]
        });
      }
      /*for (let i=0; i<2*stages; i+=2) {
        this.deltas.push({
          0: initialDeltas[i],
          1: initialDeltas[i + 1]
        });
      }*/
      return;  
    }

    // create a normal (gaussian) distribution to sample values from
    // since the delta values need to be normally distributed according to the paper
    const mean = 0;
    const variance = 1;
    const distribution = gaussian(mean, variance);
    const randoms = distribution.random(2 * stages);

    for (let i=0; i<2*stages; i += 2) {
      this.deltas.push({
        0: randoms[i],
        1: randoms[i + 1]
      });
    }
    // this.deltas store the delta values for all the stages
  }

  getDelta(position) { // 1-indexed
    return this.deltas[position - 1];
  }
  getDelta0(position) { // 1-indexed
    return this.getDelta(position)[0];
  }
  getDelta1(position) { // 1-indexed
    return this.getDelta(position)[1];
  }
  getResponse(challenge) {
    return sign(this.getResponseValue(challenge));
  }
  getResponseValue(challenge) {
    const n = challenge.getLength();
    return this.response(challenge, n); // the final response is actually ∆(n)
  }

  // recursive computation of ∆
  // refer the paper, equation 2
  // the paper uses 1 indexed positions everywhere, so position is 1-indexed
  response(challenge, position) {
    if (position === 0) {
      return 0;
    }
    const bitValue = challenge.getBit(position);
    if (bitValue === 0) {
      return this.response(challenge, position - 1) + this.getDelta0(position);
    } else if (bitValue === 1) {
      return (-1) * this.response(challenge, position - 1) + this.getDelta1(position);
    } else {
      throw new Error("something went wrong");
    }
  }

  getId() {
    return this.id;
  }
}
