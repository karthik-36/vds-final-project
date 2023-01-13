const assert = require('assert').strict;
const fs = require('fs');

const file1 = "./../data/data.json";
const file2 = "C:\\Users\\jperei5\\Downloads\\exported-puf-data.json";
let data1, data2;

try {
  data1 = fs.readFileSync(file1, 'utf8');
  data2 = fs.readFileSync(file2, 'utf8');
} catch (err) {
  console.error(err);
}

let j1 = JSON.parse(data1);
let j2 = JSON.parse(data2);

assert.deepEqual(j1.args.num_puf, j2.args.num_puf);
assert.deepEqual(j1.args.num_stage, j2.args.num_stage);
assert.deepEqual(j1.args.num_chal, j2.args.num_chal);
assert.deepEqual(j1.chal_list, j2.chal_list);
assert.deepEqual(j1.puf_delta_matrix, j2.puf_delta_matrix);
assert.deepEqual(j1.resp_time_matrix, j2.resp_time_matrix);
assert.deepEqual(j1.resp_matrix, j2.resp_matrix);

const N = j1.puf_delta_matrix.length, M = j1.puf_delta_matrix[0].length;

for (let i=0; i<N; i++) {
    for (let j=0; j<M; j++) {
        assert.deepEqual(j1.puf_delta_matrix[i][j], j2.puf_delta_matrix[i][j]);
    }
}

console.info("All okay");