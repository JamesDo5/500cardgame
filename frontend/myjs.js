// help from tahazsh
// small help from FJolt: Javascript Add Event Listener to Multiple Elements

// Card type definition using JSDoc
/**
 * @typedef {Object} Card
 * @property {string} suit
 * @property {string|number} value
 */

let gameState = 0
let bidAmount = -1

class BidBox {
    constructor() {
        this.initializeBidBox();
    }

    async initializeBidBox() {
        try {
            document.getElementById("openBidBoxBtn").addEventListener("click", function() {
                document.getElementById("bidbox").style.display = document.getElementById("bidbox").style.display === "inline" ? "none" : "inline";
                document.getElementById("bidDisplay").style.display = document.getElementById("bidDisplay").style.display === "inline" ? "none" : "inline";
            });
            document.getElementById("closeBidBox").addEventListener("click", function() {
                document.getElementById("bidbox").style.display = "none";
                document.getElementById("bidDisplay").style.display = "none";
            });

            // Style from FJolt
            Array.prototype.forEach.call(document.getElementsByClassName("bid-amount"), (item) => {
                item.addEventListener("click", function() {
                    // can also use this.innerHTML
                    bidAmount = item.innerHTML
                    document.getElementById("bidDisplay").innerHTML = "My Bid: ".concat(bidAmount)
                });
            });
        } catch (error) {
            console.error('Failed to initialize bidbox:', error);
        }
    }
}

class StateButtons {
    constructor() {
        this.initializeStateButtons();
    }

    async initializeStateButtons() {
        try {
            // document.getElementById("openBidBoxBtn")
            document.getElementById("submitBidBtn").style.transform = `translateX(75px)`
            document.getElementById("startPlayBtn").style.transform = `translateX(150px)`
            document.getElementById("submitTrickBtn").style.transform = `translateX(225px)`
        } catch (error) {
            console.error('Failed to initialize buttons:', error);
        }
    }
}

let cardRow

let draggableCard

let pointerStartX
let pointerStartY

let cards = []

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

            cardRow = document.getElementById("bottomCards")

            if (!cardRow) return

            cardRow.addEventListener('mousedown', dragStart)
              
            document.addEventListener('mouseup', dragEnd)
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
        this.renderCardRow('topCards', this.topCards, true);
        this.renderCardRow('bottomCards', this.bottomCards, false);
        this.renderCardDoublerow('leftCards', this.leftCards, true);
        this.renderCardDoublerow('rightCards', this.rightCards, true);
        this.renderCardRow('blindCards', this.blindCards, true);
    }

    renderCardRow(rowId, cards, faceDown) {
        const cardsElement = document.getElementById(rowId);
        if (!cardsElement) return;

        cardsElement.innerHTML = cards.map(card => 
            `<div class="card ${faceDown ? 'card-back' : `card-front ${this.getSuitClass(card.suit)}`} is-idle">
                ${faceDown ? '?' : `${card.value}${card.suit}`}
             </div>`
        ).join('');
    }

    renderCardDoublerow(rowId, cards, faceDown) {
        const cardsElement = document.getElementById(rowId);
        if (!cardsElement) return;
        const firstCards = cards.slice(0, 5);
        const nextCards = cards.slice(5, 10);

        var table = document.createElement('table');
        var tableBody = document.createElement('tbody');

        var tableRowTopCards = document.createElement('tr');
        var tableCellTopCards = document.createElement('td');
        tableCellTopCards.classList.add('horizontal-divs');
        tableCellTopCards.innerHTML = firstCards.map(card => 
            `<div class="card ${faceDown ? 'card-back' : `card-front ${this.getSuitClass(card.suit)}`}">
                ${faceDown ? '?' : `${card.value}${card.suit}`}
             </div>`
        ).join('');

        var tableRowBottomCards = document.createElement('tr');
        var tableCellBottomCards = document.createElement('td');
        tableCellBottomCards.classList.add('horizontal-divs');
        tableCellBottomCards.innerHTML = nextCards.map(card => 
            `<div class="card ${faceDown ? 'card-back' : `card-front ${this.getSuitClass(card.suit)}`}">
                ${faceDown ? '?' : `${card.value}${card.suit}`}
             </div>`
        ).join('');
        

        tableRowTopCards.appendChild(tableCellTopCards);
        tableRowBottomCards.appendChild(tableCellBottomCards);
        tableBody.appendChild(tableRowTopCards);
        tableBody.appendChild(tableRowBottomCards);
        table.appendChild(tableBody);
        cardsElement.appendChild(table);

        // rowElement.innerHTML = firstCards.map(card => 
        //     `<div class="card ${faceDown ? 'card-back' : `card-front ${this.getSuitClass(card.suit)}`}">
        //         ${faceDown ? '?' : `${card.value}${card.suit}`}
        //      </div>`
        // ).join('');

        // var clone = rowElement.cloneNode(true);
        // clone.innerHTML = nextCards.map(card => 
        //     `<div class="card ${faceDown ? 'card-back' : `card-front ${this.getSuitClass(card.suit)}`}">
        //         ${faceDown ? '?' : `${card.value}${card.suit}`}
        //      </div>`
        // ).join('');
    }

    getSuitClass(suit) {
        switch(suit) {
            case '♥': return 'hearts';
            case '♦': return 'diamonds';
            case '♣': return 'clubs';
            case '♠': return 'spades';
            default: return '';
        }
    }
}

