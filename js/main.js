const N = 16 + 1;
let STAGES = 4;
const data = [];
const side = 20;
const width = side * N + 15, height = side * N;
const E = side * 0.05
const colors = ["pink", "aqua", "lightgreen"];
let svg, heatmapSvg, histogramSvg;
let id = 0;
let selectedRowIndex = null;
let selectedColIndex = null;
var context = null;
const X_OFFSET = 10;
const textStyle = `
  font-size: 10px;
`;

const brush = d3.brush().on("end", brushed);

var tip = d3.tip().attr('class', 'd3-tip').html((event, d) => {
  let pufIndex = d.pufIndex;
  let challengeIndex = d.challengeIndex;
  return app.pufs[pufIndex].getResponseValue(app.challenges[challengeIndex]).toFixed(2);
});

// let c = d3.scaleOrdinal().domain([0, 1]).range(["#eeeeee", "#000000"]);
let c = d3.scaleOrdinal().domain([0, 1]).range(["lightblue", "pink"]);


const realColorScale = d3.scaleSequential(d3.interpolatePRGn).domain([-1, 1]);
const realColorScaleRed = d3.scaleSequential(d3.interpolateBlues).domain([-1, 1]);

const binaryColorScale = (value) => belowThreshold(value) ? c(0) : c(1);

// global object to store the app state
const app = {
  colorScale: binaryColorScale,
  brushEnabled: false,
  // array of PUF objects
  // they may not be in order of id because if the user applies a sorting operation then they will be reordered
  pufs: [],
  // array of challenge objects
  // they may not be in order of id because if the user applies a sorting operation then they will be reordered
  challenges: []
};

main(); 


function populateData() {
  for (let rowIndex = 0; rowIndex < N; rowIndex++) {
    for (let colIndex = 0; colIndex < N; colIndex++) {
      if (rowIndex == 0 || colIndex === 0) {
        data.push({
          x: colIndex * side,
          y: rowIndex * side,
          row: rowIndex, col: colIndex,
          selected: false,
          id: id++,
          isDragHandle: true,
          pufIndex: colIndex - 1,
          challengeIndex: rowIndex - 1,
          isRowDragHandle: colIndex === 0,
          isColDragHandle: rowIndex === 0
        });
      } else {
        data.push({
          x: colIndex * side,
          y: rowIndex * side,
          row: rowIndex, col: colIndex,
          pufIndex: colIndex - 1,
          challengeIndex: rowIndex - 1,
          isDragHandle: false,
          id: id++,
          data: {}
        });
      }
    }
  }
  data.forEach(d => {
    if (!d.isRowDragHandle) {
      d.x += X_OFFSET;
    }
  });
}


function main() {
  populateData();
  initPufs();
  initChallenges();

  svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("stroke-width", 2);

  // heatmapSvg = d3.create("svg")
  //   .attr("viewBox", [0, 0, width, height])
  //   .attr("stroke-width", 2);

  // histogramSvg = d3.create("svg")
  //   .attr("viewBox", [0, 0, width, height])
  //   .attr("stroke-width", 2);




  // add the brush

  renderMatrix(data);
  // renderHeatmap(data);


  let handles = svg.selectAll(".h21");
  handles.on("click", onHandleClick);


  document.getElementById("matrix").append(svg.node());
  // document.getElementById("heatmap").append(heatmapSvg.node());
  // document.getElementById("histogram").append(renderHistogram(data));


  // heatmapSvg.selectAll(".node").call(tip);
  // heatmapSvg.selectAll(".node")
  //   .on('mouseover', tip.show)
  //   .on('mouseout', tip.hide)

  // svg.call(brush);
  initializeEventListeners();

}

function initPufs() {
  const pufs = [];
  const D = N - 1;
  for (let i=0; i<D; i++) {
    pufs.push(new PUF(STAGES));
  }
  app.pufs = pufs;
}

function initChallenges() {
  const challenges = [];
  const D = N - 1;
  for (let i=0; i<D; i++) {
    let challenge = new Challenge(toBinaryVector(i));
    challenges.push(challenge);
  }
  app.challenges = challenges;
  console.log(app.challenges);
}

//
// randomly generating challenges
/*function initChallenges() {
  const challenges = [];
  const D = N - 1;
  for (let i=0; i<D; i++) {
    let digits = [];
    let b = generateRandomBinary(STAGES);
    for (let j = 0; j < b.length; j++) {
      digits.push(Number(b[j]));
    }
    let challenge = new Challenge(digits);
    challenges.push(challenge);
  }
  app.challenges = challenges;
  console.log(app.challenges);
}*/


