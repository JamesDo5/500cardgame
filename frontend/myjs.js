// Code from tahazsh
// Code from FJolt: Javascript Add Event Listener to Multiple Elements
// Code from Jess Mitchell of DigitalOcean

// Card type definition using JSDoc
/**
 * @typedef {Object} Card
 * @property {string} suit
 * @property {string|number} value
 */

let gametable
let statebuttons
let bidbox

// 0 is bidding, 1 is blind exchange, 2 is doing tricks, 3 is scoring and re-deal
let gameState = 0;

let bidAmount = -1;
let incomingBid = 280;


class BidBox {
    constructor() {
        this.initializeBidBox();
    }

    async initializeBidBox() {
        try {
            // Outline from FJolt
            Array.prototype.forEach.call(document.getElementsByClassName("bid-amount-button"), (item) => {
                item.addEventListener("click", function() {
                    // can also use this.innerHTML
                    bidAmount = item.innerHTML;

                    gameState = 1;
                    document.getElementById("gameState").innerHTML = "Current_Game_State: ".concat(gameState);
                    document.getElementById("bidDisplay").innerHTML = "My Bid: ".concat(bidAmount);

                    updateStandingBid();
                });
            });

            this.disableImpossibleBids();

            document.getElementById("leftBid").innerHTML = "Bid:<br />".concat(100);
            document.getElementById("topBid").innerHTML = "Bid: ".concat("Pass");
            document.getElementById("rightBid").innerHTML = "Bid:<br />".concat(300);
        } catch (error) {
            console.error('Failed to initialize bidbox:', error);
        }
    }

    disableImpossibleBids() {
        Array.prototype.forEach.call( document.getElementsByClassName("bid-amount-button") , (item) => {
            if (item.innerHTML <= incomingBid) {
                item.disabled = true;
            }
        });
    }
}

class StateButtons {
    constructor() {
        this.initializeStateButtons();
    }

    async initializeStateButtons() {
        try {
            // document.getElementById("openBidBoxBtn");
            document.getElementById("submitBidBtn").style.transform = `translateX(75px)`;
            document.getElementById("startPlayBtn").style.transform = `translateX(150px)`;
            document.getElementById("submitTrickBtn").style.transform = `translateX(225px)`;
        } catch (error) {
            console.error('Failed to initialize buttons:', error);
        }
    }
}

let playerHandCards;
let blindCards;
let cards = [];

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

            playerHandCards = document.getElementById("bottomCards");
            blindCards = document.getElementById("bottomCards");

            if (!playerHandCards) return;

            playerHandCards.addEventListener('mousedown', dragStart);
            // TODO move this out of here or find way to remove it when doing the blind and card stuff
            // playerHandCards.addEventListener('mousedown', dragStart);
              
            document.addEventListener('mouseup', dragEnd);
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
            `<div class="card ${faceDown ? 'card-back' : `card-front ${this.getSuitClass(card.suit)} is-idle`}">
                ${faceDown ? '?' : `${card.value}${card.suit}`}
             </div>`
        ).join('');
    }

    fetchBlind() {
        // TODO make this function a call to server and if fails use preset this.blindcards 
        let faceDown = true;

        const cardsElement = document.getElementById('blindCards');
        if (!cardsElement) return;

        if (cardsElement.childNodes[0].classList.contains('card-back')) {
            // The goal of this function is to flip the blind so this bool is opposite of what is currently rendered
            faceDown = false;
        }

        // Now rerender the blind with the new faceDown
        cardsElement.innerHTML = this.blindCards.map(card => 
            `<div class="card ${faceDown ? 'card-back' : `card-front ${this.getSuitClass(card.suit)}`} is-idle">
                ${faceDown ? '?' : `${card.value}${card.suit}`}
             </div>`
        ).join('');
    }

    getSuitClass(suit) {
        switch(suit) {
            case '♥': return 'hearts';
            case '♦': return 'diamonds';
            case '♣': return 'clubs';
            case '♠': return 'spades';
            case 'Joker': return 'joker';
            default: return '';
        }
    }
}


// Initialize the game table when the script loads
document.addEventListener('DOMContentLoaded', () => {
    gametable = new GameTable();
    // Initialize the buttons when the script loads
    statebuttons = new StateButtons();
    bidbox = new BidBox();
});

document.getElementById("openBidBoxBtn").addEventListener("click", function() {
    gameState = 0;
    document.getElementById("bidbox").style.display = document.getElementById("bidbox").style.display === "inline" ? "none" : "inline";
    document.getElementById("bidDisplay").style.display = document.getElementById("bidDisplay").style.display === "inline" ? "none" : "inline";
    document.getElementById("leftBid").style.display = document.getElementById("leftBid").style.display === "inline" ? "none" : "inline";
    document.getElementById("topBid").style.display = document.getElementById("topBid").style.display === "inline" ? "none" : "inline";
    document.getElementById("rightBid").style.display = document.getElementById("rightBid").style.display === "inline" ? "none" : "inline";
    
    updateStandingBid();
});

document.getElementById("closeBidBox").addEventListener("click", function() {
    document.getElementById("bidbox").style.display = "none";
    document.getElementById("bidDisplay").style.display = "none";
});


let allowY = false;

