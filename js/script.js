import { createTigerDeck } from "./tigerDeck.js";
// Game elements
const banker = document.querySelector('#banker-cards');
const player = document.querySelector('#player-cards');
const bankSide = document.querySelector('#banker-total');
const playerSide = document.querySelector('#player-total');
const winnerDiv = document.getElementById('winner');

const btnDiv = document.getElementById('game-btns');
const playBtn = document.getElementById('play-game');
const submitBtn = document.getElementById('submit-btn');

// Side bet elements
const bigTiger = document.getElementById('big_tiger');
const tiger = document.getElementById('tiger');
const smallTiger = document.getElementById('small_tiger');
const tie = document.getElementById('tie');
const pair = document.getElementById('pair');
const sideBets = [bigTiger, tiger, smallTiger, tie, pair];
const betNames = {
  pair: 'Pair',
  tie: 'Tie',
  tiger: 'Tiger',
  small_tiger: 'Small Tiger',
  big_tiger: 'Big Tiger',
  Pair: 'pair',
  Tie: 'tie',
  Tiger: 'tiger',
  Small: 'small_tiger',
  Big: 'big_tiger'
}
let betDenom = 25;

// Alert elements
const alertBox = document.getElementById('alert-box');
const alertMessage = document.getElementById('alert-message');
const playAgainBtn = document.getElementById('play-again-btn');

// Pay box elements
const payBox = document.getElementById('payout-box');
const list = document.getElementById('denoms');
const payBetBtn = document.getElementById('payout-btn');
const betToPayText = document.getElementById('bet-to-pay');
const incorrectMsg = document.getElementById('incorrect-message');
let bet;

// Game variables
let playerTotal;
let bankTotal;
let winner;
let tigerFreq = 'normal';

// Side bet winning variables
let bankDraw = false;
let sideBetAnswers = [];
const payoutSchedule = {
  pair: 0,
  tie: 8,
  big_tiger: 50,
  tiger: 0,
  small_tiger: 22
}

// Timeout intervals
const WAIT_1 = 1000;
const WAIT_2 = 2000;
const WAIT_3 = 3000;
let endWait = WAIT_1;

playBtn.addEventListener('click', dealHand);
submitBtn.addEventListener('click', checkAnswer);
playAgainBtn.addEventListener('click', dealHand);
payBetBtn.addEventListener('click', payBets);

// Side bet listeners
sideBets.forEach(bet => bet.addEventListener('click', () => bet.classList.toggle('active')));

