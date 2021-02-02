import './App.css';
import Phaser from 'phaser';
import * as BreakoutPhaser from './BreakoutPhaser';
import { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';


function BreakoutGame(props) {
  const loadGame = () => {
    fetch('http://localhost:8000/play', {
      method: 'GET'
    })
      .then(res => res.json())
      .then(json => {
        if (json.message === "Empty"){
          // props.onLevelChanged(1)
        } else{
          console.log("Load game info: ", json.Level);
          props.onLevelChanged(json.Level)
          BreakoutPhaser.setCurLevel(json.Level)

          var config = {
            type: Phaser.AUTO,
            width: 400,
            height: 300,
            physics: {
                default: 'arcade'
            },
            scene: {
                preload: BreakoutPhaser.preload,
                create: BreakoutPhaser.create,
                update: BreakoutPhaser.update
            },
            parent: 'canvas'
          };
          
          window.game = new Phaser.Game(config)
        }
      })
  }

  useEffect(()=>{
    if (window.game){return}


    loadGame();

    BreakoutPhaser.setOnLevelChanged((level) => {
      console.log("In react setOnLevelChanged", level);
      props.onLevelChanged(level)
      saveGame(level)
    })

    const saveGame = (level) => {
      console.log(level)

      fetch('http://localhost:8000/play', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Level: level,
        })
      })
        .then(res => res.json)
        .then(json => console.log(json))
    }

  })

  return(
    <div id="canvas"></div>
  )
}

function App() {
  let [level, setLevel] = useState(1)

  return (
    <div className="App">
      Breakout: Level {level}
      <BreakoutGame onLevelChanged={setLevel}/>
      <Button variant="contained" onClick={() => BreakoutPhaser.win()}>I Win</Button>
    </div>
  );
}

export default App;
