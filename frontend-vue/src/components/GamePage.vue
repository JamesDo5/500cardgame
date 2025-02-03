<template>
    <div class="stateBanner" id="gameState">Current_Game_State</div>
    <div class="standing-bid-display" id="finalBidDisplay" style="color:white;">Standing Bid: 000</div>
    <div class="bidbox" id="bidbox">
        <div class="bottom-bid my-bid bid-display" id="bottomBid" style="color:white;">My Bid: 000</div>
        <div class="left-bid other-bid bid-display" id="leftBid" style="color:white;">Bid:<br />000
        </div>
        <div class="top-bid other-bid bid-display" id="topBid" style="color:white;">Bid: 000</div>
        <div class="right-bid other-bid bid-display" id="rightBid" style="color:white;">Bid:<br />000
        </div>
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
let gameState = store.state.sharedGameState; //-1:uninitialized, 0:dealing/shuffling, 1:hands dealt, 2:I bid, 3:all bids in, blind dealt, 4:I submitted blind, 5:trick play, 6:game over
let dealer = store.state.dealer;

class BidBox {
    constructor() {
        // -1 is none, 0 is 'Pass', 40+ is a bid
        this.bids = [-1, -1, -1, -1];

        this.initializeBidBox();
    }

    async initializeBidBox() {
        try {
            // Outline from FJolt
            Array.prototype.forEach.call(document.getElementsByClassName("bid-amount-button"), (item) => {
                item.addEventListener("click", function () {

                    // can also use this.innerHTML
                    document.getElementById("bottomBid").innerHTML = "My Bid: ".concat(item.innerHTML);
                    this.calcAndUpdateVisualStandingBid();
                });
            });
            this.disableImpossibleBids();
            this.updateBidDisplays();
        } catch (error) {
            console.error('Failed to initialize bidbox:', error);
        }
    }

    disableImpossibleBids() {
        const incomingBid = this.calcAndUpdateVisualStandingBid();
        console.log("incomingBid:", incomingBid)
        Array.prototype.forEach.call(document.getElementsByClassName("bid-amount-button"), (item) => {
            if (item.innerHTML <= this.highestBid) {
                item.disabled = true;
            }
        });
    }

    calcAndUpdateVisualStandingBid() {
        // element.textContent could also be useful here
        const bidArr = Array.from(document.getElementsByClassName("bid-display")).map(
            (elem) =>
                Number.isNaN(Number(elem.innerText.slice(-3, undefined))) ? 0 : Number(elem.innerText.slice(-3, undefined))
            // Number.isNaN(Number(elem.innerText.slice(start=-3))) ? 0 : Number(elem.innerText.slice(start=-3))
        );
        console.log(bidArr)
        document.getElementById("finalBidDisplay").innerHTML = "Standing Bid: ".concat(Math.max(...bidArr));
        return Math.max(...bidArr)
    }

    updateBidDisplays() {
        dealer = store.getters.getDealer();
        const index2PosName = ["bottom", "left", "top", "right"]

        for (let i = 0; i < 4; i++) {
            let pos = (dealer + i) % 4

            if (this.bids[pos] === -1) {
                console.log("INFO updated bid displays from", dealer, "to", pos, ". Any others haven't bid yet.")
                break;
            }
            // Get rid of this function... edit: why? Seems to detect if anything went wrong in bidding
            if (this.bids[pos] < this.bids[(pos - 1) % 4] && pos !== dealer && this.bids[pos] > 0) {
                console.log("ERROR Illegal bid found at", pos, ":", this.bids[pos], "is < prev bidder:", this.bids[(pos - 1) % 4], ". Dealer was:", dealer)
                break;
            }

            let prefix = "Bid:<br />";
            if (pos === 0) {
                prefix = "My Bid: ";
            }
            if (pos === 2) {
                prefix = "Bid: ";
            }

            console.log("INFO getting element with id:", index2PosName[pos] + "Bid", "pos:", pos, "dealer:", dealer)
            document.getElementById(index2PosName[pos] + "Bid").innerHTML = prefix.concat(this.bids[pos]);

            // 0 is pass
            if (this.bids[pos] === 0) {
                document.getElementById(index2PosName[pos] + "Bid").innerHTML = prefix.concat("Pass");
            }
        }

        document.getElementById("finalBidDisplay").innerHTML = "Standing Bid: ".concat(this.getHighestBid());

        return 0
    }

