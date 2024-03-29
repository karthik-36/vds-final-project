let N = 16 + 0;
let ROWS = 16;
let COLS = 16;
let STAGES = 4;
let data = [];
let side = 20;
let width = side * COLS, height = side * ROWS;
let E = side * 0.05;
const colors = ["pink", "aqua", "lightgreen"];
let svg, heatmapSvg, histogramSvg;
let id = 0;
let selectedRowIndex = null;
let selectedColIndex = null;
var context = null;
const X_OFFSET = 0;
const textStyle = `
  font-size: 3px;
`;

const brush = d3.brush().on("end", brushed);
brush.handleSize(3);

var tip = d3.tip().attr('class', 'd3-tip').html((event, d) => {
  let pufIndex = d.pufIndex;
  let challengeIndex = d.challengeIndex;
  return app.pufs[pufIndex].getResponseValue(app.challenges[challengeIndex]).toFixed(2);
  // return `PI: ${pufIndex} CI: ${challengeIndex} R: ${d.row} C: ${d.col}`;
});

// var tipCol = d3.tip().attr('class', 'd3-tip').html((event, d) => {
//   let pufIndex = d.pufIndex;
//   let challengeIndex = d.challengeIndex;
//   console.log(d);
//   return "hello";
// });


//let cRange = d3.scaleSequential().domain([0, 1]).range(["lightblue", "pink"]);

let cRange = d3.scaleSequential().interpolator(d3.interpolateCool).domain([15, -15]);
let c = d3.scaleOrdinal().domain([0, 1]).range(["lightblue", "darkblue"]);

//const realColorScale = d3.scaleSequential(d3.interpolatePRGn).domain([-1, 1]);
//const realColorScaleRed = d3.scaleSequential(d3.interpolateBlues).domain([-1, 1]);

/*let c1 = d3.scaleSequential().domain([0, 1]).range(["lightblue", "green"]);
let c2 = d3.scaleSequential().domain([0, 1]).range(["lightblue", "orange"]);
let c3 = d3.scaleSequential().domain([0, 1]).range(["lightblue", "yellow"]);
let c4 = d3.scaleSequential().domain([0, 1]).range(["lightblue", "blue"]);*/

let c1 = d3.scaleSequential().interpolator(d3.interpolateBlues).domain([-15, 15]);3
let c2 = d3.scaleSequential().interpolator(d3.interpolateGreens).domain([-15, 15]);
let c3 =  d3.scaleSequential().interpolator(d3.interpolateReds).domain([-15, 15]);
let c4 = d3.scaleSequential().interpolator(d3.interpolatePurples).domain([-15, 15]);

/*const binaryColorScale = (value,row) => row === null?  belowThreshold(value) ? c(0) : c(1) : (

  (row < app.group[0]) ? (belowThreshold(value) ? c1(0) : c1(1)) : (row < app.group[0] + app.group[1]) ? (belowThreshold(value) ? c2(0) : c2(1)) :  (row < app.group[0] + app.group[1] + app.group[2]) ? (belowThreshold(value) ? c3(0) : c3(1)) : (belowThreshold(value) ? c4(0) : c4(1))
  
 );*/

const binaryColorScale = (value,row) => row === null?  belowThreshold(value) ? c(0) : c(1) : (

  (row < app.group[0]) ? (belowThreshold(value) ? c1(-10) : c1(10)) : (row < app.group[0] + app.group[1]) ? (belowThreshold(value) ? c2(-10) : c2(10)) :  (row < app.group[0] + app.group[1] + app.group[2]) ? (belowThreshold(value) ? c3(-10) : c3(10)) : (belowThreshold(value) ? c4(-10) : c4(10))
  
);

const fullColorScale = (value,row) => row === null? cRange(value) : (
  row < app.group[0] ? c1(value) : (row < app.group[0] + app.group[1]) ?  c2(value)  :  (row < app.group[0] + app.group[1] + app.group[2]) ? c3(value)  : c4(value) 

);



// global object to store the app state
const app = {
  colorScale: binaryColorScale,
  splitState: false,
  brushEnabled: false,
  group: [],
  hammingColumn1: -1,
  hammingColumn2: -1,
  hammingColumnNames: [],
  // array of PUF objects
  // they may not be in order of id because if the user applies a sorting operation then they will be reordered
  pufs: [],
  // array of challenge objects
  // they may not be in order of id because if the user applies a sorting operation then they will be reordered
  challenges: []
};

main();

function computeNewStateData(stages, rows, cols) {
  STAGES = stages;
  ROWS = rows;
  COLS = cols;
  side = (16*20) / Math.max(ROWS, COLS);
  width = side * COLS;
  height = side * ROWS;
  E = side * 0.05;
  data = [];
  populateData();
}

