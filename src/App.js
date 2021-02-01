import './App.css';
import Phaser from 'phaser';
import * as BreakoutPhaser from './BreakoutPhaser';
import { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';


function BreakoutGame(props) {
  useEffect(()=>{
    if (window.game){return}
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
    BreakoutPhaser.setOnLevelChanged((level) => {
      console.log("In react setOnLevelChanged", level);
      props.onLevelChanged(level)
    })
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