async function dealHand() {
  resetHand();

  // Create shuffled 8 deck shoe and get ID
  const res = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=8');
  const data = await res.json();
  const deckId = data.deck_id;

  // Draw 6 cards - 4, 5, or 6 cards might be used
  const hand = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=6`);
  let openingCards;
  if (tigerFreq === 'normal') {
    openingCards = await hand.json();
  } else if (tigerFreq === 'all') {
    openingCards = createTigerDeck();
  } else {
    if (!shouldCreateTiger(Number(tigerFreq))) {
      openingCards = await hand.json();
    } else {   
      openingCards = createTigerDeck();
    }
  }

  // Create images for first 4 cards
  const playerCard1 = document.createElement('img');
  const playerCard2 = document.createElement('img');
  const bankCard1 = document.createElement('img');
  const bankCard2 = document.createElement('img');

  // Get source values
  playerCard1.src = openingCards.cards[0].image;
  playerCard2.src = openingCards.cards[1].image;
  bankCard1.src = openingCards.cards[2].image;
  bankCard2.src = openingCards.cards[3].image;

  // Calculate totals for each side
  const playerValue1 = openingCards.cards[0].value;
  const playerValue2 = openingCards.cards[1].value;
  const bankValue1 = openingCards.cards[2].value;
  const bankValue2 = openingCards.cards[3].value;

  playerTotal = (value(playerValue1) + value(playerValue2)) % 10;
  bankTotal = (value(bankValue1) + value(bankValue2)) % 10;

  // Check for pairs:
  // One pair - 4 to 1
  // Two pair - 20 to 1
  // Four of a kind - 100-1 
  if (playerValue1 === playerValue2) {
    payoutSchedule.pair = 4;
    sideBetAnswers.push('pair');
  }
  if (bankValue1 === bankValue2) {
    if (bankValue1 === playerValue1 && payoutSchedule.pair === 4) {
      payoutSchedule.pair = 100;
    } else if (payoutSchedule.pair === 4) {
      payoutSchedule.pair = 20;
    } else {
      payoutSchedule.pair = 4;
    }
    !sideBetAnswers.includes('pair') && sideBetAnswers.push('pair');
  }

  // Append images and totals to each side
  player.appendChild(playerCard1);
  player.appendChild(playerCard2);
  playerSide.appendChild(document.createTextNode(playerTotal));

  setTimeout(() => {
    banker.appendChild(bankCard1);
    banker.appendChild(bankCard2);
    bankSide.appendChild(document.createTextNode(bankTotal))
  }, WAIT_1);

  // If natural or both sides total 6 or 7, game ends immediately
  if (bankTotal > 7 || playerTotal > 7 || 
    (bankTotal > 5 && playerTotal > 5)) {
      endGame();
      return;
    }
  
  let playerDraw = false;
  let playerThirdCard;
  
  //  Player draws if total is 5 or less
  if (playerTotal < 6) {
    playerThirdCard = value(openingCards.cards[4].value);
    setTimeout(() => {
      drawPlayerCard(openingCards.cards[4].image, playerThirdCard)
    }, WAIT_2); 
    playerDraw = true;
    endWait = WAIT_2 + 50;
  }

  // Bank third card rules:
  // If the Player doesn't draw, Bank draws on 5 or less
  // If the Player draws, it depends on Bank total:
  // Bank total: 3, draw unless Player third card is an 8
  // Bank total: 4, draw if Player third card is 2-7
  // Bank total: 5, draw if Player third card is 4-7
  // Bank total: 6, draw if Player third card is 6-7
  // Bank total: 7, no draw
  if (!playerDraw && bankTotal < 6) {
    setTimeout(() => {
      drawBankCard(openingCards.cards[4].image, value(openingCards.cards[4].value))
    }, WAIT_2);
    endWait = WAIT_2 + 50;
  } else {
    switch (bankTotal) {
      case 0:
      case 1:
      case 2:
        setTimeout(() => {
          drawBankCard(openingCards.cards[5].image, value(openingCards.cards[5].value))
        }, WAIT_3);
        endWait = WAIT_3 + 50;
        break;
      case 3:
        if (playerThirdCard !== 8) {
          setTimeout(() => {
            drawBankCard(openingCards.cards[5].image, value(openingCards.cards[5].value))
          }, WAIT_3);
          endWait = WAIT_3 + 50;
        }
        break;
      case 4:
        if (playerThirdCard > 1 && playerThirdCard < 8) {
          setTimeout(() => {
            drawBankCard(openingCards.cards[5].image, value(openingCards.cards[5].value))
          }, WAIT_3);
          endWait = WAIT_3 + 50;
        }
        break;
      case 5:
        if (playerThirdCard > 3 && playerThirdCard < 8) {
          setTimeout(() => {
            drawBankCard(openingCards.cards[5].image, value(openingCards.cards[5].value))
          }, WAIT_3);
          endWait = WAIT_3 + 50;
        }
        break;
      case 6:
        if (playerThirdCard > 5 && playerThirdCard < 8) {
          setTimeout(() => {
            drawBankCard(openingCards.cards[5].image, value(openingCards.cards[5].value))
          }, WAIT_3);
          endWait = WAIT_3 + 50;
        }
        break;
      default:
        break;
    }
  }

  setTimeout(endGame, endWait);
}

// Reset values and divs at the start of each hand
function resetHand() {
  bankDraw = false; 
  sideBetAnswers = [];
  playerTotal = 0;
  bankTotal = 0;
  endWait = WAIT_1;
  player.innerHTML = '';
  banker.innerHTML = '';
  bankSide.innerHTML = '';
  playerSide.innerHTML = '';
  winnerDiv.innerHTML = '';
  betToPayText.innerHTML = '';
  list.innerHTML = '';
  banker.style.alignSelf = 'center';
  sideBets.forEach(bet => {
    bet.classList.add('active');
    const betName = betNames[bet.getAttribute('id')];
    const amount = createBet(betName);
    bet.replaceChild(document.createTextNode(`${betName}\n$${amount}`), bet.childNodes[0]);
  });
  alertBox.classList.remove('active');
  playAgainBtn.classList.remove('active');
  btnDiv.classList.add('active');
  incorrectMsg.classList.remove('active');
  incorrectMsg.classList.remove('active');
}

// Add Player third card image, rotated to indicate it's the third card, and calculate total
function drawPlayerCard(img, value) {
  const playerCard3 = document.createElement('img');
  playerCard3.src = img;
  playerCard3.style.transform = "rotate(90deg)";
  playerCard3.style.marginLeft = "20px";
  player.appendChild(playerCard3);
  playerTotal = (playerTotal + value) % 10;
  playerSide.replaceChild(document.createTextNode(playerTotal), playerSide.childNodes[0]);
}

// Add Banker third card image, rotated to indicate it's the third card, and calculate total
function drawBankCard(img, value) {
  const bankerCard3 = document.createElement('img');
  bankerCard3.src = img;
  bankerCard3.style.transform = "rotate(90deg)";
  bankerCard3.style.marginRight = "20px";
  bankerCard3.style.marginLeft = "50px";
  banker.insertBefore(bankerCard3, banker.firstChild);
  bankTotal = (bankTotal + value) % 10;
  banker.style.alignSelf = "flex-start";
  bankSide.replaceChild(document.createTextNode(bankTotal), bankSide.childNodes[0]);
  endWait = WAIT_3;
  bankDraw = true;
}

// Replace totals for each side and declare a winnner
function endGame() {
  if (bankTotal > playerTotal) {
    winner = 'Bank Wins';
    // Check for Tiger
    if (bankTotal === 6) {
      if (bankDraw) {
        payoutSchedule.tiger = 20;
        sideBetAnswers.push('big_tiger');
        sideBetAnswers.push('tiger');
      } else {
        payoutSchedule.tiger = 12;
        sideBetAnswers.push('small_tiger');
        sideBetAnswers.push('tiger');
      }
    }
  } else if (playerTotal > bankTotal) {
    winner = 'Player Wins';
  } else {
    winner = 'Tie';
    sideBetAnswers.push('tie');
  }
  winnerDiv.appendChild(document.createTextNode(winner));
  playBtn.classList.remove('active');
  submitBtn.classList.add('active');
}

function checkAnswer() {
  const answerNodes = document.querySelectorAll('.side-bet.active');
  const answers = [...answerNodes].map(answer => answer.id);
  let correct = true;
  let message;

  sideBetAnswers.forEach(answer => {
    if (!answers.includes(answer)) {
      correct = false;
    }
  })
  
  if (answers.length === sideBetAnswers.length && correct && answers.length === 0) {
    message = 'Good Job!';
    btnDiv.classList.remove('active');
    submitBtn.classList.remove('active');
    playAgainBtn.classList.add('active');
  } else if (answers.length === sideBetAnswers.length && correct) {
    message = 'Correct! Tap each bet to pay.';
    btnDiv.classList.remove('active');
    submitBtn.classList.remove('active');
    sideBetAnswers.forEach(answer => {
      bet = document.getElementById(answer);
      bet.addEventListener('click', function addListener() {
        createPayBox(answer);
        bet.removeEventListener('click', addListener);
      });
    });
  } else {
    message = 'You missed something.';
  }
  alertMessage.replaceChild(document.createTextNode(message), alertMessage.childNodes[0]);
  alertBox.classList.add('active');
}

// Calculate integer value from returned JSON value
function value(string) {
  if (string === "ACE") {
    return 1;
  } 
  // Face cards = 0
  if (isNaN(Number(string))) {
    return 0;
  }

  return Number(string);
}

function createBet(bet) {
  let amount;
  if (bet === 'Pair') {
    amount = Math.floor((Math.random() * 475) + 25);
  } else if (bet === 'Tie') {
    amount = Math.floor((Math.random() * 3725) + 25);
  } else {
    amount = Math.floor((Math.random() * 975) + 25);
  }
  setDenom();
  return parseInt(amount / betDenom) * betDenom;
}

function setDenom() {
  const randNum = Math.floor((Math.random() * 9) + 1);
  if (randNum === 1) {
    betDenom = 5;
  } else {
    betDenom = 25;
  }
}

// Handle payouts
function payBets() {
  const betText = betToPayText.innerText;
  const input = [...document.querySelectorAll('.payout')];
  const betAmount = Number(betText.split('$')[1]);
  const tempBetName = betText.split(' ')[0];
  const betToPay = betNames[tempBetName];
  let payout = 0;
  let message;

  input.forEach(inp => {
    payout += Number(inp.value);
    inp.value = '';
  });
  if (payout === payoutSchedule[betToPay] * betAmount) {
    incorrectMsg.classList.remove('active');
    alertMessage.replaceChild(document.createTextNode('Good Job!'), alertMessage.childNodes[0]);
    payBox.classList.remove('active');
    if (document.querySelectorAll('.side-bet.active').length > 0) {
      alertMessage.replaceChild(document.createTextNode('Good Job!\nTap each bet to pay.'), alertMessage.childNodes[0]);
    } else {
      alertMessage.replaceChild(document.createTextNode('Good Job!'), alertMessage.childNodes[0]);
      playAgainBtn.classList.add('active');
    }
    alertBox.classList.add('active');
    betToPayText.innerHTML = '';
    list.innerHTML = '';
    bet = document.getElementById(betToPay);
  } else {
    incorrectMsg.classList.add('active');
  }
}

function createPayBox(name) {
  bet = document.getElementById(name);
  const betName = bet.innerText;
  const betAmount = Number(betName.split('$')[1]);
  alertBox.classList.remove('active');
  betToPayText.appendChild(document.createTextNode(betName));
  payBox.classList.add('active');
  addChips(betAmount);
}

function addChips(amount) {
  printChips(amount, 1000, 'yellow');
  let remainder = amount % 1000;
  printChips(remainder, 500, 'purple');
  remainder %= 500;
  printChips(remainder, 100, 'black');
  remainder %= 100;
  printChips(remainder, 25, 'green');
  remainder %= 25;
  printChips(remainder, 5, 'red');
}

function printChips(amount, denom, color) {
  const numChips = Math.floor(amount / denom);
  for (let i = 0; i < numChips; i++) {
    const chips = document.createElement('li');
    chips.className = '';
    chips.classList.add(color);
    chips.appendChild(document.createTextNode(`$${denom}`));
    list.appendChild(chips);
  }
}

// Tiger Options
const moreTigers = document.getElementById('more-tigers');
const tigerBox = document.getElementById('tiger-freq-box');
const tigerOptions = document.getElementsByName('tiger-radio');
const tigerUpdate = document.getElementById('tiger-update');
const tigerCancel = document.getElementById('tiger-cancel');

moreTigers.addEventListener('click', () => {
  if (tigerBox.classList.contains('active')) {
  setTigerFreq();
}
  toggleTiger();
});

tigerUpdate.addEventListener('click', () => {
  setTigerFreq();
  toggleTiger();
});

tigerCancel.addEventListener('click', () => {
  toggleTiger();
  setChecked();
});

function toggleTiger() {
  tigerBox.classList.toggle('active');
}

function setChecked() {
  for (let i = 0; i < tigerOptions.length; i++) {
    if (tigerOptions[i].value = tigerFreq) {
      tigerOptions[i].checked = true;
    } else {
      tigerOptions[i].checked = false;
    }
  }
}



function setTigerFreq() {
  for (let i = 0; i < tigerOptions.length; i++) {
    if (tigerOptions[i].checked) {
      tigerFreq = tigerOptions[i].value;
    }
  }
}

function shouldCreateTiger(freq) {
  const num = Math.floor(Math.random() * freq);
  if (num === 1) {
    return true;
  }

  return false;
}

