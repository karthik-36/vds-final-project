const fs = require('fs');
let rawdata = fs.readFileSync('../data/data.json');
let r = JSON.parse(rawdata);

let acc = [];
for (let i=0; i<r.resp_matrix.length; i++) {
    for (let j=0; j<r.resp_matrix[i].length; j++) {
        acc.push({
            x: i, y: r.resp_matrix[i].length - j - 1, v: r.resp_matrix[i][j]
        });
    }
}

console.log(acc);