'use strict';
import game from './game.js';
const select_rule_div = document.getElementById('select_rule');
const join_team_btn = document.createElement('input');
let mymap;
let now_lat; //現在の緯度
let now_lng; //現在の経度

let gamecode; // ゲームコード
let game_area_range; // ゲームエリアの範囲
let goal_num; // ゴールの数
let gameset_num; // ゲームセットの数
let limit_time; // 制限時間[min]
const goal_area_range = 10; // ゴルエリアの範囲は半径10[m]とする
let random_LatLng_list = []; // game_area_range内のランダムで取得した地点の座標を収納，[[Lat_1, Lng_1], [Lat_2, Lng_2],[],[],[],,,,]みたいな中身
let goal_point_probability_list = []; // ゴール地点の確率
let make_team_flag = false;
let total_score = 0;
let parameter = {};

const GetTeamData = (parameter) => {
  return $.ajax({
    url: "./api/get_team.php",
    type: "POST",
    data: parameter,
    catch: false
  });
}

const InsertTeamData = (parameter) => {
  return $.ajax({
    url: "./api/insert_team.php",
    type: "POST",
    data: parameter,
    catch: false
  });
}


// ある地点からmeter[m]離れた地点の座標
const separatePointCoordinate = (lat, lng, meter_lat_temp, meter_lng_temp) => {
  const meter_lat = Math.abs(meter_lat_temp);
  const meter_lng = Math.abs(meter_lng_temp);
  let target_lat;
  let target_lng;
  const target_lat_temp = meter_lat / (4 * 10 ** 7) * 360
  if(meter_lat_temp > 0)
    target_lat = lat + target_lat_temp;
  else
    target_lat = lat - target_lat_temp;
  
  const target_lng_temp = meter_lng / ((4 * 10 ** 7) / 360 * Math.cos(lat * Math.PI / 180));

  if(meter_lng_temp > 0)
    target_lng = lng + target_lng_temp;
  else
    target_lng = lng - target_lng_temp;
  
  return [target_lat, target_lng];
}


// 地図の描写
const map = (position) => {
  now_lat = position.coords.latitude;
  now_lng = position.coords.longitude;
  let random_meter_Lat;
  let random_meter_Lng;
  let temp_list = [];
  // 確率の最大値/10と最小値
  const max_probability = 10;
  const min_probability = 0;
  // ランダムにゴールを決める 6.5*は誤差で範囲外にゴールができるのを防ぐため
  const max = game_area_range - 6.5 * goal_area_range;
  const min = game_area_range * -1 + 6.5 * goal_area_range;

  for (let i=0; i<goal_num; i++){
    random_meter_Lat = Math.floor( Math.random() * (max + 1 - min) ) + min;
    random_meter_Lng = Math.floor( Math.random() * (max + 1 - min) ) + min;
    temp_list = separatePointCoordinate(now_lat, now_lng, random_meter_Lat, random_meter_Lng);
    random_LatLng_list.push(temp_list); // 配列に追加
    // console.log(temp_list);

    // 偶数なら確率をプラス，奇数ならマイナス
    if (i % 2 == 1){
      goal_point_probability_list.push((Math.floor( Math.random() * (max_probability + 1 - min_probability) ) + min_probability) * -10);
    }
    else{
      goal_point_probability_list.push((Math.floor( Math.random() * (max_probability + 1 - min_probability) ) + min_probability) * 10);
    }
  }
  // jsonを文字列に変換
  // console.log(typeof(JSON.stringify(goal_point_probability_list)));

  // console.log("[ 緯度 ] " + now_lat);
  // console.log("[ 経度 ] " + now_lng);
  // console.log("[ 日時 ] " + (new Date()).toString());

  // const latlng = new google.maps.LatLng(now_lat, now_lng);
  const myOptions = {
      zoom: 17,
      center: {
        //マップの初期位置
        lat: now_lat,
        lng: now_lng
      },
      mapTypeId: google.maps.MapTypeId.HYBRID, //マップのタイプ、今は航空写真
      mapTypeControl: false, // 地図タイプの変更をできなくする
      disableDefaultUI: true, // UI(拡大ボタンとか)を消す
      keyboardShortcuts:false, // ショートカットを使えないようにする（表示を消したかっただけ）

  };
  const googlemap = new google.maps.Map(document.getElementById("map"), myOptions);
  const marker = new google.maps.Marker({
      position: {
        //マップの初期位置
        lat: now_lat,
        lng: now_lng
      },
      map: googlemap
  });

  // ゲームエリア
  new google.maps.Circle({
    center: {
      lat: now_lat,
      lng: now_lng
    },       // 中心点(google.maps.LatLng)
    fillColor: '#0000ff',   // 塗りつぶし色
    fillOpacity: 0.5,       // 塗りつぶし透過度（0: 透明 ⇔ 1:不透明）
    map: googlemap,             // 表示させる地図（google.maps.Map）
    radius: game_area_range,          // 半径（ｍ）
    strokeColor: '#0000ff', // 外周色
    strokeOpacity: 1,       // 外周透過度（0: 透明 ⇔ 1:不透明）
    strokeWeight: 3         // 外周太さ（ピクセル）
  });
  if (make_team_flag == true){
    parameter =
    {
      'gamecode' : gamecode, 'game_area_range' : game_area_range, 'goal_num' : goal_num, 'gameset_num' : gameset_num, 'limit_time' : limit_time, 
      'goal_point_probability' : JSON.stringify(goal_point_probability_list), 'center_Lat' : now_lat, 'center_Lng' : now_lng, 'goal_LatLng' : JSON.stringify(random_LatLng_list)
    };
    InsertTeamData(parameter).then(function () {
      console.log('add game');
    });
  }
}

