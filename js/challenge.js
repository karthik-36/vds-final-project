class Challenge {
    /**
     * @param {Array} vector an array of 0s and 1s which represent the challenge vector
     */
    constructor(vector) {
        while (vector.length < 4) {
            vector.unshift(0);
        }
        this.vector = vector;
        // using BigInt because Javascript can only handle numbers up to 2^53 -_-
        this.value = BigInt("0b" + vector.join(""));
    }

    getBit(position) { // 1-indexed as according to the paper
        return this.vector[position - 1];
    }

    getLength() {
        return this.vector.length;
    }

    getValue() {
        return this.value;
    }

    getString() {
        return this.vector.join("");
    }

    getParity(fromBitPosition) {
        let parity = 0;
        for (let i=fromBitPosition; i<=this.getLength(); i++) {
            let bit = this.getBit(i);
            if (bit === 1) {
                parity++;
            }
        }
        return parity;
    }

    static createChallengeFromBinaryString(string) {
        for (let ch of string) {
            if (!(ch === "0" || ch === "1")) {
                throw new Error("invalid binary string");
            }
        }
        return new Challenge(string.split("").map(ch => parseInt(ch, 10)));
    }
}