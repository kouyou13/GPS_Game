"use strict";
import rule from './rule.js';
const start_div = document.getElementById("start");
let parameter = {};
let make_team_flag = false; // チームを作るかの判定 trueなら作る falseなら参加

const GetUserData = (parameter) => {
  return $.ajax({
    url: "./api/get_user.php",
    type: "POST",
    data: parameter,
    catch: false
  });
}


const clickStart = (make_team_flag) => {
  while(start_div.lastChild){
    start_div.removeChild(start_div.lastChild);
  }
  rule(make_team_flag);
}


const startGame = () => {
  const background_div = document.getElementById('background');
  background_div.style.opacity = '1';

  // const title_h1 = document.createElement("h1");
  // title_h1.id = 'title';
  // title_h1.textContent = 'ぼっち大冒険';
  // title_h1.style.margin = '15vh 0 0 0';
  // start_div.appendChild(title_h1);
  
  const title_h1 = document.createElement("img");
    title_h1.id = 'title';
    // title_h1.textContent = 'ぼっち大冒険';
    title_h1.src = './img/title.png';
    title_h1.style.margin = '5vh 0px 0px 0px';
    start_div.appendChild(title_h1);

  const make_team_btn = document.createElement('input');
  make_team_btn.id = 'make_team_btn';
  make_team_btn.type = 'submit';
  make_team_btn.value = 'チームを作る';
  start_div.appendChild(make_team_btn);

  const join_team_btn = document.createElement('input');
  join_team_btn.id = 'join_team_btn';
  join_team_btn.type = 'submit';
  join_team_btn.value = 'チームに参加';
  start_div.appendChild(join_team_btn);


  make_team_btn.onclick = () =>{
    const text =  'チームを作成してゲームを始めますか？';
    // ダイアログを出していいえを選択したら…
    if (!confirm(text)) {
      // 処理を中断
      return false;
    }
    make_team_flag = true;
    clickStart(make_team_flag);
  }

  join_team_btn.onclick = () =>{
    const text =  'チームを参加してゲームを始めますか？';
    // ダイアログを出していいえを選択したら…
    if (!confirm(text)) {
      // 処理を中断
      return false;
    }
    clickStart(make_team_flag);
  }
}


export default startGame;