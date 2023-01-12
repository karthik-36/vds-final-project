Utils.save = function(filename, data) {
    const blob = new Blob([data], {type: 'application/json'});
    if(window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    } else {
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;        
        document.body.appendChild(elem);
        elem.click();        
        document.body.removeChild(elem);
    }
}
Utils.export = function() {
    const json = { args: {} };

    json.args.num_stage = app.pufs[0].stages;
    json.args.num_puf = app.pufs.length;
    json.args.num_chal = app.challenges.length;

    json.chal_list = app.challenges.map(challenge => challenge.getString());
    json.puf_delta_matrix = app.pufs.map(puf => {
        return [
            ...puf.getDeltas().map(d => d[0]),
            ...puf.getDeltas().map(d => d[1]),
        ];
    });

    json.resp_time_matrix = app.pufs.map(puf => {
        let row = [];
        for (let challenge of app.challenges) {
            row.push(puf.getResponseValue(challenge));
        }
        return row;
    });

    json.resp_matrix = app.pufs.map(puf => {
        let row = [];
        for (let challenge of app.challenges) {
            row.push(puf.getResponse(challenge));
        }
        return row;
    });

    Utils.save("exported-puf-data.json", JSON.stringify(json, null, 4));
}