document.getElementById("submitBidBtn").addEventListener("click", function() {
    if (gameState === 0) {
        gameState = 1;
        gametable.fetchBlind();
        allowY = !allowY;
        playerHandCards.addEventListener('mousedown', dragStart);    
    }
});

// document.getElementById("startPlayBtn").addEventListener("click", async function() {
// });

function updateStandingBid() {
    // element.textContent could also be useful here
    let bidArr = Array.from(document.getElementsByClassName("bid-display")).map(
        (elem) => 
        Number.isNaN(Number(elem.innerText.slice(start=-3))) ? 0 : Number(elem.innerText.slice(start=-3))
    );
    console.log(bidArr)

    document.getElementById("finalBidDisplay").innerHTML = "Standing Bid: ".concat(Math.max(...bidArr));
}


let draggableCard;
let pointerStartX;
let pointerStartY;

// Adapted from Taha Shashtari
function dragStart(e) {
    
    // if (e.target.classList.contains('card')) {
    if (e.target.classList.contains('card-front')) {
        draggableCard = e.target;
    }
    if (!draggableCard) return;

    pointerStartX = e.clientX;
    pointerStartY = e.clientY;

    initDraggableCard();
    initCardsState();

    document.addEventListener('mousemove', drag);
}    

// Adapted from Taha Shashtari
function drag(e) {
    if (!draggableCard) return;

    const pointerOffsetX = e.clientX - pointerStartX;
    draggableCard.style.transform = `translate(${pointerOffsetX}px, 0px)`;

    if (allowY) {
        const pointerOffsetY = e.clientY - pointerStartY;
        draggableCard.style.transform = `translate(${pointerOffsetX}px, ${pointerOffsetY}px)`;
    }

    updateIdleCardsStateAndPosition();
}

// Adapted from Taha Shashtari
function dragEnd() {
    if (!draggableCard) return;

    // Next to implement
    applyNewCardsOrder();

    cards = [];
    unsetDraggableCard();
    unsetCardState();

    document.removeEventListener('mousemove', drag);
}

// Adapted from Taha Shashtari
function initDraggableCard() {
    draggableCard.classList.remove('is-idle');
    draggableCard.classList.add('is-draggable');
}

// Adapted from Taha Shashtari
function unsetDraggableCard() {
    delete draggableCard.style;
    draggableCard.classList.remove('is-draggable');
    draggableCard.classList.add('is-idle');
    draggableCard = null;
}

// Adapted from Taha Shashtari
function initCardsState() {
    getIdleCards().forEach((card, i) => {
        if (getAllCards().indexOf(draggableCard) > i) {
            card.dataset.isAbove = '';
        }
    })
}

// From Taha Shashtari
function getAllCards() {
    let cards = [];
    if (!cards?.length) {
        // cards = Array.from(playerHandCards.querySelectorAll('.card'));
        cards = Array.from(playerHandCards.getElementsByClassName("card"));
    }
    return cards;
}

// Adapted from Taha Shashtari
function getIdleCards() {
    return getAllCards().filter((card) => card.classList.contains('is-idle'));
}

// From Taha Shashtari
function updateIdleCardsStateAndPosition() {
    const draggableCardRect = draggableCard.getBoundingClientRect();
    const draggableCardX = draggableCardRect.left + (draggableCardRect.width / 2);
    const ITEMS_GAP = 10;

    // Shashtari: "update state"
    getIdleCards().forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const cardX = cardRect.left + (cardRect.width / 2);
        if (isCardAbove(card)) {
            if (draggableCardX <= cardX) {
                card.dataset.isToggled = '';
            } else {
                delete card.dataset.isToggled;
            }
        } else {
            if (draggableCardX >= cardX) {
                card.dataset.isToggled = '';
            } else {
                delete card.dataset.isToggled;
            }
        }
    })

    // Shashtari: "update position"
    getIdleCards().forEach((card) => {
        if (isCardToggled(card)) {
            const direction = isCardAbove(card) ? 1 : -1;
            card.style.transform = `translateX(${
                direction * (draggableCardRect.width + ITEMS_GAP)
            }px)`;
        } else {
            card.style.transform = '';
        }
    })
}

// From Taha Shashtari
function isCardAbove(card) {
    return card.hasAttribute('data-is-above');
}

// From Taha Shashtari
function isCardToggled(card) {
    return card.hasAttribute('data-is-toggled');
}      

// From Taha Shashtari
function unsetCardState() {
    getIdleCards().forEach((card, i) => {
        delete card.dataset.isAbove;
        delete card.dataset.isToggled;
        card.style.transform = '';
    })
}

// From Taha Shashtari
function applyNewCardsOrder() {
    const reorderedCards = [];
  
    getAllCards().forEach((card, index) => {
        if (card === draggableCard) {
            return;
        }
        if (!isCardToggled(card)) {
            reorderedCards[index] = card;
            return;
        }
        const newIndex = isCardAbove(card) ? index + 1 : index - 1;
        reorderedCards[newIndex] = card;
    })
    
    for (let index = 0; index < getAllCards().length; index++) {
        const card = reorderedCards[index];
        if (typeof card === 'undefined') {
            reorderedCards[index] = draggableCard;
        }
    }

    reorderedCards.forEach((card) => {
        playerHandCards.appendChild(card);
    })
}
