fetch("data/data.json").then(response => response.json()).then(main);
function main(data) {
    console.log(data.resp_time_matrix);
    const { num_puf, num_chal, num_stage } = data.args;
    const {  puf_delta_matrix, chal_list } = data;

    let pufs = [];
    for (let i=0; i<num_puf; i++) {
        let puf = new PUF(num_stage, {fromDeltas: true, initialDeltas: puf_delta_matrix[i]});
        pufs.push(puf);
    }

    let challenges = [];
    for (let challenge of chal_list) {
        challenges.push(new Challenge(challenge.split("").map(d => parseInt(d, 2))));
    }

    let res = [];
    for (let i=0; i<num_puf; i++) {
        res.push([]);
    }

    let k = 0;
    for (let puf of pufs) {
        for (let c of challenges) {
            res[k].push(puf.getResponseValue(c));
        }
        k++;
    }
    

    console.log(res);

    let flag = false;

    for (let i=0; i<num_puf; i++) {
        for (let j=0; j<num_chal; j++) {
            if (res[i][j] !== data.resp_time_matrix[i][j]) {
                console.log("mismatch");
                flag = true;
            }
        }
    }

    if (!flag) {
        console.log("match");
    }

    console.log("response matrix values match: " + (JSON.stringify(data.resp_time_matrix) === JSON.stringify(res)));
    console.log("response matrix match: " + (JSON.stringify(data.resp_matrix) === JSON.stringify(res.map(row => row.map(sign)))));
}