    getHighestBid() {
        return Math.max(...this.bids)
    }

    submitBid() {
        let myBid =
            Number.isNaN(Number(document.getElementById("bottomBid").innerText.slice(-3, undefined))) ?
                0 :
                Number(document.getElementById("bottomBid").innerText.slice(-3, undefined));

        if (this.bids[0] !== -1) {
            // TODO raise this error to user, they should get a little indicator that they already bid somehow
            console.log("WARN somehow we already have our bid:", this.bids[0], "but we will update it to:", myBid);
            return 1;
        }

        // Update bids source of truth
        this.bids[0] = myBid;

        // TODO the code to send bid to server. If it worked do this block
        if (true) {
            // Push card from submit box into played card table section
            playedCardBottomElement.style.display = "inline";
            playedCardBottomElement.src = submitElement.childNodes[0].src;
            submitElement.innerHTML = "";
            // Change state tracker
            this.playedCards[0] = this.parseCardFromSrc(submitElement.childNodes[0].src);
        }
    }

    incomingBid(pos, bid) {
        // Expecting pos as integer, 0 is you, 1 is left, 2 top, 3 right.

        if (bid <= this.getHighestBid() && bid !== 0) {
            console.log("Incoming bid not allowed, highest current bid:", this.highestBid, "But incoming bid:", bid);
            return 1;
        }
        if (pos < 0 || pos > 3) {
            console.log("Fake position not allowed:", pos, "is >3 or <0");
            return 1;
        }
        if (this.bids[pos] !== -1) {
            // TODO SEND error MESSAGE TO SERVER AND SET UP RESILIENCY HERE
            console.log("ERROR There's already a bid for pos", pos, ".");
            return 1;
        }

        // TODO check who dealt and whether this pos is actually next bidder (THIS IS IN DEV BUTTONS FOR NOW)

        // Update bids source of truth
        this.bids[pos] = bid;

        // Visually render bids
        this.updateBidDisplays();

        if (this.isBiddingOver()) {
            this.endBidding();
        }

        return 0
    }

    isBiddingOver() {
        if (this.bids.has(-1)) {
            return false;
        }
        return true;
    }

    endBidding() {
        const bid2Suit = new Map([['1', 'n'], ['2', 's'], ['3', 'c'], ['4', 'd'], ['5', 'h']]);
        const winningSuit = bid2Suit.get((this.getHighestBid() / 20) % 5)
        store.commit('setTrumpSuit', winningSuit);
        store.commit('setWinningBid', this.getHighestBid());

        const gt = store.getters.getGameTable();

        // The person who won the bid plays first 
        gt.lastTrickWinner = this.bids.indexOf(this.getHighestBid());

        // Don't need to wipe bid table, that will be done at end of a hand

        // TODO Update board for which player won bid
    }
}

onMounted(() => {
    // store.commit('setSharedGameState', 1)
    document.getElementById("gameState").innerHTML = "Current_Game_State: ".concat(gameState);

    const bidbox = new BidBox();

    // VueX state
    store.commit('setSharedBidBox', bidbox)
})

</script>

<style scoped>
.bidbox {
    display: none;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 20px;
    border-radius: 5px;
    text-align: center;
    z-index: 9;
}

.close-bidbox {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
}

.standing-bid-display {
    position: absolute;
    top: 25px;
    right: 25px;
    font-size: 2vw;
}

.final-bid-display {
    position: absolute;
    top: 50px;
    right: 11px;
    font-size: 2vw;
}

.bid-display {
    position: absolute;
    transform: translate(-50%, 50%);
    font-size: 2vw;
}
.bottom-bid {
    bottom: -60px;
    left: 50%;
}
.left-bid {
    left: -100px;
    bottom: 50%;
}
.top-bid {
    top: -90px;
    left: 50%;
}
.right-bid {
    right: -160px;
    bottom: 50%;
}

table {
    border-collapse: collapse;
    margin: 0 auto;
}

button.bid-amount-button {
    width: 70px;
    height: 50px;
    font-size: 2vw;
    min-width: fit-content;
}
</style>