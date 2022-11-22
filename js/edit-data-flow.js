let editDataApp;
fetch("templates/template.html")
  .then(response => response.text())
  .then(createModalVueApp)

function createModalVueApp(template) {
  editDataApp = new Vue({
    el: '#edit-data-app',
    template: template,
    data() {
      return {
        mu: 0,
        sigma: 1,
        stages: 4,
        pufs: 64,
        challenges: [],
        activeSection: 1,
        deltas: [],
        selectedPufIndex: 0,
        selectedDelta: {
          value: 0,
          index: -1,
          level: 0,
        }
      }
    },
    computed: {
      stageOptions() {
        let os = [];
        for (let i = 1; i <= this.stages; i++) { os.push(i); } return os;
      }
    },
    methods: {
      next() {
        let deltas = generateRandomDeltas({
          stages: this.stages,
          mean: this.mu,
          variance: this.sigma,
          pufCount: this.pufs
        });
        this.deltas = deltas;
        this.activeSection = 3;
        Vue.nextTick(() => this.renderDeltaChart());
      },
      renderMainMatrix() {
        let pufs = [];
        let currentId = 1;
        for (let pufDeltas of this.deltas) {
          let options = {
            initialDeltas: pufDeltas,
            fromDeltas: true
          };
          let puf = new PUF(this.stages, options);
          puf.setId(currentId); // kind of hacky
          currentId++;
          pufs.push(puf);
        }
        app.pufs = pufs; // set the global app state to use the new PUFs
        if (this.challenges.length === 0) {
          app.challenges = generateRandomChallenges(this.stages, this.pufs); // set the global app state to use the new challenges
          Utils.toast("Challenges generated randomly");
        } else {
          app.challenges = this.challenges;
        }
        computeNewStateData(this.stages, pufs.length + 0);
        syncInputsWithState();
        renderMatrix(data); // re-render the matrix using the new PUFs

        // re-render the side charts as well
        const pufNumberSelect = document.getElementById("puf-select");
        renderBarCharts(pufNumberSelect.value);
        renderHistogram(pufNumberSelect.value);
        this.closeModal();
      },
      onPufChange() {
        console.log(this.selectedPufIndex);
        this.selectedDelta.index = -1;
        this.selectedDelta.value = 0;
        this.selectedDelta.level = 0;
        this.renderDeltaChart();
      },
      onUpperBarClicked(event, index) {
        const { selectedPufIndex } = this;
        this.selectedDelta.value = this.deltas[selectedPufIndex][index][0];
        this.selectedDelta.index = index;
        this.selectedDelta.level = 0;
      },
      onLowerBarClicked(event, index) {
        const { selectedPufIndex } = this;
        this.selectedDelta.value = this.deltas[selectedPufIndex][index][1];
        this.selectedDelta.index = index;
        this.selectedDelta.level = 1;
      },
      renderDeltaChart() {
        let { selectedPufIndex } = this;
        let data = this.deltas[selectedPufIndex];
        let upperChart = BarChart(data, {
          x: (d, i) => i + 1,
          y: d => d[0],
          yFormat: "",
          yLabel: "Value 𝛿(0)",
          yDomain: [-3.5, 3.5], // [ymin, ymax]
          width: 1000,
          height: 250,
          color: "steelblue",
          onBarClicked: this.onUpperBarClicked
        });
        let container1 = document.getElementById("upper-chart-container");
        clearContainer(container1);
        container1.appendChild(upperChart);

        let lowerChart = BarChart(data, {
          x: (d, i) => i + 1,
          y: d => d[1],
          yFormat: "",
          yLabel: "Value 𝛿(1)",
          yDomain: [-3.5, 3.5], // [ymin, ymax]
          width: 1000,
          height: 250,
          color: "steelblue",
          onBarClicked: this.onLowerBarClicked
        });
        let container2 = document.getElementById("lower-chart-container");
        clearContainer(container2);
        container1.appendChild(lowerChart);
      },
      resetControls() {
        this.selectedDelta.value = 0;
        this.selectedDelta.index = -1;
        this.selectedDelta.level = 0;
        this.selectedPufIndex = 0;
        this.challenges = [];
      },
      saveDeltaValue() {
        let { selectedPufIndex } = this;
        let { level, index, value } = this.selectedDelta;
        this.deltas[selectedPufIndex][index][level] = value;
        this.renderDeltaChart();
      },
      closeModal() {
        this.activeSection = 1;
        this.resetControls();
        $("#upload-data-modal").modal("hide"); // close the modal
      },
      async processFile() {
        const fileInput = document.getElementById("file-input");
        if (fileInput.files.length === 0) {
          return;
        }
        const selectedFile = fileInput.files[0];
        try {
          let json = JSON.parse(await selectedFile.text());
          console.log(json);
          if (json.chal_list) {
            // process challenges
            let challenges = json.chal_list.map(string => Challenge.createChallengeFromBinaryString(string));
            this.challenges = challenges;
            Utils.toast("challenges read from file");
          }
          const { puf_delta_matrix } = json;
          // get deltas
          // extract the delta values from the JSON file and store them into the app state
          // so that the user can edit them in the next section
          let stages = puf_delta_matrix[0].length / 2;
          this.pufs = puf_delta_matrix.length;
          this.deltas = puf_delta_matrix.map(dls => {
            const deltas = [];
            for (let i = 0; i < stages; i++) {
              deltas.push({
                0: dls[i],
                1: dls[i + stages]
              });
            }
            return deltas;
          });
          this.stages = stages;
          this.activeSection = 3;
          Vue.nextTick(() => this.renderDeltaChart());
          console.log(json);
        } catch (e) {
          console.log("Something went wrong")
        }
      }
    }
  });
}