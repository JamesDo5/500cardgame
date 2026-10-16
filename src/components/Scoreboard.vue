<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex'

const store = useStore();
const handScores = computed(() => store.state.handScores);
const scores = computed(() => store.state.scores);
</script>

<template>
    <table class="scoreboard">
        <tbody id="scoreBoardTbody">
            <tr>
                <th id="team0name">Us</th>
                <th id="team1name">Them</th>
            </tr>
            <tr v-for="(deltas, i) in handScores" :key="i">
                <td>{{ deltas[0] }}</td>
                <td>{{ deltas[1] }}</td>
            </tr>
            <tr id="scoreTotal">
                <td class="total" id="team0total">{{ scores[0] }}</td>
                <td class="total" id="team1total">{{ scores[1] }}</td>
            </tr>
        </tbody>
    </table>
</template>

<style scoped>
table td + td, table th + th {
    border-left: 2px solid white;
}

th {
    color: white;
    text-decoration: underline;
    text-underline-offset: 3px;
}

th, tr {
    max-width: 95px;
    min-width: 80px;
    text-overflow: clip;
    overflow: hidden;
}

.total {
    border-top: 1px dashed lightslategray;
}

.scoreboard {
    color: gainsboro;
    outline-color: gainsboro;
    outline-style: solid;
    position: absolute;
    top: 75px;
    left: 75px;
    text-align: center;
    transform: scale(1.5);
    overflow-y: auto;
    max-height: 150px;
}

.portrait .scoreboard {
    top: 90px;
    left: 20px;
    transform-origin: top left;
    transform: scale(1.25);
    max-height: 120px;
}
</style>