function syncInputsWithState() {
  const stageInput = document.getElementById("stage-number");
  const challengeBitInput = document.getElementById("challenge-bit-position");
  const pufNumberSelect = document.getElementById("puf-select");
  const stagesDisplay = document.getElementById("stages-display");

  clearContainer(stageInput);
  for (let i = 1; i <= STAGES; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.innerHTML = i;
    if (i === 1) {
      option.selected = true;
    }
    stageInput.appendChild(option);
  }

  challengeBitInput.setAttribute("max", STAGES);
  stageInput.setAttribute("max", STAGES);
  challengeBitInput.setAttribute("value", 1);

  clearContainer(pufNumberSelect);
  for (let i = 1; i <= app.pufs.length; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.innerHTML = i;
    if (i === 1) {
      option.selected = true;
    }
    pufNumberSelect.appendChild(option);
  }

  stagesDisplay.textContent = `${STAGES}`;
}

function populateData() {
  for (let rowIndex = 0; rowIndex < ROWS; rowIndex++) {
    for (let colIndex = 0; colIndex < COLS; colIndex++) {
      data.push({
        x: colIndex * side,
        y: rowIndex * side,
        row: rowIndex, col: colIndex,
        pufIndex: colIndex,
        challengeIndex: rowIndex,
        isDragHandle: false,
        id: id++,
        data: {}
      });
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
  initStrings();
  initPufs();
  initChallenges();

  svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("stroke-width", 2);

  // add the brush

  renderMatrix(data);

  // landing page charts for #PUF 1
  renderBarCharts(1);
  renderHistogram(1);

  document.getElementById("matrix").append(svg.node());
  initializeEventListeners();
}

function initPufs() {
  const pufs = [];
  const D = COLS;
  for (let i=0; i<D; i++) {
    pufs.push(new PUF(STAGES));
  }
  app.pufs = pufs;
}

function initChallenges() {
  const challenges = [];
  const D = ROWS;
  for (let i=0; i<D; i++) {
    let challenge = new Challenge(toBinaryVector(i));
    challenges.push(challenge);
  }
  app.challenges = challenges;
}


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
  console.log(app.challenges);
  return app.challenges;
}

function getGroupSizes() {
  const challengeBitInput = document.getElementById("challenge-bit-position");
  const bitPosition = parseInt(challengeBitInput.value, 10);
  const challengeLength = app.challenges[0].getLength();

  if (bitPosition >= challengeLength) {
    throw new Error("Cannot group challenges because parity calculation substring has length 0");
  }
  const C0_even = app.challenges.filter(challenge => challenge.getBit(bitPosition) === 0 && isEven(challenge.getParity(bitPosition + 1)));
  const C0_odd = app.challenges.filter(challenge => challenge.getBit(bitPosition) === 0 && isOdd(challenge.getParity(bitPosition + 1)));
  const C1_even = app.challenges.filter(challenge => challenge.getBit(bitPosition) === 1 && isEven(challenge.getParity(bitPosition + 1)));
  const C1_odd = app.challenges.filter(challenge => challenge.getBit(bitPosition) === 1 && isOdd(challenge.getParity(bitPosition + 1)));

  return [
    C0_even.length,
    C0_odd.length,
    C1_even.length,
    C1_odd.length
  ];
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

  let group = getGroupSizes();
  app.group = group;
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
    .on("click", (event, d) => {

      let arr = [];

      for (let i = 0; i < data.length; i++) {

        if (d.col == data[i].col) {
          let pufIndex = data[i].pufIndex;
          let challengeIndex = data[i].challengeIndex;
          arr.push(belowThreshold(app.pufs[pufIndex].getResponseValue(app.challenges[challengeIndex])) ? 0 : 1);
        }

      }




      if (app.hammingColumn1 != -1 && app.hammingColumn2 != -1) {
        app.hammingColumn1 = app.hammingColumn2;
        app.hammingColumn2 = arr;

        app.hammingColumnNames = [app.hammingColumnNames[1]];
        app.hammingColumnNames.push(d.col);
      }

      if (app.hammingColumn1 == -1) {
        app.hammingColumn1 = arr;

        app.hammingColumnNames = [d.col]
      }

      else if (app.hammingColumn2 == -1) {
        app.hammingColumn2 = arr;
        app.hammingColumnNames.push(d.col)
      }

      if (app.hammingColumn1 != -1 && app.hammingColumn2 != -1) {
        document.getElementById("col-distance").textContent = "C"+app.hammingColumnNames[0]+",C"+app.hammingColumnNames[1] + " :" + hammingDistance(app.hammingColumn1, app.hammingColumn2);
      }
      context.selectAll(".node").style("opacity", d => { if (d.col == app.hammingColumnNames[0] || d.col == app.hammingColumnNames[1]) { return 0.60 } else { return 1 } })
        .attr("stroke-width", 0.5)

    })
    .attr("fill", d => {

      let pufIndex = d.pufIndex;
      let challengeIndex = d.challengeIndex;

      if(app.splitState){
        return app.colorScale(app.pufs[pufIndex].getResponseValue(app.challenges[challengeIndex]), d.row);
      }else{
        return app.colorScale(app.pufs[pufIndex].getResponseValue(app.challenges[challengeIndex]), null);
      }

    })
    .attr("width", side)
    .attr("height", side)




  if (app.brushEnabled) {
    context.call(brush);
  } else {
    context.selectAll(".node").call(tip);
    context.selectAll(".node")
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
  }



}


function hammingDistance(arr1, arr2) {
  let count = 0;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] != arr2[i]) {
      count++;
    }
  }
  return count;
}

