function sign(value) {
  return value < 0 ? -1 : 1;
}


function isEven(value) {
  return value % 2 === 0;
}

function isOdd(value) {
  return value % 2 === 1;
}

function toBinaryVector(value) {
  let digits = [];
  while (value > 0) {
    let digit = value % 2;
    digits.unshift(digit);
    value = value >>> 1;
  }
  const L = Math.log2(N - 1);
  while (digits.length < L) {
    digits.unshift(0);
  }
  return digits;
}

function toBinaryString(value) {
  return toBinaryVector(value).join("");
}