function groupChallenges(bitPosition) {
  const C0 = app.challenges.filter(challenge => challenge.getBit(bitPosition) === 0);
  const C1 = app.challenges.filter(challenge => challenge.getBit(bitPosition) === 1);

  function parityComparator(challenge1, challenge2) {
    const parity1 = challenge1.getParity(bitPosition + 1);
    const parity2 = challenge2.getParity(bitPosition + 1);

    if (isEven(parity1) && isEven(parity2)) {
      return 0;
    } else if (isEven(parity1) && isOdd(parity2)) {
      return -1;
    } else if (isOdd(parity1) && isEven(parity2)) {
      return 1;
    } else if (isOdd(parity1) && isOdd(parity2)) {
      return 0;
    }
  }

  C0.sort(parityComparator);
  C1.sort(parityComparator);

  app.challenges = [...C0, ...C1];
}

function sortPufs(stage, deltaNumber) {
  if (deltaNumber === 0) {
    app.pufs.sort((p1, p2) => p1.getDelta0(stage) - p2.getDelta0(stage));
  } else if (deltaNumber === 1) {
    app.pufs.sort((p1, p2) => p1.getDelta1(stage) - p2.getDelta1(stage));
  } else {
    throw new Error("Incorrect delta Number");
  }
}



function renderMatrix(data) {
  // clear the matrix
  if (context) {
    context.remove();
  }
  context = svg.append("g");

  context.selectAll(".node")
    .data(data.filter(d => !d.isDragHandle), d => d.id)
    .join("rect")
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .attr("y", d => d.y)
    .attr("x", d => d.x)
    .attr("class", d => getSquareClass(d) + " node")
    .attr("fill", d => {
      let puf = app.pufs[d.pufIndex];
      let chal = app.challenges[d.challengeIndex];
      let r = puf.getResponse(chal);
      return app.colorScale(r);
    })
    .attr("fill-opacity", d => d.selected ? 0.45 : 1)
    .attr("width", side)
    .attr("height", side)
  // .call(tip)






  svg.selectAll(".h21")
    .data(data.filter(d => d.isDragHandle), d => d.id)
    .join("text")
    .text(d => {
      if (d.row === 0 && d.col === 0) {
        return "";
      }
      if (d.row === 0) {
        return `P` + app.pufs[d.pufIndex].getId();
      }
      if (d.col === 0) {
        return app.challenges[d.challengeIndex].getString()
        //return `C` + (d.challengeIndex + 1);
      }
    })
    .attr("y", d => d.y + 0 * side + 15)
    .attr("x", d => d.x + 0 * side + 0)
    // .attr("r", side / 2)
    .attr("class", d => getSquareClass(d) + " h21")
    // .attr("width", side * 0.5)
    // .attr("height", side * 0.5)
    .attr("style", textStyle)
  // .attr("href", "img/h21.svg")
  // .on("click", onHandleClick);

  if (app.brushEnabled) {
    context.call(brush);
  } else {
    context.selectAll(".node").call(tip);
    context.selectAll(".node")
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
  }

}


function brushed({ selection }) {
  let value = [];
  if (selection) {
    let [[x0, y0], [x1, y1]] = selection;
    x0 -= X_OFFSET;
    x0 = Math.floor(x0) - (Math.floor(x0) % side);
    x0 += X_OFFSET;
    y0 = Math.floor(y0) - (Math.floor(y0) % side);
    x1 -= X_OFFSET;
    x1 = Math.floor(x1) - (Math.floor(x1) % side) + side;
    x1 += X_OFFSET;
    y1 = Math.floor(y1) - (Math.floor(y1) % side) + side;
    console.log(x0, y0, x1, y1);
    let selectedData = data.filter(d => x0 <= d.x && d.x < x1 && y0 <= d.y && d.y < y1);
    let sum = 0;
    for (let d of selectedData) {
      let puf = app.pufs[d.pufIndex];
      let challenge = app.challenges[d.challengeIndex];
      let response = puf.getResponse(challenge);
      sum += belowThreshold(response) ? 0 : 1;
    }
    console.log(`Sum: ${sum}`);
    document.getElementById("brush-value").value = sum;
  }
}


function getSquareClass(d) {
  return `row-${d.row}`;
}

function between(a, x, b) {
  return a <= x && x <= b;
}

function swapRows(data, rowIndex1, rowIndex2) {
  for (let i = 0; i < N; i++) {
    let d1 = data.find(d => d.row === rowIndex1 && d.col === i)
    let d2 = data.find(d => d.row === rowIndex2 && d.col === i)

    let t = d1.data;
    d1.data = d2.data;
    d2.data = t;
  }
}
function swapCols(data, colIndex1, colIndex2) {
  for (let i = 0; i < N; i++) {
    let d1 = data.find(d => d.col === colIndex1 && d.row === i)
    let d2 = data.find(d => d.col === colIndex2 && d.row === i)

    let t = d1.data;
    d1.data = d2.data;
    d2.data = t;
  }
}


