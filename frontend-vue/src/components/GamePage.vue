<template>
    <div class="stateBanner" id="gameState">Current_Game_State</div>
    <div class="standing-bid-display" id="finalBidDisplay" style="color:white;">Standing Bid: 000</div>
    <div class="bidbox" id="bidbox">
        <span class="close-bidbox" id="closeBidBox">&times;</span>
        <table>
            <tbody>
                <tr>
                    <th></th>
                    <th style="font-size:2vw">♠</th>
                    <th style="font-size:2vw">♣</th>
                    <th style="color:red;font-size:2vw">♦</th>
                    <th style="color:red;font-size:2vw">♥</th>
                    <th style="font-size:1vw">NoTrmp</th>
                </tr>
                <tr>
                    <td style="font-size:1.5vw">6</td>
                    <td><button class="bid-amount-button">40</button></td>
                    <td><button class="bid-amount-button">60</button></td>
                    <td><button class="bid-amount-button">80</button></td>
                    <td><button class="bid-amount-button">100</button></td>
                    <td><button class="bid-amount-button">120</button></td>
                </tr>
                <tr>
                    <td style="font-size:1.5vw">7</td>
                    <td><button class="bid-amount-button">140</button></td>
                    <td><button class="bid-amount-button">160</button></td>
                    <td><button class="bid-amount-button">180</button></td>
                    <td><button class="bid-amount-button">200</button></td>
                    <td><button class="bid-amount-button">220</button></td>
                </tr>
                <tr>
                    <td style="font-size:1.5vw">8</td>
                    <td><button class="bid-amount-button">240</button></td>
                    <td><button class="bid-amount-button">260</button></td>
                    <td><button class="bid-amount-button">280</button></td>
                    <td><button class="bid-amount-button">300</button></td>
                    <td><button class="bid-amount-button">320</button></td>
                </tr>
                <tr>
                    <td style="font-size:1.5vw">9</td>
                    <td><button class="bid-amount-button">340</button></td>
                    <td><button class="bid-amount-button">360</button></td>
                    <td><button class="bid-amount-button">380</button></td>
                    <td><button class="bid-amount-button">400</button></td>
                    <td><button class="bid-amount-button">420</button></td>
                </tr>
                <tr>
                    <td style="font-size:1.5vw">10</td>
                    <td><button class="bid-amount-button">440</button></td>
                    <td><button class="bid-amount-button">460</button></td>
                    <td><button class="bid-amount-button">480</button></td>
                    <td><button class="bid-amount-button">500</button></td>
                    <td><button class="bid-amount-button">520</button></td>
                </tr>
            </tbody>
        </table>
        <!-- <button class="pass-button" type="button" id="passBidBtn" style="font-size:2vw">Pass</button> -->
        <button class="bid-amount-button" type="button" id="passBidBtn" style="font-size:2vw">Pass</button>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex'

const store = useStore()
let gameState = store.state.sharedGameState; // 0 is bidding, 1 is blind exchange, 2 is doing tricks, 3 is scoring and re-deal
let test_var_incomingbid = 140

class BidBox {
    constructor() {
        this.initializeBidBox();
    }
    async initializeBidBox() {
        try {
            // Outline from FJolt
            Array.prototype.forEach.call(document.getElementsByClassName("bid-amount-button"), (item) => {
                item.addEventListener("click", function () {
                    // bidAmount = item.innerHTML;
                    store.commit('setSharedGameState', 1)
                    document.getElementById("gameState").innerHTML = "Current_Game_State: ".concat(gameState);
                    // can also use this.innerHTML
                    document.getElementById("bottomBid").innerHTML = "My Bid: ".concat(item.innerHTML);
                    updateStandingBid();
                });
            });
            this.disableImpossibleBids();
            document.getElementById("leftBid").innerHTML = "Bid:<br />".concat("Pass");
            document.getElementById("topBid").innerHTML = "Bid: ".concat(80);
            document.getElementById("rightBid").innerHTML = "Bid:<br />".concat(140);
        } catch (error) {
            console.error('Failed to initialize bidbox:', error);
        }
    }
    disableImpossibleBids() {
        const incomingBid = updateStandingBid();
        console.log("incomingBid:", incomingBid)
        Array.prototype.forEach.call(document.getElementsByClassName("bid-amount-button"), (item) => {
            // if (item.innerHTML <= incomingBid) {
            if (item.innerHTML <= test_var_incomingbid) {
                item.disabled = true;
            }
        });
    }
    
}

function updateStandingBid() {
    // element.textContent could also be useful here
    let bidArr = Array.from(document.getElementsByClassName("bid-display")).map(
        (elem) =>
            Number.isNaN(Number(elem.innerText.slice(-3, undefined))) ? 0 : Number(elem.innerText.slice(-3, undefined))
        // Number.isNaN(Number(elem.innerText.slice(start=-3))) ? 0 : Number(elem.innerText.slice(start=-3))
    );
    console.log(bidArr)
    document.getElementById("finalBidDisplay").innerHTML = "Standing Bid: ".concat(Math.max(...bidArr));
    return Math.max(...bidArr)
}

onMounted(() => {
    const bidbox = new BidBox();

    // VueX state
    store.commit('setSharedBidBox', bidbox)
})

defineExpose({updateStandingBid})

</script>
