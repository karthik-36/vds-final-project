let app1;
fetch("templates/template.html")
  .then(response => response.text())
  .then(createModalVueApp)

function createModalVueApp(template) {
  app1 = new Vue({
    el: '#vue-app',
    template: template,
    data() {
      return {
        hi: "tr",
        mu: 0,
        sigma: 1,
        stages: 4,
        s: 1,
        activeSection: 1
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
        this.activeSection = 3;
        Vue.nextTick(() => this.renderDeltaChart());
      },
      renderDeltaChart() {
        let data = [{ 0: 1 }, { 0: 2 }, { 0: 3 }, { 0: 4 },];
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
        let container1 = document.getElementById("xx");
        clearContainer(container1);
        container1.appendChild(upperChart);
      }
    }
  });
}