import Phaser from 'phaser';
import * as Levels from './levels.js';

// export var config = {
//   type: Phaser.AUTO,
//   width: 800,
//   height: 600,
//   physics: {
//       default: 'arcade'
//   },
//   scene: {
//       preload: preload,
//       create: create,
//       update: update
//   }
// };

// export var game = new Phaser.Game(config);

let ball;
let ballVelocity = 0;
let bottomBorder;
let topBorder;
let leftBorder;
let rightBorder;
let bottomPaddle;
let paddleX;
let paddleDir;
let paddleVelocity = 400;
let gameScore = 0;
let wKey;
let aKey;
let dKey;
let gameLives;
let gameLivesText;
let gameRunning = true;
let startState = true;
let aIsDown;
let dIsDown;
let wIsDown;
let brickCount = 0;
let brickArr = [];
let endText;
let paddleSound;
let background;
let brickSound;
let powers = [];
let activePowers = [];
let preStart = true;
let powerUpSound;
let powerDownSound;
let makeBricks;
let frame = 0;

let onLevelChanged = (level) => {
  console.log(level);
}

let curLev = 1;

export function preload ()
{
  // console.log("In preload");
  this.load.image('eye', 'assets/lance-overdose-loader-eye.png');
  this.load.image('ball', 'assets/58-Breakout-Tiles.png');
  this.load.image('background', 'assets/1624.jpg');
  this.load.image('paddle', 'assets/56-Breakout-Tiles.png');
  this.load.image('brick1', 'assets/07-Breakout-Tiles.png');
  this.load.image('brick2', 'assets/03-Breakout-Tiles.png');
  this.load.image('brick3', 'assets/01-Breakout-Tiles.png');
  this.load.image('ballUpPower', 'assets/45-Breakout-Tiles.png');
  this.load.image('paddleAn0', 'assets/50-Breakout-Tiles.png');
  this.load.image('paddleAn1', 'assets/51-Breakout-Tiles.png');
  this.load.image('paddleAn2', 'assets/52-Breakout-Tiles.png');
  this.load.image('paddleAn3', 'assets/53-Breakout-Tiles.png');
  this.load.image('paddleAn4', 'assets/54-Breakout-Tiles.png');
  this.load.image('paddleAn5', 'assets/55-Breakout-Tiles.png');

  this.load.audio('ballOnPaddle', 'sounds/pinging-noise.wav');
  this.load.audio('ballOnBrick', 'sounds/brick-crack.wav');
  this.load.audio('powerUp', 'sounds/power-up.wav');
  this.load.audio('powerDown', 'sounds/power-down.wav');
}

