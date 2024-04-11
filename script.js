// Game elements
const banker = document.querySelector('#banker-cards');
const player = document.querySelector('#player-cards');
const bankSide = document.querySelector('#banker-total');
const playerSide = document.querySelector('#player-total');
const winnerDiv = document.getElementById('winner');

const playBtn = document.getElementById('play-game');
const submitBtn = document.getElementById('submit-btn');

// Side bet elements
const bigTiger = document.getElementById('big-tiger');
const tiger = document.getElementById('tiger');
const smallTiger = document.getElementById('small-tiger');
const tie = document.getElementById('tie');
const pair = document.getElementById('pair');
const sideBets = [bigTiger, tiger, smallTiger, tie, pair];

// Alert elements
const alertBox = document.getElementById('alert-box');
const alertMessage = document.getElementById('alert-message');
const alertBtn = document.getElementById('alert-btn');

// Game variables
let playerTotal;
let bankTotal;
let winner;

// Side bet winning variables
let pairWin = 0;
let tieWin = 0;
let bigTigerWin = 0;
let tigerWin = 0;
let smallTigerWin = 0;
let bankDraw = false;
let sideBetAnswers = [];

// Timeout intervals
const WAIT_1 = 1000;
const WAIT_2 = 2000;
const WAIT_3 = 3000;
let endWait = WAIT_1;

playBtn.addEventListener('click', dealHand);
submitBtn.addEventListener('click', checkAnswer);
alertBtn.addEventListener('click', resetHand);

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
  const openingCards = await hand.json();

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
  playerValue1 = openingCards.cards[0].value;
  playerValue2 = openingCards.cards[1].value;
  bankValue1 = openingCards.cards[2].value;
  bankValue2 = openingCards.cards[3].value;

  playerTotal = (value(playerValue1) + value(playerValue2)) % 10;
  bankTotal = (value(bankValue1) + value(bankValue2)) % 10;

  // Check for pairs:
  // One pair - 4 to 1
  // Two pair - 20 to 1
  // Four of a kind - 100-1 
  if (playerValue1 === playerValue2) {
    pairWin = 4;
    sideBetAnswers.push('pair');
  }
  if (bankValue1 === bankValue2) {
    if (bankValue1 === playerValue1 && pairWin === 4) {
      pairWin = 100;
    } else if (pairWin === 4) {
      pairWin = 20;
    } else {
      pairWin = 4;
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
  pairWin = 0;
  tieWin = 0;
  bigTigerWin = 0;
  tigerWin = 0;
  smallTigerWin = 0;
  bankDraw = false; 
  sideBetAnswers = [];
  playerTotal = 0;
  bankTotal = 0;
  endWait = WAIT_1;
  alertMessage.innerHTML = '';
  player.innerHTML = '';
  banker.innerHTML = '';
  bankSide.innerHTML = '';
  playerSide.innerHTML = '';
  winnerDiv.innerHTML = '';
  banker.style.alignSelf = 'center';
  sideBets.forEach(bet => bet.classList.add('active'));
  alertBox.classList.remove('active');
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
  banker.style.alignSelf = "flex-start";
  banker.insertBefore(bankerCard3, banker.firstChild);
  bankTotal = (bankTotal + value) % 10;
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
        bigTigerWin = 50;
        tigerWin = 20;
        sideBetAnswers.push('big-tiger');
        sideBetAnswers.push('tiger');
      } else {
        smallTigerWin = 22;
        tigerWin = 12;
        sideBetAnswers.push('small-tiger');
        sideBetAnswers.push('tiger');
      }
    }
  } else if (playerTotal > bankTotal) {
    winner = 'Player Wins';
  } else {
    winner = 'Tie';
    tieWin = 8;
    sideBetAnswers.push('tie');
  }
  winnerDiv.appendChild(document.createTextNode(winner));
  playBtn.classList.remove('active');
  submitBtn.classList.add('active');
  console.log(`Tie: ${tieWin} | Pair: ${pairWin} | Big Tiger: ${bigTigerWin} | Tiger: ${tigerWin} | Small Tiger: ${smallTigerWin}`)
}

function checkAnswer() {
  const answerNodes = document.querySelectorAll('.side-bet.active');
  const answers = [...answerNodes].map(answer => answer.id);
  let correct = true;
  sideBetAnswers.forEach(answer => {
    if (!answers.includes(answer)) {
      correct = false;
      console.log(`false on ${answer}`)
    }
  })
  console.log(`answers - ${(answers.length)}`);
  console.log(`sideBetAnswers - ${sideBetAnswers.length}`);
  console.log(correct);
  answers.forEach(answer => {
    console.log(answer);
  });
  sideBetAnswers.forEach(answer => {
    console.log(answer);
  })
  if (answers.length === sideBetAnswers.length && correct) {
    alertMessage.appendChild(document.createTextNode('Good Job!'));
  } else {
    alertMessage.appendChild(document.createTextNode('You missed something.'));
  }
  alertBox.classList.add('active');
  submitBtn.classList.remove('active');
  playBtn.classList.add('active');
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