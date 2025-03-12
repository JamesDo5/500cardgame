<script setup>
import { onMounted } from 'vue';
import { useStore } from 'vuex'

// playername IS COMPLETELY REDUNDANT, FEEL FREE TO REMOVE IT
const props = defineProps(['namepos', 'playername']);
const store = useStore();

function addTrickScore(ourScore, theirScore) {
    store.commit('addUsScore', ourScore);
    store.commit('addThemScore', theirScore);

    let newTR = document.createElement("tr");
    let newTD1 = document.createElement("td")
    newTD1.appendChild(document.createTextNode(ourScore))
    let newTD2 = document.createElement("td")
    newTD2.appendChild(document.createTextNode(theirScore))
    newTR.appendChild(newTD1);
    newTR.appendChild(newTD2);

    document.getElementById("scoreBoardTbody").insertBefore(newTR, document.getElementById("scoreTotal"));

    // Minus minus may look insane but was needed to avoid the + operator's append feature
    document.getElementById("team0total").innerHTML = document.getElementById("team0total").innerHTML - (-ourScore);
    document.getElementById("team1total").innerHTML = document.getElementById("team1total").innerHTML - (-theirScore);
    return 0;
}

defineExpose({addTrickScore})
</script>

<template>
    <button class="favorite styled" type="button">Add to favorites</button>
    <table class="scoreboard">
        <tbody id="scoreBoardTbody">
            <tr>
                <th class="teamname" id="team0name">Us</th>
                <th class="teamname" id="team1name">Them</th>
            </tr>
            <!-- <tr>
                <td class="tricktotal">0</td>
                <td class="tricktotal">0</td>
            </tr> -->
            <tr id="scoreTotal">
                <td class="total" id="team0total">0</td>
                <td class="total" id="team1total">200</td>
            </tr>
        </tbody>
    </table>
</template>

<style scoped>
/* From Erasmus stackoverflow Apr 2024 */
table td + td,  table th + th {
    border-left: 2px solid tomato;
}

th {
    color: white;
}

th, tr {
    max-width: 95px;
    min-width: 80px;
    text-overflow: clip;
    overflow: hidden;
}

.teamname {
    border-bottom: 1px solid gainsboro;
    border-collapse: collapse;
}

#scoreTotal {

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
</style>