function initMap(){
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      // 取得成功した場合
      map,
      // 取得失敗した場合
      function(error) {
        switch(error.code) {
          case 1: //PERMISSION_DENIED
            alert("位置情報の利用が許可されていません");
            break;
          case 2: //POSITION_UNAVAILABLE
            alert("現在位置が取得できませんでした");
            break;
          case 3: //TIMEOUT
            alert("タイムアウトになりました");
            break;
          default:
            alert("その他のエラー(エラーコード:"+error.code+")");
            break;
        }
      }
    );
  } else {
    alert("この端末では位置情報が取得できません");
  };
}

const clickEvent = () => {
  // チーム登録が必要
  if (make_team_flag == true){

    const modal_back_div = document.createElement('div');
    modal_back_div.id = 'modal_back';
    select_rule_div.appendChild(modal_back_div);
  
    const modal_main_div = document.createElement('div');
    modal_main_div.id = 'modal';
    modal_back_div.appendChild(modal_main_div);
    
    // 2回目に実行される方
    if (typeof(navigator.geolocation) != 'undefined') {
      navigator.geolocation.getCurrentPosition(map);
    }
    else{
      alert('位置情報が取得できません');
    }
  
    const game_start_text = document.createElement('p');
    game_start_text.id = 'game_start_text';
    game_start_text.textContent = 'これでゲームを開始します';
    modal_main_div.appendChild(game_start_text);
  
    const game_info_text = document.createElement('p');
    game_info_text.id = 'game_info_text';
    game_info_text.innerHTML = `ゲームコード：${gamecode}<br>ゲームエリアの半径：${game_area_range}[m]<br>ゴールの数：${goal_num}<br>ゲームセット数：${gameset_num}<br>制限時間：${limit_time}[分]`;
    modal_main_div.appendChild(game_info_text);
  
    const map_div = document.createElement('div');
    map_div.id = 'map';
    modal_main_div.appendChild(map_div);
  
    const start_game_btn = document.createElement('input');
    start_game_btn.type = 'submit';
    start_game_btn.id = 'start_game_btn';
    start_game_btn.value = 'スタート!';
    start_game_btn.disabled = false;
    modal_main_div.appendChild(start_game_btn);
  
    modal_back_div.style.display = 'block';
  
    start_game_btn.onclick = () => {
      while(select_rule_div.lastChild){
        select_rule_div.removeChild(select_rule_div.lastChild);
      }
      game(gamecode, make_team_flag, total_score, gameset_num);
    }
  }
    // チーム登録不要
  else{
    parameter = {'gamecode' : gamecode};
    GetTeamData(parameter).then(function (team_data) {
      // jsonが帰ってこない場合はfalseになる
      // チームコードが登録されている場合
      if(team_data != false){
        game_area_range = Number(team_data['game_area_range']);
        goal_num = Number(team_data['goal_num']);
        gameset_num = Number(team_data['gameset_num']);
        limit_time = Number(team_data['limit_time']);

        const modal_back_div = document.createElement('div');
        modal_back_div.id = 'modal_back';
        select_rule_div.appendChild(modal_back_div);
      
        const modal_main_div = document.createElement('div');
        modal_main_div.id = 'modal';
        modal_back_div.appendChild(modal_main_div);

        // 2回目に実行される方
        if (typeof(navigator.geolocation) != 'undefined') {
          navigator.geolocation.getCurrentPosition(map);
        }
        else{
          alert('位置情報が取得できません');
        }
      
        const game_start_text = document.createElement('p');
        game_start_text.id = 'game_start_text';
        game_start_text.textContent = 'これでゲームを開始します';
        modal_main_div.appendChild(game_start_text);
      
        const game_info_text = document.createElement('p');
        game_info_text.id = 'game_info_text';
        game_info_text.innerHTML = `ゲームコード：${gamecode}<br>ゲームエリアの半径：${game_area_range}[m]<br>ゴールの数：${goal_num}<br>ゲームセット数：${gameset_num}<br>制限時間：${limit_time}[分]`;
        modal_main_div.appendChild(game_info_text);
      
        const map_div = document.createElement('div');
        map_div.id = 'map';
        map_div.style.height = '50vh';
        modal_main_div.appendChild(map_div);
      
        const start_game_btn = document.createElement('input');
        start_game_btn.type = 'submit';
        start_game_btn.id = 'start_game_btn';
        start_game_btn.value = 'start!';
        start_game_btn.disabled = false;
        modal_main_div.appendChild(start_game_btn);
      
        modal_back_div.style.display = 'block';

        start_game_btn.onclick = () => {
          while(select_rule_div.lastChild){
            select_rule_div.removeChild(select_rule_div.lastChild);
          }
          game(gamecode, make_team_flag, total_score, gameset_num);
        }
      }
      else{ // チームコードの登録がない
        alert('記載されたチームコードは存在しません');
        join_team_btn.disabled = false;
      }
    });
  }
}


