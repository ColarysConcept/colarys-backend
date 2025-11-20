<template>
  <div>
    <h1>{{ title }}</h1>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th v-for="(col, index) in displayedColumns" :key="index">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="table-group-divider">
        <tr v-for="(row, i) in rows" :key="i">
          <td v-for="(col, index) in displayedColumns" :key="index">
            <span v-if="col.field === 'imgurl'" v-html="row[col.field]"></span>
            <span v-else>{{ row[col.field] }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "DataTable",
  props: {
    title: { type: String, required: true },
    columns: { type: Array, required: true },
    rows: { type: Array, required: true }
  },
  data() {
    return {
      isMobile: window.innerWidth < 768 // ✅ Détection mobile
    };
  },
  computed: {
    displayedColumns() {
      // ✅ Si mobile → ne garde que 3 colonnes max
      return this.isMobile ? this.columns.slice(0, 3) : this.columns;
    }
  },
  mounted() {
    window.addEventListener("resize", this.checkScreen);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.checkScreen);
  },
  methods: {
    checkScreen() {
      this.isMobile = window.innerWidth < 768;
    }
  }
};
</script>