function onHandleClick(e, handleDatum) {
  if (app.brushEnabled) {
    return;
  }
  if (handleDatum.isRowDragHandle) {
    highlightRow(data, handleDatum.row);
    selectedRowIndex = handleDatum.row;
    selectedColIndex = null;
  } else {
    highlightCol(data, handleDatum.col);
    selectedColIndex = handleDatum.col;
    selectedRowIndex = null;
  }
  renderMatrix(data);
}

function initializeEventListeners() {
  document.getElementById("clear-button").addEventListener("click", () => {
    clearSelection(data);
  });
  const modeSelect = document.getElementById("mode-select");
  modeSelect.addEventListener("change", function (e) {
    switch (modeSelect.value) {
      case "brush": {
        app.brushEnabled = true;
        app.colorScale = binaryColorScale;
        renderMatrix(data);
      } break;
      case "view": {
        app.brushEnabled = false;
        app.colorScale = binaryColorScale;
        renderMatrix(data);
      }
      default: { }
    }
  });

  const stageInput = document.getElementById("stage-number");
  const deltaInput = document.getElementById("delta-number");
  const challengeBitInput = document.getElementById("challenge-bit-position");
  const reorderRowsButton = document.getElementById("reorder-rows");
  const reorderColsButton = document.getElementById("reorder-cols");
  const viewPufDnaButton = document.getElementById("view-puf-dna-button");
  const pufNumberSelect = document.getElementById("puf-select");
  const viewHistogramButton = document.getElementById("histogram-button");

  reorderRowsButton.addEventListener("click", function() {
    let challengeBitPosition = parseInt(challengeBitInput.value, 10);
    groupChallenges(challengeBitPosition);
    renderMatrix(data);
  });

  reorderColsButton.addEventListener("click", function() {
    let stage = parseInt(stageInput.value, 10);
    let delta = parseInt(deltaInput.value, 10);
    sortPufs(stage, delta);
    renderMatrix(data);
  });

  viewPufDnaButton.addEventListener("click", function(e) {
    let pufId = parseInt(pufNumberSelect.value);
    let puf = app.pufs.find(puf => puf.getId() === pufId);
    let data = puf.getDeltas();

    // Reference: https://observablehq.com/@d3/bar-chart
    let upperChart = BarChart(data.map(d => d[0]), {
      x: (d, i) => i + 1,
      y: d => d,
      yFormat: "",
      yLabel: "Value 𝛿(0)",
      yDomain: [-3.5, 3.5], // [ymin, ymax]
      width: 1000,
      height: 250,
      color: "steelblue"
    });
    let container1 = document.getElementById("upper-bar-chart");
    clearContainer(container1);
    container1.appendChild(upperChart);

    let lowerChart = BarChart(data.map(d => d[1]), {
      x: (d, i) => i + 1,
      y: d => d,
      yFormat: "",
      yDomain: [-3.5, 3.5], // [ymin, ymax]
      yLabel: "Value 𝛿(1)",
      width: 1000,
      height: 250,
      color: "steelblue"
    });
    let container2 = document.getElementById("lower-bar-chart");
    clearContainer(container2);
    container2.appendChild(lowerChart);

    let tableData = []
    for (i = 0; i < data.length; i++) {
      tableData.push([i+1, ' ', data[i][0], ' ', data[i][1]]);
    }
    /*console.log("data ");
    console.log(data);
    console.log("tableData ");
    console.log(tableData);*/

    // Reference: http://bl.ocks.org/yan2014/c9dd6919658991d33b87
    // render the table
    var table = d3.select("#table").append("table");

    var header = table.append("thead").append("tr");
    header
      .selectAll("th")
      .data(['Stage',' ', 'delta0', ' ', 'delta1'])
      .enter()
      .append("th")
      .text(function(d) { return d; });
    var tablebody = table.append("tbody");
    rows = tablebody
      .selectAll("tr")
      .data(tableData)
      .enter()
      .append("tr");
    // We built the rows using the nested array - now each row has its own array.
    cells = rows.selectAll("td")
      // each row has data associated; we get it and enter it for the cells.
      .data(function(d) {
          //console.log(d);
          return d;
      })
      .enter()
      .append("td")
      .text(function(d) {
        //console.log(d);
        return d;
      });
      
    let container3 = document.getElementById("table");
    clearContainer(container3);
    container3.appendChild(table.node());
    

  });


  // When Histogram button is clicked
  viewHistogramButton.addEventListener("click", function(e) {
    let pufId = parseInt(pufNumberSelect.value);
    let puf = app.pufs.find(puf => puf.getId() === pufId);
    //
    let histogram_data = [];
    //
    // generating 10,000 random challenges
    /*for (let i = 0; i < 10000; i++) { 
      let digits = [];
      let b = generateRandomBinary(STAGES);  //  generating random binary string of length 'STAGES'
      for (let j = 0; j < b.length; j++) {
        digits.push(Number(b[j]));
      }
      let challenge = new Challenge(digits);
      //
      //console.log("challenge " + challenge);
      //console.log("delta " + puf.getResponseValue(challenge));
      histogram_data.push(puf.getResponseValue(challenge));
    }*/
    for(let i = 0; i < app.challenges.length; i++ ){
      histogram_data.push(puf.getResponseValue(app.challenges[i]));
    }
    //console.log("histogram_data " + histogram_data);
    //
    // render histogram 
    let histogram = Histogram(histogram_data, {
      value: d => d,
      //y: (d, i) => i + 1,
      label: "∆(n)",
      yLabel: "Challenges",
      width: 1000,
      height: 300,
      thresholds: 20,
      color: "steelblue"
    });

    let container1 = document.getElementById("histogram-chart");
    clearContainer(container1);
    container1.appendChild(histogram);

  });



  for (let i=2; i<=STAGES; i++) {
    let option= document.createElement("option");
    option.value = i;
    option.innerHTML = i;
    stageInput.appendChild(option);
  }

  document.getElementById("stages-display").textContent = `Number of stages: ${STAGES}`;
}



