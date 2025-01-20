<template class="james-stuff">
  <div class="stateBanner" id="gameState">Current_Game_State</div>
  <div class="standing-bid-display" id="finalBidDisplay" style="color:white;">Standing Bid: 000</div>
  <div class="game-table-container">
    <div class="game-table">
      <!-- New stuff -->
      <img class="card card-played card-played-left" id="playedCardLeft" src="../assets/mystery_card_cropped.jpg">
      <img class="card card-played card-played-top" id="playedCardTop" src="../assets/mystery_card_cropped.jpg">
      <img class="card card-played card-played-right" id="playedCardRight" src="../assets/mystery_card_cropped.jpg">
      <img class="card card-played card-played-bottom" id="playedCardBottom" src="../assets/mystery_card_cropped.jpg">
      <!-- New stuff end -->
      <div class="card-row submit-cards" id="submitCards"></div>
      <!-- New stuff start again -->
      <div class="card-stack won-tricks-bottom" id="wonTricksBottom"></div>
      <div class="card-stack won-tricks-left" id="wonTricksLeft"></div>
      <div class="card-stack won-tricks-top" id="wonTricksTop"></div>
      <div class="card-stack won-tricks-right" id="wonTricksRight"></div>
      <div class="card-stack discard-blind" id="blindDiscard"></div>
      <!-- New stuff end again -->
      <div class="bottom-bid my-bid bid-display" id="bottomBid" style="display:none;color:white;">My Bid: 000</div>
      <div class="left-bid other-bid bid-display" id="leftBid" style="display:none;color:white;">Bid:<br />000</div>
      <div class="top-bid other-bid bid-display" id="topBid" style="display:none;color:white;">Bid: 000</div>
      <div class="right-bid other-bid bid-display" id="rightBid" style="display:none;color:white;">Bid:<br />000</div>
    </div>
    <div class="card-row top-cards" id="topCards">
      <img class="card card-back" src="../assets/cat_cardback.jpg">
      <img class="card card-back" src="../assets/cat_cardback.jpg">
      <div class="card card-back">?</div>
      <div class="card card-back">?</div>
      <div class="card card-back">?</div>
      <div class="card card-back">?</div>
      <div class="card card-back">?</div>
      <div class="card card-back">?</div>
      <div class="card card-back">?</div>
      <div class="card card-back">?</div>
    </div>
    <div class="card-row bottom-cards" id="bottomCards">
      <div class="card card-front spades">4♠</div>
      <div class="card card-front spades">4♠</div>
      <div class="card card-front spades">4♠</div>
      <div class="card card-front spades">4♠</div>
      <div class="card card-front spades">4♠</div>
      <div class="card card-front spades">4♠</div>
      <div class="card card-front spades">4♠</div>
      <div class="card card-front spades">4♠</div>
      <div class="card card-front spades">4♠</div>
      <div class="card card-front spades">4♠</div>
    </div>
    <div class="card-halfrow left-cards" id="leftCards">
      <div class="section">
        <img class="card card-back section-member" src="../assets/cat_cardback.jpg">
        <img class="card card-back section-member" src="../assets/cat_cardback.jpg">
        <div class="card card-back section-member">?</div>
        <div class="card card-back section-member">?</div>
        <div class="card card-back section-member">?</div>
      </div>
      <div class="section">
        <div class="card card-back section-member">?</div>
        <div class="card card-back section-member">?</div>
        <div class="card card-back section-member">?</div>
        <div class="card card-back section-member">?</div>
        <div class="card card-back section-member">?</div>
      </div>
    </div>
    <div class="card-halfrow right-cards" id="rightCards">
      <div class="section">
        <img class="card card-back section-member" src="../assets/cat_cardback.jpg">
        <img class="card card-back section-member" src="../assets/cat_cardback.jpg">
        <div class="card card-back section-member">?</div>
        <div class="card card-back section-member">?</div>
        <div class="card card-back section-member">?</div>
      </div>
      <div class="section">
        <div class="card card-back section-member">?</div>
        <div class="card card-back section-member">?</div>
        <div class="card card-back section-member">?</div>
        <div class="card card-back section-member">?</div>
        <div class="card card-back section-member">?</div>
      </div>
    </div>
    <div class="card-row blind-cards" id="blindCards">
      <img class="card card-back" src="../assets/cat_cardback.jpg">
      <img class="card card-back" src="../assets/cat_cardback.jpg">
      <div class="card card-back">?</div>
      <div class="card card-back">?</div>
      <div class="card card-back">?</div>
    </div>
  </div>
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
// Some code from FJolt: Javascript Add Event Listener to Multiple Elements
import { ref, onMounted, inject } from 'vue';
import { useStore } from 'vuex'
import Sortable from 'sortablejs';


