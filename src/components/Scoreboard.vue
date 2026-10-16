<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex'

const store = useStore();
const handScores = computed(() => store.state.handScores);
const scores = computed(() => store.state.scores);
</script>

<template>
    <div class="scoreboard">
    <table class="score-table">
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
    </div>
</template>

<style scoped>
table td + td, table th + th {
    border-left: 2px solid var(--ink);
}

th {
    color: var(--card-red);
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
    border-top: 1px dashed var(--ink-soft);
    font-weight: bold;
}

.scoreboard {
    color: var(--ink);
    background: var(--ivory);
    outline: 2px solid var(--trump-ink, var(--ink));
    box-shadow: 0 0 0 4px var(--gold), 0 6px 16px var(--shadow);
    position: absolute;
    top: 75px;
    left: 75px;
    text-align: center;
    transform: scale(1.5);
}
.score-table {
    overflow-y: auto;
    max-height: 150px;
}
:root[data-trump] .scoreboard th {
    color: var(--trump-ink);
}
:root[data-trump] .scoreboard::before {
    content: var(--trump-glyph);
    position: absolute;
    top: -11px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--ivory);
    color: var(--trump-ink);
    border: 2px solid var(--trump-ink);
    padding: 0 5px;
    font-size: 12px;
    line-height: 14px;
    font-weight: 800;
    z-index: 1;
}
:root[data-trump] .scoreboard::after {
    content: var(--trump-glyph);
    position: absolute;
    bottom: -11px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--ivory);
    color: var(--trump-ink);
    border: 2px solid var(--trump-ink);
    padding: 0 5px;
    font-size: 12px;
    line-height: 14px;
    font-weight: 800;
    z-index: 1;
}

.portrait .scoreboard {
    top: 90px;
    left: 20px;
    transform-origin: top left;
    transform: scale(1.25);
    max-height: 120px;
}
</style>
