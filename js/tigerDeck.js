
export function createTigerDeck() {
  const deckNum = Math.floor(Math.random() * 3);
  let bankCards;

  if (deckNum < 2) {
    bankCards  = chooseSmallBankCards();
  } else {
    bankCards = chooseBigBankCards();
  }

  const playerCards = choosePlayerCards();

  const tigerDeck = {
    "cards": [{
      "image": `https://deckofcardsapi.com/static/img/${playerCards[0].rank}${chooseSuit()}.png`,
      "value": playerCards[0].value
    },
    {
      "image": `https://deckofcardsapi.com/static/img/${playerCards[1].rank}${chooseSuit()}.png`,
      "value": playerCards[1].value
    },
    {
      "image": `https://deckofcardsapi.com/static/img/${bankCards[0].rank}${chooseSuit()}.png`,
      "value": bankCards[0].value
    },
    {
      "image": `https://deckofcardsapi.com/static/img/${bankCards[1].rank}${chooseSuit()}.png`,
      "value": bankCards[1].value
    },
    {
      "image": `https://deckofcardsapi.com/static/img/${playerCards[2].rank}${chooseSuit()}.png`,
      "value": playerCards[2].value
    },
    {
      "image": `https://deckofcardsapi.com/static/img/${bankCards[2].rank}${chooseSuit()}.png`,
      "value": bankCards[2].value
    }
  ]
}
  return tigerDeck;
}

function chooseSuit() {
  const suits = ['H', 'D', 'S', 'C'];
  return suits[Math.floor(Math.random() * 4)];
}

function chooseZeroCard() {
  const cards = ['K', 'Q', 'J', '0'];
  return cards[Math.floor(Math.random() * 4)];
}

function chooseSmallBankCards() {
  const cardOne = Math.floor(Math.random() * 6);
  const cardTwo = 6 - cardOne;

  return [
    {
      rank: cardRank(cardOne),
      value: cardOne
    },
    {
      rank:  cardRank(cardTwo),
      value: cardTwo
    },
    {
      rank: 'A',
      value: 1
    }
  ];
}

function choosePlayerCards() {
  const cardOne = Math.floor(Math.random() * 5);
  const cardTwo = Math.floor(Math.random() * (5 - cardOne));
  const cardThree = Math.floor(Math.random() * (5 - (cardOne + cardTwo)));

  return [
    {
      rank: cardRank(cardOne),
      value: cardOne
    },
    {
      rank: cardRank(cardTwo),
      value: cardTwo
    },
    {
      rank: cardRank(cardThree),
      value: cardThree
    }
  ];
}

function chooseBigBankCards() {
  const cardOne = Math.floor(Math.random() * 2);
  const cardTwo = Math.floor(Math.random() * (2 - cardOne));
  const cardThree = 6 - (cardOne + cardTwo);

  return [
    {
      rank: cardRank(cardOne),
      value: cardOne
    },
    {
      rank:  cardRank(cardTwo),
      value: cardTwo
    },
    {
      rank: cardRank(cardThree),
      value: cardThree
    }
  ];
}

function cardRank(value) {
  if (value === 0) {
    return chooseZeroCard();
  } else if (value === 1) {
    return 'A';
  } 
  
  return value;
}