let bidbox
let current_played_tricks_arr = []
const { gameTable, updategameTable } = inject('gameTable')
let test_var_incomingbid = 140
const store = useStore()
const emit = defineEmits(['gametable-ready'])


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

          gameState = 1;
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

let cards = [];
let sortableHandCards;
let sortableBlindCards;
// TODO try to limit submitCards to only 1 item after gameplay starts, perhaps with filter class on the cards in hand
// ... if there's already one in the submit box -- {filter: '.filtered'}
// However this may confuse user if trying to change submitted card out by adding one then removing one
let sortableSubmitCards;

class GameTable {
  constructor() {
    /** @type {Card[]} */
    this.topCards = [];
    /** @type {Card[]} */
    this.bottomCards = [];
    /** @type {Card[]} */
    this.leftCards = [];
    /** @type {Card[]} */
    this.rightCards = [];
    /** @type {Card[]} */
    this.blindCards = [];

    this.initializeTable();
  }

  async initializeTable() {
    try {
      const hand = await this.fetchHand();
      this.distributeCards(hand);
      this.renderCards();

    } catch (error) {
      console.error('Failed to initialize game table:', error);
    }
  }

  async fetchHand() {
    try {
      const response = await fetch('http://localhost:8080/gethand');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching hand:', error);
      return this.generateMockShuffle();
    }
  }

