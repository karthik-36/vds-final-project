let deltaTableApp;

fetch("templates/view-deltas-modal-template.html")
  .then(response => response.text())
  .then(createModalVueApp2)

$('#view-deltas-modal').on('shown.bs.modal', function (e) {
  const pufSelect = document.getElementById("puf-select");
  let selectedPufIndex = pufSelect.value - 1;
  deltaTableApp.deltas = app.pufs[selectedPufIndex].getDeltas();
});

function createModalVueApp2(template) {
  deltaTableApp = new Vue({
    el: '#delta-table-app',
    template: template,
    data() {
      return {
        deltas: []
      }
    },
    methods: {
      closeModal() {
        $("#view-deltas-modal").modal("hide"); // close the modal
      }
    }
  });
}