export function create ()
{
  // console.log("In create");
  background = this.add.sprite(0,0,'background').setScale(.45)
  paddleSound = this.sound.add('ballOnPaddle');
  brickSound = this.sound.add('ballOnBrick');
  powerUpSound = this.sound.add('powerUp');
  powerDownSound = this.sound.add('powerDown');

  const makeWall = (wall) => {
    this.physics.add.existing(wall, true)
    this.physics.add.collider(wall, ball)
    wall.visible = false;
  }

  const makePaddle = (paddle) => {
    this.physics.add.existing(paddle, false)
    this.physics.add.collider(ball, paddle, function(x){
      moveBall()
      paddleSound.play({volume: .3});
    })
    paddle.body.immovable = true;
    paddle.body.setCollideWorldBounds(true);
    paddle.body.setFriction(0)
  }

  makeBricks = (rect, hitCount) => {
    this.physics.add.existing(rect, false)
    this.physics.add.collider(rect, ball, () => {
      if (hitCount === 1){
        brickCount-=1;
        rect.destroy()
        
        brickBreak(rect, this.physics, makePowers);

        brickSound.play();
      } else {
        hitCount-=1;
        rect.setTexture(`brick${hitCount}`);
        brickSound.play();
      }

    })
    rect.body.immovable = true;
    rect.body.onCollide = true;
    brickArr.push(rect)
  }

  const makePowers = (power) => {
    this.physics.add.existing(power, true)
    this.physics.add.collider(power, bottomPaddle, () => {
      activePowers.push(power)
      power.modifiers.activatedTime = Math.floor( new Date().getTime() )
      power.destroy()
      powerUpSound.play({volume: .3});
    })
  }

  ball = this.physics.add.sprite(400, 300, 'ball').setInteractive().setVelocity(0,ballVelocity).setBounce(1,1).setScale(.2);
  topBorder = this.add.rectangle(this.cameras.main.centerX, 0, this.cameras.main.centerX * 2, 10, 0xFF0000)
  leftBorder = this.add.rectangle(0, this.cameras.main.centerY, 10, this.cameras.main.centerX * 2, 0xFF0000)
  rightBorder = this.add.rectangle(this.cameras.main.centerX * 2, this.cameras.main.centerY, 10, this.cameras.main.centerX * 2, 0xFF0000)

  let walls = [topBorder, leftBorder, rightBorder]
  walls.map(makeWall)

  paddleX = this.cameras.main.centerX;
  bottomPaddle = this.physics.add.sprite(this.cameras.main.centerX, 550, `paddleAn${frame}`).setInteractive().setScale(.15)
  let paddles = [bottomPaddle]
  paddles.map(makePaddle)

  placeBricks(this);

  wKey = this.input.keyboard.addKey('W');
  aKey = this.input.keyboard.addKey('A');
  dKey = this.input.keyboard.addKey('D');

  this.add.text((this.cameras.main.centerX * 2) - 100, (this.cameras.main.centerY * 2) - 50, `Score:   ${gameScore}`, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' }).setFontSize(20);

  gameLives = 3;
  gameLivesText = this.add.text((this.cameras.main.centerX * 2) - 100, (this.cameras.main.centerY * 2) - 100, `Lives:   ${gameLives}`, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' }).setFontSize(20);

  document.addEventListener('keydown', (keyEvent) => {
    if (keyEvent.key === 'a'){
      aIsDown = true;
    }
    if (keyEvent.key === 'd'){
      dIsDown = true;
    }
    if (keyEvent.key === 'w'){
      wIsDown = true;
    }
  })
  document.addEventListener('keyup', (keyEvent) => {
    if (keyEvent.key === 'a'){
      aIsDown = false;
    }
    if (keyEvent.key === 'd'){
      dIsDown = false;
    }
    if (keyEvent.key === 'w'){
      wIsDown = false;
    }
  })

  endText = this.add.text(this.cameras.main.centerX -350, this.cameras.main.centerY -50, ``, { fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif' })
    .setFontSize(50)
    .setAlign('center')
    .setBackgroundColor('black')
  // endText.setPosition(this.cameras.main.centerX - endText.width/2 , this.cameras.main.centerY - endText.height + 100)

  endText.visible = false;


}

export function update() 
{
  frame++;

  if (preStart){
    endText.setText("Use W to launch. \n A and D to move left to right. \n Press A or D to start the game.");
    endText.setPosition(this.cameras.main.centerX - endText.width/2 , this.cameras.main.centerY - endText.height + 100)
    endText.visible = true;
    if (aIsDown || dIsDown){
      preStart = false;
      endText.visible = false;
    }
  } else {
    if (brickCount === 0 && curLev > stageCount()){
      endText.setPosition(this.cameras.main.centerX - endText.width/2 , this.cameras.main.centerY - endText.height)
      gameOver('win')
    }
    if (brickCount === 0 && curLev <= stageCount()){
      curLev+=1;
      // level = Levels.stageLevels[`level_${curLev}`];
      onLevelChanged(curLev)

      brickCount = -1;
      setTimeout(() => {
        placeBricks(this)
        cleanBoard();
      }, 1000)
    }

    if (startState === true) {
      ball.visible = true;
      ball.setPosition(bottomPaddle.x, bottomPaddle.y - 50)
    }

    if (ball.y > this.cameras.main.centerY * 2) {
      gameLives-=1;

      cleanBoard();

      if (gameLives === 0){
        endText.setPosition(this.cameras.main.centerX - endText.width/2 , this.cameras.main.centerY - endText.height)
        gameOver('loss')
      }

      ball.visible = false;
      gameLivesText.setText(`Lives:   ${gameLives}`).setFontSize(20);
    }

    if (startState === true && wIsDown) {
      startState = false;
      ballVelocity = 300;
      // ball.setVelocity(0,-ballVelocity)
      moveBall()
    }
    if (aIsDown) {
      movePaddle(bottomPaddle, 'left')
    }
    if (dIsDown) {
      movePaddle(bottomPaddle, 'right')
    }
    if ((!aIsDown && !dIsDown) || (aIsDown && dIsDown)) {
      movePaddle(bottomPaddle, 'stop')
    }

    powers = powers.map(power => {
      if (power.y > this.cameras.main.centerY * 2){
        power.destroy()
        return undefined;
      }
      return power;
    }).filter(x => x)

    let hadBallUpPower = haveBallUpPower();
    activePowers = activePowers.map(power => {
      let nowTime = new Date().getTime();
      let { activatedTime, timeToLive } = power.modifiers;
      if ((activatedTime + timeToLive) >= nowTime){
        return power;
      } else{
        return undefined;
      }
    }).filter(x => x)
    if(hadBallUpPower && !haveBallUpPower()){
      powerDownSound.play();
    }
    
    applyActivePowers();
  }
}

function movePaddle(paddle, dir) {
  paddleDir = dir;
  if (dir === 'left') {
    paddle.body.setVelocityX(-paddleVelocity)
  } else if (dir === 'right') {
    paddle.body.setVelocityX(paddleVelocity)
  } else if (dir === 'stop') {
    paddle.body.setVelocityX(0)
  }
}

function moveBall(){
  if (paddleDir === 'left'){
    ball.body.setVelocity(-ballVelocity,-ballVelocity)
  } else if (paddleDir === 'right'){
    ball.body.setVelocity(ballVelocity,-ballVelocity)
  } else if (paddleDir === 'stop'){
    ball.body.setVelocity(0,-ballVelocity)
  }
}

function brickBreak(brick, physics, makePowers){
  if ((Math.floor(Math.random() * 2)) === 1){
    let drop = physics.add.sprite(brick.x, brick.y, 'eye').setInteractive().setVelocity(0,100).setScale(.15)
    drop.modifiers = {ballUp: true, timeToLive: 5000};
    makePowers(drop);
    powers.push(drop)
  }
}

function applyActivePowers(){
  if (haveBallUpPower()) {
    bottomPaddle.setTexture('ballUpPower')
    if (wIsDown) {
      ballVelocity = 300;
      moveBall()
    }
  } else{
    bottomPaddle.setTexture(`paddleAn${Math.floor(frame / 2) % 3}`);
  }
}

function haveBallUpPower(){
  return activePowers.some(power => power.modifiers.ballUp)
}

function gameOver(status){
  gameRunning = false;
  ball.visible = false;
  brickArr.map(brick => brick.visible = false);
  if (status === 'win'){
    endText.visible = true;
    endText.setText('You won!')
  }
  if (status === 'loss'){
    endText.visible = true;
    endText.setText('You lost!')
  }
}

function stageCount(){
  let count = 0;
  for (let key in Levels.stageLevels){
    if (Levels.stageLevels.hasOwnProperty(key)) {
      count++;
    }
  }
  return count;
}

function placeBricks(context){
  brickCount = 0;
  console.log(Levels.stageLevels['level_3']);
  console.log(curLev);
  let level = Levels.stageLevels[`level_${curLev}`];
  for (let row=0; row<level.length; row++) {
    for (let col=0; col<level[row].length; col++) {
      let brickWidth = ((context.cameras.main.centerX * 2) / level[row].length);
      let brickHeight = 28;

      let current = level[row][col];
      if (current === '1'){
        brickCount+=1;
        makeBricks((context.physics.add.sprite(((col * brickWidth) + brickWidth / 2), ((row * brickHeight) + brickHeight / 2) + 100, 'brick1')).setScale(.2), 1);
      }
      if (current === '2'){
        brickCount+=1;
        makeBricks((context.physics.add.sprite(((col * brickWidth) + brickWidth / 2), ((row * brickHeight) + brickHeight / 2) + 100, 'brick2')).setScale(.2), 2);
      }
      if (current === '3'){
        brickCount+=1;
        makeBricks((context.physics.add.sprite(((col * brickWidth) + brickWidth / 2), ((row * brickHeight) + brickHeight / 2) + 100, 'brick3')).setScale(.2), 3);
      }
    }
  }
}

function cleanBoard(){
  activePowers = [];

  powers.map(power => power.destroy())
  powers = [];

  ball.setPosition(400, 300)
  ballVelocity = 0;
  ball.setVelocity(0,ballVelocity)

  startState = true;
}

export function win(){
  brickCount = 0;
}

export function setOnLevelChanged(cb){
  onLevelChanged = cb;
}

export function setCurLevel(savedLevel){

  curLev = savedLevel;
  console.log(savedLevel, curLev);
  // level = Levels.stageLevels[`level_${curLev}`];
}


// TODO: 
// Ball should be able to break two bricks at once
// Replace instructions with WASD graphic

// Add another power