function brushed({ selection }) {
  let value = [];
  if (selection) {
    let [[x0, y0], [x1, y1]] = selection;
    x0 -= X_OFFSET;
    x0 = Math.floor(x0 / side) * side;
    x0 += X_OFFSET;
    y0 = Math.floor(y0 / side) * side;
    x1 -= X_OFFSET;
    x1 = Math.floor(x1 / side) * side + side;
    x1 += X_OFFSET;
    y1 = Math.floor(y1 / side) * side + side;
    x0 = Utils.round(x0, 3);
    x1 = Utils.round(x1, 3);
    y0 = Utils.round(y0, 3);
    y1 = Utils.round(y1, 3);
    console.log(x0, y0, x1, y1);
    let selectedData = data.filter(d => x0 <= d.x && d.x < x1 && y0 <= d.y && d.y < y1);
    let sum = 0, total = 0, brushedHamming = 0;
    console.log(selectedData);

    let colMap = new Map();
    let colArr = [];
    for (let d of selectedData) {

      let puf = app.pufs[d.pufIndex];
      let challenge = app.challenges[d.challengeIndex];
      let response = puf.getResponse(challenge);

      let val = belowThreshold(response) ? 0 : 1;
      sum += val;

      if (colMap.has(d.col)) {
        let arr = colMap.get(d.col);
        arr.push(val);
        colMap.set(d.col, arr);
      } else {
        colArr.push(d.col)
        colMap.set(d.col, [val]);
      }
      total++;
    }



    for (let i = 0; i < colArr.length - 1; i++) {
      for (let j = i + 1; j < colArr.length; j++) {
        brushedHamming += hammingDistance(colMap.get(colArr[i]), colMap.get(colArr[j]));
      }
    }

    brushedHamming = brushedHamming / colArr.length;



    if (app.brushEnabled) {
      document.getElementById("brush-distance").textContent = brushedHamming.toFixed(3);
    }
    document.getElementById("brush-value").textContent = sum;
    document.getElementById("total-value").textContent = total;
    document.getElementById("ratio-value").textContent = (sum / total.toFixed(2)).toFixed(2);
  }
}


function getSquareClass(d) {
  return `row-${d.row}`;
}


function initializeEventListeners() {
  document.getElementById("clear-button").addEventListener("click", () => {
    clearSelection(data);
  });

  const brushButton = document.getElementById("brush-button");
  const viewButton = document.getElementById("view-button");

  brushButton.addEventListener("click", function () {
    app.brushEnabled = true;
    // app.colorScale = binaryColorScale;
    brushButton.classList.add("active-button");
    viewButton.classList.remove("active-button");
    renderMatrix(data);
  });
  viewButton.addEventListener("click", function () {
    app.brushEnabled = false;
    viewButton.classList.add("active-button");
    brushButton.classList.remove("active-button");
    // app.colorScale = binaryColorScale;
    renderMatrix(data);
  });


  const groupButton = document.getElementById("group-button");
  groupButton.addEventListener("click", () => {
    app.splitState = !app.splitState;
    groupButton.classList.toggle("active-button");
    renderMatrix(data);
  });

  const colorModeButton = document.getElementById("color-mode-button");
  colorModeButton.addEventListener("click", () => {
    app.colorScale = (app.colorScale === fullColorScale) ? binaryColorScale : fullColorScale;
    colorModeButton.classList.toggle("active-button");
    renderMatrix(data);
  });

  const stageInput = document.getElementById("stage-number");
  const deltaInput = document.getElementById("delta-number");
  const challengeBitInput = document.getElementById("challenge-bit-position");
  const reorderRowsButton = document.getElementById("reorder-rows");
  const reorderColsButton = document.getElementById("reorder-cols");
  // const viewPufDnaButton = document.getElementById("view-puf-dna-button");
  const pufNumberSelect = document.getElementById("puf-select");
  // const cells = document.getElementsByTagName('rect');
  // // const viewHistogramButton = document.getElementById("histogram-button");
  // console.log(cells);
  reorderRowsButton.addEventListener("click", function () {
    let challengeBitPosition = parseInt(challengeBitInput.value, 10);

    groupChallenges(challengeBitPosition);

    renderMatrix(data);
  });

  reorderColsButton.addEventListener("click", function () {
    let stage = parseInt(stageInput.value, 10);
    let delta = parseInt(deltaInput.value, 10);
    sortPufs(stage, delta);
    renderMatrix(data);
  });

  pufNumberSelect.addEventListener("change", () => {
    renderBarCharts(pufNumberSelect.value);
    renderHistogram(pufNumberSelect.value);
  });

  // to reset the active state when the clicks outside the modal
  const uploadDataModal = document.getElementById('upload-data-modal');
  uploadDataModal.addEventListener('hidden.bs.modal', event => {
    editDataApp.activeSection = 1;
  });

  for (let i=2; i<=STAGES; i++) {
    let option= document.createElement("option");
    option.value = i;
    option.innerHTML = i;
    stageInput.appendChild(option);
  }

  document.getElementById("stages-display").textContent = `${STAGES}`;
}