function highlightRow(data, rowIndex) {
  data.forEach(d => {
    if (d.row === rowIndex) {
      d.selected = true;
    } else {
      d.selected = false;
    }
  });
}

function highlightCol(data, colIndex) {
  data.forEach(d => {
    if (d.col === colIndex) {
      d.selected = true;
    } else {
      d.selected = false;
    }
  });
}

function clearSelection(data) {
  selectedRowIndex = null;
  selectedColIndex = null;
  highlightRow(data, -1);
  if (app.brushEnabled) {
    brush.clear(context);
  }
  renderMatrix(data);
}




function renderHeatmap(data) {

  let id = 0;

  let dragHandles = data.filter(d => d.isDragHandle);
  const heatmapData = [...dragHandles];

  for (let row1 = 1; row1 < N; row1++) {
    for (let row2 = 1; row2 < N; row2++) {
      let similarty = getSimilarty(data, row1, row2);
      heatmapData.push({
        row: row1,
        col: row2,
        data: { value: similarty },
        id: id++,
        isDragHandle: false,
        x: row2 * side,
        y: row1 * side,
      })
    }
  }


  heatmapSvg.selectAll(".node")
    .data(heatmapData.filter(d => !d.isDragHandle), d => d.id)
    .join("rect")
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .attr("y", d => d.y)
    .attr("x", d => d.x)
    .attr("class", d => getSquareClass(d) + " node")
    .attr("fill", d => {
      if (d.row < d.col) return "#eeeeee";
      return realColorScaleRed(d.data.value)
    })
    .attr("width", side)
    .attr("height", side)

  heatmapSvg.selectAll(".h21")
    .data(heatmapData.filter(d => d.isDragHandle), d => d.id)
    .join("text")
    .text(d => {
      if (d.row === 0 && d.col === 0) {
        return "";
      }
      if (d.row === 0) {
        return `R${d.col}`;
      }
      if (d.col === 0) {
        return `R${d.row}`;
      }
    })
    .attr("y", d => d.y + 0 * side + 15)
    .attr("x", d => d.x + 0 * side + 2)
    .attr("class", d => getSquareClass(d) + " h21")
    .attr("style", textStyle)

}

function renderHistogram(data) {
  return Histogram(data.filter(d => !d.isDragHandle), {
    value: d => d.data.value,
    label: "Value →",
    width: 500,
    height: 500,
    thresholds: 10,
    color: "steelblue"
  })
}


function getSimilarty(data, row1, row2) {
  let row1Data = data.filter(d => d.row === row1);
  let row2Data = data.filter(d => d.row === row2);

  let similarity = 0;
  for (let col = 1; col < N; col++) {
    let datum1 = row1Data.find(d => d.col === col);
    let datum2 = row2Data.find(d => d.col === col);

    let v1 = belowThreshold(datum1.data.value) ? 0 : 1;
    let v2 = belowThreshold(datum2.data.value) ? 0 : 1;

    if (v1 === v2) {
      similarity++;
    }
  }

  return similarity / (N - 1);
}

function belowThreshold(value) {
  return value < 0; 
}