const rule = (make_team_flag_temp) => {
  const background_div = document.getElementById('background');
  background_div.style.opacity = '0.5';

  make_team_flag = make_team_flag_temp;

  const title_h1 = document.createElement("h1");
  title_h1.id = 'title';
  title_h1.textContent = 'ぼっち大冒険';
  title_h1.style.margin = '0';
  select_rule_div.appendChild(title_h1);

  // const body = document.body;
  // const script_element = document.createElement('script');
  // script_element.src = 'https://maps.googleapis.com/maps/api/js?v=3&key=AIzaSyCjpcBI57XAEzvIqzNBEj4eIpVzRaRe93U&callback=initMap';
  // body.appendChild(script_element);

  // make_team_flagがtrueならチーム作成，falseならチーム参加
  if(make_team_flag == true){
    const explanation_h2 = document.createElement("h2");
    explanation_h2.id = 'explanation';
    explanation_h2.textContent = 'チーム作成';
    select_rule_div.appendChild(explanation_h2);

    const game_code_text = document.createElement('p');
    game_code_text.id = 'game_code_text';
    game_code_text.innerHTML = "ゲームコード：<input id='game_code_input' type='text'>";
    select_rule_div.appendChild(game_code_text);
  
    const setting_range_text = document.createElement('p');
    setting_range_text.id = 'setting_range_text';
    setting_range_text.innerHTML = "ゲームエリアの半径：<input id='setting_range_input' type='number' value=200 min=100 step=10>[m]";
    select_rule_div.appendChild(setting_range_text);
  
    const goal_num_text = document.createElement('p');
    goal_num_text.id = 'goal_num_text';
    goal_num_text.innerHTML = "ゴールの数：<input id='goal_num_input' type='number' value=5 min=1>";
    select_rule_div.appendChild(goal_num_text);

    const gameset_num_text = document.createElement('p');
    gameset_num_text.id = 'gameset_num_text';
    gameset_num_text.innerHTML = "ゲームセット数：<input id='gameset_num_input' type='number' value=3 min=1>";
    select_rule_div.appendChild(gameset_num_text);
  
  
    const limit_time_text = document.createElement('p');
    limit_time_text.id = 'limit_time_text';
    limit_time_text.innerHTML = "制限時間：<input id='limit_time_input' type='number' value=5 min=1 max=60 step=0.1>[分]";
    select_rule_div.appendChild(limit_time_text);
    
    const make_team_btn = document.createElement('input');
    make_team_btn.id = 'make_team_btn';
    make_team_btn.type = 'submit';
    make_team_btn.value = 'チーム作成';
    select_rule_div.appendChild(make_team_btn);
  
    make_team_btn.onclick = () => {
      const game_code_input = document.getElementById('game_code_input');
      const setting_range_input = document.getElementById('setting_range_input');
      const goal_num_input = document.getElementById('goal_num_input');
      const gameset_num_input = document.getElementById('gameset_num_input');
      const limit_time_input = document.getElementById("limit_time_input");
      if (game_code_input.value.length == 0){
        alert('ゲームコードが入力されていません');
      }
      else if(setting_range_input.value.length == 0){
        alert('ゲームエリアの半径が入力されていません');
      }
      else if(goal_num_input.value.length == 0){
        alert('ゴールの数が入力されていません');
      }
      else if(gameset_num_input.value.length == 0){
        alert('ゲームセット数が入力されていません');
      }
      else if(limit_time_input.value.length == 0){
        alert('制限時間が入力されていません');
      }
      else{
        make_team_btn.disabled = true;
        gamecode = game_code_input.value;
        game_area_range = Number(setting_range_input.value);
        goal_num = Number(goal_num_input.value);
        gameset_num = Number(gameset_num_input.value);
        limit_time = Number(limit_time_input.value);
        clickEvent();
      }
    };
  }
  else{
    const game_code_text = document.createElement('p');
    game_code_text.id = 'game_code_text';
    game_code_text.innerHTML = "ゲームコード：<input id='game_code_input' type='text'>";
    select_rule_div.appendChild(game_code_text);

    // const join_team_btn = document.createElement('input');
    join_team_btn.id = 'join_team_btn';
    join_team_btn.type = 'submit';
    join_team_btn.value = 'チームに参加';
    select_rule_div.appendChild(join_team_btn);
  
    join_team_btn.onclick = () => {
      const game_code_input = document.getElementById('game_code_input');

      if(game_code_input.value.length == 0){
        alert('ゲームコードが入力されていません');
      }
      else{
        join_team_btn.disabled = true;
        gamecode = game_code_input.value;
        clickEvent();
      }
    };
  }
}


export default rule;