function clearSelection(data) {
  if (app.brushEnabled) {
    brush.clear(context);
    document.getElementById("brush-value").textContent = 0;
    document.getElementById("total-value").textContent = 0;
    document.getElementById("ratio-value").textContent = 0;
  }
}

//
function renderBarCharts(pufNum) {
  let pufId = parseInt(pufNum);
  let puf = app.pufs.find(puf => puf.getId() === pufId);
  let data = puf.getDeltas();

  // Reference: https://observablehq.com/@d3/bar-chart
  let container1 = document.getElementById("upper-bar-chart");
  let upperChart = BarChart(data.map(d => d[0]), {
    x: (d, i) => i + 1,
    y: d => d,
    yFormat: "",
    yLabel: "Value 𝛿(0)",
    // yDomain: [-3.5, 3.5], // [ymin, ymax]
    width: container1.clientWidth,
    height: 150,
    color: "steelblue"
  });
  clearContainer(container1);
  container1.appendChild(upperChart);

  let container2 = document.getElementById("lower-bar-chart");
  let lowerChart = BarChart(data.map(d => d[1]), {
    x: (d, i) => i + 1,
    y: d => d,
    yFormat: "",
    // yDomain: [-3.5, 3.5], // [ymin, ymax]
    yLabel: "Value 𝛿(1)",
    width: container2.clientWidth,
    height: 150,
    color: "steelblue"
  });
  clearContainer(container2);
  container2.appendChild(lowerChart);
}


function renderHistogram(pufNum) {
  let pufId = parseInt(pufNum);
  let puf = app.pufs.find(puf => puf.getId() === pufId);
  //
  let histogram_data = [];

  console.log("STAGES " + STAGES);

  // generating 10,000 random challenges
  for (let i = 0; i < 10000; i++) { 
    let digits = [];
    let b = generateRandomBinary(STAGES);  //  generating random binary string of length 'STAGES'
    /*for (let j = 0; j < b.length; j++) {
      digits.push(Number(b[j]));
    }
    let challenge = new Challenge(digits);*/

    let binaryVector = b.split("").map(ch => parseInt(ch, 10));
    let challenge = new Challenge(binaryVector);
    //
    //console.log("challenge " + challenge);
    //console.log("delta " + puf.getResponseValue(challenge));
    histogram_data.push(puf.getResponseValue(challenge));
  }

  console.log("histogram_data " + histogram_data);

  let container1 = document.getElementById("histogram-chart");

  // render histogram 
  let histogram = Histogram(histogram_data, {
    value: d => d,
    label: "∆(n)",
    yLabel: "Challenges",
    width: container1.clientWidth,
    height: 150,
    thresholds: 20,
    color: "#006A4E"
  });

  clearContainer(container1);
  container1.appendChild(histogram);

}

function belowThreshold(value) {
  if (typeof value !== "number") {
    throw new Error("Must be a number!");
  }
  return value < 0; 
}

function initStrings() {
  document.getElementById("resp-bias").innerText = Strings.RESPONSE_BIAS;
  document.getElementById("total").innerText = Strings.TOTAL;
  document.getElementById("ratio").innerText = Strings.RATIO;
  document.getElementById("stages").innerText = Strings.STAGES;
  document.getElementById("area-hamming").innerText = Strings.AREA_HAMMING_DISTANCE;
  document.getElementById("col-hamming").innerText = Strings.COLUMN_HAMMING_DISTANCE;
}