  generateMockShuffle() {
    const suits = ['♥', '♦', '♣', '♠'];
    const values = ['4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    return Array.from({ length: 44 }, () => ({
      suit: suits[Math.floor(Math.random() * suits.length)],
      value: values[Math.floor(Math.random() * values.length)]
    })).concat({
      suit: "Joker",
      value: ""
    });
  }

  distributeCards(hand) {
    this.topCards = hand.slice(0, 10);
    this.blindCards = hand.slice(10, 15);
    this.leftCards = hand.slice(15, 25);
    this.rightCards = hand.slice(25, 35);
    this.bottomCards = hand.slice(35, 45);
  }

  renderCards() {
    this.renderCardRow('bottomCards', this.bottomCards, false);
    this.renderCardRow('blindCards', this.blindCards, true);
  }

  renderCardRow(rowId, cards, faceDown) {
    const cardsElement = document.getElementById(rowId);
    if (!cardsElement) return;

    cardsElement.innerHTML = cards.map(card =>
      `<div class="card ${faceDown ? 'card-back' : `card-front ${this.getSuitClass(card.suit)} `}">
                ${faceDown ? '?' : `${card.value}${card.suit}`}
             </div>`
    ).join('');
  }

  fetchBlind() {
    // TODO make this function a call to server and if fails use preset this.blindcards if in testing env
    let faceDown = true;

    const blindElement = document.getElementById('blindCards');
    if (!blindElement) return;

    if (blindElement.childNodes[0].classList.contains('card-back')) {
      // The goal of this function is to flip the blind so this bool is opposite of what is currently rendered
      faceDown = false;
    }

    // Now rerender the blind with the new faceDown
    blindElement.innerHTML = this.blindCards.map(card =>
      `<div class="card ${faceDown ? 'card-back' : `card-front ${this.getSuitClass(card.suit)}`} ">
                ${faceDown ? '?' : `${card.value}${card.suit}`}
             </div>`
    ).join('');

    // Note the use of faceDown to determine whether they are disabled
    sortableBlindCards.option("disabled", faceDown); // set

    return 0
  }

  submitBlind() {
    const blindElement = document.getElementById('blindCards');
    if (!blindElement) return 1;

    // Disable sort during this function to prevent edge case inconsistencies
    sortableBlindCards.option("disabled", true);

    let blindSubmitArr = []

    console.log("blindElement.childNodes.length:", blindElement.childNodes.length)
    if (!(blindElement.childNodes.length === 5)) {
      // TODO raise error to user
      console.log("houston we have a problem! can't submit more or fewer than 5 card blind")
      // Reenable sorting so user can fix the issue
      sortableBlindCards.option("disabled", false);
      return 1
    }

    for (let i = 0; i < blindElement.childNodes.length; i++) {
      if (blindElement.childNodes[i].classList.contains('card-back')) {
        // TODO raise error to user
        console.log("houston we have a problem! can't submit cards which are facedown")
        blindSubmitArr = []
        sortableBlindCards.option("disabled", false);
        return 1
      }
      blindSubmitArr.push(blindElement.childNodes[i].innerHTML)
    }

    // TODO the code to send blind to server. If it worked do this block
    if (true) {
      sortableSubmitCards.option("disabled", false);
      blindElement.innerHTML = "";
    }

    return 0
  }

  submitTrick() {
    const submitElement = document.getElementById('submitCards');
    if (!submitElement) return 1;

    // Disable sort during this function to prevent edge case inconsistencies
    sortableSubmitCards.option("disabled", true);

    if (!(submitElement.childNodes.length === 1)) {
      // TODO raise error to user
      console.log("houston we have a problem! can't submit more or fewer than 1 card for trick")
      // Reenable sorting so user can fix the issue
      sortableSubmitCards.option("disabled", false);
      return 1
    }

    if (submitElement.childNodes[0].classList.contains('card-back')) {
      console.log("houston we have a problem! can't submit cards which are facedown")
      blindSubmitArr = []
      sortableSubmitCards.option("disabled", false);
      return 1
    }

    // TODO the code to send trick card to server. If it worked do this block
    if (true) {
      submitElement.innerHTML = "";
    }

    // Reenable sorting so next card can be played
    sortableSubmitCards.option("disabled", false);
    return 0
  }

  incomingTrickPlay() {
    const helloTODO = 1;
  }

  getSuitClass(suit) {
    switch (suit) {
      case '♥': return 'hearts';
      case '♦': return 'diamonds';
      case '♣': return 'clubs';
      case '♠': return 'spades';
      case 'Joker': return 'joker';
      default: return '';
    }
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

function displayBidWinner() {

}

function displayTrickWinner() {

}

function displayGameWinner() {

}

onMounted(() => {
  // 0 is to the player, 1 is to the left, 2 is top, and 3 is to the right
  let lastWinner = -1;
  // 0 is bidding, 1 is blind exchange, 2 is doing tricks, 3 is scoring and re-deal
  let gameState = 0;

  // Initialize the game table when the script loads
  document.addEventListener('DOMContentLoaded', () => {
    const gt = new GameTable()
    bidbox = new BidBox();

    updategameTable(gt)
    store.commit('setSharedGameTable', gt)
    store.commit('setSharedNumber', 77777)
    console.log('we set gt state:',gt)
    console.log('logging gt get:',store.state.sharedGameTable)

    emit('gametable-ready')
  });

  sortableHandCards = new Sortable(
    document.getElementById('bottomCards'),
    { disabled: false, group: 'shared', animation: 1000 }
  );
  sortableBlindCards = new Sortable(
    document.getElementById('blindCards'),
    { disabled: true, group: 'shared', animation: 1000 }
  );
  sortableSubmitCards = new Sortable(
    document.getElementById('submitCards'),
    { disabled: true, group: 'shared', animation: 1000 }
  );
})
</script>

<style scoped>
/* There is no other sub-class, this is just facedown tricks and blind */
.card-stack {
  width: 70px;
  height: 100px;
  border-radius: 8px;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  will-change: transform;
  background-color: #3498db;
  color: white;
  font-weight: bold;
  position: absolute;
  display: none;
}

.won-tricks-left {
  top: 60%;
  left: 8%;
  transform: translate(-50%, -50%) rotate(90deg);
}

.won-tricks-top {
  top: 10%;
  left: 35%;
  transform: translate(-50%, -50%) rotate(180deg);
}

.won-tricks-right {
  top: 40%;
  left: 92%;
  transform: translate(-50%, -50%) rotate(270deg);
}

.won-tricks-bottom {
  top: 90%;
  left: 70%;
  /* No idea why but putting this translate in card-stack created completely different behavior...? */
  transform: translate(-50%, -50%);
}

.discard-blind {
  top: 90%;
  left: 25%;
  transform: translate(-50%, -50%) rotate(0deg);
  /* transform: translate(-50%, -50%) rotate(270deg); */
}

.card-played {
  position: absolute;
  display: none;
}

.card-played-left {
  top: 50%;
  left: 40%;
  transform: translate(-50%, -50%) rotate(90deg);
  z-index: 3;
}

.card-played-top {
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(180deg);
  z-index: 2;
}

.card-played-right {
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%) rotate(270deg);
  z-index: 1;
}

.card-played-bottom {
  top: 60%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
}

.submit-cards {
  bottom: -40px;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px dashed #7f8c8d;
  padding: 10px;
  min-width: 70px;
  min-height: 100px;
}
</style>