// Initialize the game table when the script loads
document.addEventListener('DOMContentLoaded', () => {
    new GameTable();
});

// Initialize the buttons when the script loads
document.addEventListener('DOMContentLoaded', () => {
    new StateButtons();
});

document.addEventListener('DOMContentLoaded', () => {
    new BidBox();
});

// Adapted from Taha Shashtari
function dragStart(e) {
    
    if (e.target.classList.contains('card')) {
        draggableCard = e.target
        // draggableItem = e.target.closest('.js-item')
    }

    if (!draggableCard) return

    pointerStartX = e.clientX
    pointerStartY = e.clientY      

    initDraggableCard()
    initCardsState()

    document.addEventListener('mousemove', drag)
}    

// Adapted from Taha Shashtari
function drag(e) {
    if (!draggableCard) return

    const currentPositionX = e.clientX
    const pointerOffsetX = currentPositionX - pointerStartX
    
    draggableCard.style.transform = `translate(${pointerOffsetX}px, 0px)`

    updateIdleCardsStateAndPosition()      
}

// Adapted from Taha Shashtari
function dragEnd() {
    if (!draggableCard) return

    // Next to implement
    applyNewCardsOrder()

    cards = []
    unsetDraggableCard()
    unsetCardState()

    document.removeEventListener('mousemove', drag)
}

// Adapted from Taha Shashtari
function initDraggableCard() {
    draggableCard.classList.remove('is-idle')
    draggableCard.classList.add('is-draggable')
}

// Adapted from Taha Shashtari
function unsetDraggableCard() {
    draggableCard.style = null
    draggableCard.classList.remove('is-draggable')
    draggableCard.classList.add('is-idle')
    draggableCard = null
}

// Adapted from Taha Shashtari
function initCardsState() {
    getIdleCards().forEach((card, i) => {
        if (getAllCards().indexOf(draggableCard) > i) {
            card.dataset.isAbove = ''
        }
    })
}

// From Taha Shashtari
function getAllCards() {
    let cards = []
    if (!cards?.length) {
        cards = Array.from(cardRow.querySelectorAll('.card'))
    }
    return cards
}

// Adapted from Taha Shashtari
function getIdleCards() {
    return getAllCards().filter((card) => card.classList.contains('is-idle'))
}

// From Taha Shashtari
function updateIdleCardsStateAndPosition() {
    const draggableCardRect = draggableCard.getBoundingClientRect()
    const draggableCardX = draggableCardRect.left + (draggableCardRect.width / 2)
    const ITEMS_GAP = 10

    // Shashtari: "update state"
    getIdleCards().forEach((card) => {
    const cardRect = card.getBoundingClientRect()
    const cardX = cardRect.left + (cardRect.width / 2)
    if (isCardAbove(card)) {
        if (draggableCardX <= cardX) {
            card.dataset.isToggled = ''
        } else {
            delete card.dataset.isToggled
        }
    } else {
        if (draggableCardX >= cardX) {
            card.dataset.isToggled = ''
        } else {
            delete card.dataset.isToggled
        }
    }
    })

    // Shashtari: "update position"
    getIdleCards().forEach((card) => {
    if (isCardToggled(card)) {
        const direction = isCardAbove(card) ? 1 : -1
        card.style.transform = `translateX(${
        direction * (draggableCardRect.width + ITEMS_GAP)
        }px)`
    } else {
        card.style.transform = ''
    }
    })
}

// From Taha Shashtari
function isCardAbove(card) {
    return card.hasAttribute('data-is-above')
}

// From Taha Shashtari
function isCardToggled(card) {
    return card.hasAttribute('data-is-toggled')
}      

// From Taha Shashtari
function unsetCardState() {
    getIdleCards().forEach((card, i) => {
        delete card.dataset.isAbove
        delete card.dataset.isToggled
        card.style.transform = ''
    })
}

// From Taha Shashtari
function applyNewCardsOrder() {
    const reorderedCards = []
  
    getAllCards().forEach((card, index) => {
        if (card === draggableCard) {
            return
        }
        if (!isCardToggled(card)) {
            reorderedCards[index] = card
            return
        }
        const newIndex = isCardAbove(card) ? index + 1 : index - 1
        reorderedCards[newIndex] = card
    })
    
    for (let index = 0; index < getAllCards().length; index++) {
        const card = reorderedCards[index]
        if (typeof card === 'undefined') {
            reorderedCards[index] = draggableCard
        }
    }

    reorderedCards.forEach((card) => {
        cardRow.appendChild(card)
    })
}
