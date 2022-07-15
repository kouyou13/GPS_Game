'use strict';
import result from './result.js';
const body = document.body;
const game_div = document.getElementById('game');
let now_lat;
let now_lng;
let mymap;
let gamecode;
let game_area_range;
let goal_num;
let gameset_num;
let limit_time;
let time_count;
let make_team_flag = false;
let timer_min;
let timer_sec;
let random_LatLng_list = []; // ランダムに決めたゴールの座標
let goal_point_probability_list = []; // ゴール地点の確率
let goal_point_probability;
let clear_flag = false; // trueならクリア，falseなら終わり
let geolocation_id;
let gps_loop_id;
let timer_loop_id;
let googlemap;
let marker;
let total_score;
let old_LatLng = [-1, -1]; // ゴールしたゴール地点
let parameter = {};
const goal_area_range = 10; // ゴールエリアの範囲は半径10[m]とする

const modal_back = document.createElement('div');
const result_modal = document.createElement('div');
const timer_text = document.createElement('p');
const timer_progress = document.createElement('progress');

const GetTeamData = (parameter) => {
  return $.ajax({
    url: "./api/get_team.php",
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

// 2地点の座標から実際の距離[m]を求める
const rangeCalculation = (lat_1, lng_1, lat_2, lng_2) => {
  // https://komoriss.com/calculate-distance-between-two-points-from-latitude-and-longitude/
  const change_radian = Math.PI / 180;
  const lat_1_rad = lat_1 * change_radian;
  const lng_1_rad = lng_1 * change_radian;
  const lat_2_rad = lat_2 * change_radian;
  const lng_2_rad = lng_2 * change_radian;
  const range = 6378.137 * Math.acos(Math.sin(lat_1_rad) * Math.sin(lat_2_rad) + Math.cos(lat_1_rad) * Math.cos(lat_2_rad) * Math.cos(lng_2_rad - lng_1_rad)) * 1000;
  // 単位は[m]
  return range;
}

const start_get_gps = () => {
  if (typeof(navigator.geolocation) != 'undefined') {
    navigator.geolocation.getCurrentPosition(map);
    // 位置情報を継続して監視する
    // 位置が変わるごとに取得

    // window.addEventListener('load',function() {
      // });
      // gps_loop_id = setInterval(function(){
        //   navigator.geolocation.getCurrentPosition(success);
        // }, 1000);
    geolocation_id = navigator.geolocation.watchPosition(success, error);
    timer_loop_id = setInterval(changeTimer, 1000);
  }
}

// 地図の描写
const map = (position) => {
  now_lat = position.coords.latitude;
  now_lng = position.coords.longitude;

  // console.log("[ 緯度 ] " + now_lat);
  // console.log("[ 経度 ] " + now_lng);
  // console.log("[ 日時 ] " + (new Date()).toString());

  // const latlng = new google.maps.LatLng(now_lat, now_lng);
  const myOptions = {
      zoom: 20,
      // minZoom: 19,
      // maxZoom: 21,
      center: {
        //マップの初期位置
        lat: now_lat,
        lng: now_lng
      },
      mapTypeId: google.maps.MapTypeId.HYBRID, //マップのタイプ、今は航空写真
      mapTypeControl: false, // 地図タイプの変更をできなくする
      disableDefaultUI: true, // UI(拡大ボタンとか)を消す
      keyboardShortcuts:false, // ショートカットを使えないようにする（表示を消したかっただけ）
      scrollwheel: false,
      disableDoubleClickZoom: true,
      draggable: false,
  };
  googlemap = new google.maps.Map(document.getElementById("game_map"), myOptions);
  marker = new google.maps.Marker({
      position: {
        //マップの初期位置
        lat: now_lat,
        lng: now_lng
      },
      map: googlemap,
      // icon: {
      //   url: '/img/marker04.png' // お好みの画像までのパスを指定
      // },
  });

  // ゲームエリア
  new google.maps.Circle({
    center: {
      lat: now_lat,
      lng: now_lng
    },       // 中心点(google.maps.LatLng)
    fillColor: '#0000ff',   // 塗りつぶし色
    fillOpacity: 0,       // 塗りつぶし透過度（0: 透明 ⇔ 1:不透明）
    map: googlemap,             // 表示させる地図（google.maps.Map）
    radius: game_area_range,          // 半径（ｍ）
    strokeColor: '#0000ff', // 外周色
    strokeOpacity: 1,       // 外周透過度（0: 透明 ⇔ 1:不透明）
    strokeWeight: 3         // 外周太さ（ピクセル）
  });

  // ゴールエリア
  for (let i=0; i<goal_num; i++){
    // console.log('[ 緯度r ]' + random_Lat_list[i]);
    // console.log('[ 経度r ]' + random_Lng_list[i]);
    new google.maps.Circle({
      center: {
        lat: Number(random_LatLng_list[i][0]),
        lng: Number(random_LatLng_list[i][1])
      },       // 中心点(google.maps.LatLng)
      fillColor: '#ff0000',   // 塗りつぶし色
      fillOpacity: 0.5,       // 塗りつぶし透過度（0: 透明 ⇔ 1:不透明）
      map: googlemap,             // 表示させる地図（google.maps.Map）
      radius: goal_area_range,          // 半径（ｍ）
      strokeColor: '#ff0000', // 外周色
      strokeOpacity: 1,       // 外周透過度（0: 透明 ⇔ 1:不透明）
      strokeWeight: 1         // 外周太さ（ピクセル）
    });
  }
}

// 現在位置を表示する
const success = (position) => {
  now_lat = position.coords.latitude;
  now_lng = position.coords.longitude;
  // googlemap.panTo(new google.maps.LatLng(now_lat, now_lng));
  googlemap.setCenter(new google.maps.LatLng(now_lat, now_lng));
  // console.log('-----------------------------');
  console.log('gps_value_change');
  // console.log("[ 緯度 ] " + now_lat);
  // console.log("[ 経度 ] " + now_lng);
  // console.log("[ 日時 ] " + (new Date()).toString());
  // console.log('-----------------------------');

  marker.setMap(null);
  marker = new google.maps.Marker({
    position: {
      //マップの初期位置
      lat: now_lat,
      lng: now_lng
    },
    map: googlemap,
    // icon: {
    //   url: '/img/marker04.png' // お好みの画像までのパスを指定
    // },
  });

  let coordinate_diff;
  // 現在地とゴール地点が10[m]以下かの判定
  for (let i=0; i<goal_num; i++){
    coordinate_diff = rangeCalculation(now_lat, now_lng, Number(random_LatLng_list[i][0]), Number(random_LatLng_list[i][1]));
    // console.log(coordinate_diff);
    if (coordinate_diff < goal_area_range && result_modal.lastChild == null && old_LatLng[0] != Number(random_LatLng_list[i][0]) && old_LatLng[1] != Number(random_LatLng_list[i][1])){
      console.log('goal!');
      navigator.geolocation.clearWatch(geolocation_id); // 現在地の取得を止める
      // clearInterval(gps_loop_id); // 現在地の取得を止める
      clearInterval(timer_loop_id); // 制限時間を止める
      modal_back.style.display = 'block';
      const result_text = document.createElement('p');
      result_text.id = 'result_text';
      
      goal_point_probability = goal_point_probability_list[i];
      if (goal_point_probability < 0){
        result_text.innerHTML = `このゴールは${Math.abs(goal_point_probability)}%の確率で<br>不幸なことが起こります<br><br>別のゴールに行くまで<br>このゴールには戻れません`;
      }
      else{
        result_text.innerHTML = `このゴールは${Math.abs(goal_point_probability)}%の確率で<br>幸運なことが起こります！<br><br>別のゴールに行くまで<br>このゴールには戻れません`;
      }
      result_modal.appendChild(result_text);
      
      const result_btn = document.createElement('input');
      result_btn.id = 'result_btn';
      result_btn.type = 'submit';
      result_btn.value = '結果画面へ';
      result_modal.appendChild(result_btn);

      const cancel_btn =document.createElement('input');
      cancel_btn.id = 'cancel_btn';
      cancel_btn.type = 'submit';
      cancel_btn.value = 'キャンセル';
      result_modal.appendChild(cancel_btn);

      result_btn.onclick = () => {
        while(game_div.lastChild){
          game_div.removeChild(game_div.lastChild);
        }
        clear_flag = true;
        result(gamecode, goal_point_probability, clear_flag, total_score, make_team_flag, gameset_num);
      }

      cancel_btn.onclick = () => {
        while(result_modal.lastChild){
          result_modal.removeChild(result_modal.lastChild);
        }
        modal_back.style.display = 'none';
        old_LatLng[0] = Number(random_LatLng_list[i][0]);
        old_LatLng[1] = Number(random_LatLng_list[i][1]);
        geolocation_id = navigator.geolocation.watchPosition(success, error);
        timer_loop_id = setInterval(changeTimer, 1000);
      }
    }
    else{
      console.log('continue');
    }
  }
}

// エラー用
const error = (e) => {
  alert("エラーが発生しました - " + e.message);
  // navigator.geolocation.clearWatch(geolocation_id); // 現在地の取得を止める
  // // clearInterval(gps_loop_id); // 現在地の取得を止める
  // // clearInterval(timer_loop_id); // 制限時間を止める
  // modal_back.style.display = 'block';
  // const result_text = document.createElement('p');
  // result_text.id = 'result_text';
  
  // goal_point_probability = 50;
  // if (goal_point_probability < 0){
  //   result_text.innerHTML = `このゴールは${Math.abs(goal_point_probability)}%の確率で<br>不幸なことが起こります<br><br>別のゴールに行くまで<br>このゴールには戻れません`;
  // }
  // else{
  //   result_text.innerHTML = `このゴールは${Math.abs(goal_point_probability)}%の確率で<br>幸運なことが起こります！<br><br>別のゴールに行くまで<br>このゴールには戻れません`;
  // }
  // result_modal.appendChild(result_text);
  
  // const result_btn = document.createElement('input');
  // result_btn.id = 'result_btn';
  // result_btn.type = 'submit';
  // result_btn.value = '結果画面へ';
  // result_modal.appendChild(result_btn);

  // const cancel_btn =document.createElement('input');
  // cancel_btn.id = 'cancel_btn';
  // cancel_btn.type = 'submit';
  // cancel_btn.value = 'キャンセル';
  // result_modal.appendChild(cancel_btn);

  // result_btn.onclick = () => {
  //   while(game_div.lastChild){
  //     game_div.removeChild(game_div.lastChild);
  //   }
  //   clear_flag = true;
  //   result(gamecode, goal_point_probability, clear_flag, total_score, make_team_flag, gameset_num);
  // }

  // cancel_btn.onclick = () => {
  //   while(result_modal.lastChild){
  //     result_modal.removeChild(result_modal.lastChild);
  //   }
  //   modal_back.style.display = 'none';
  //   old_LatLng[0] = Number(random_LatLng_list[i][0]);
  //   old_LatLng[1] = Number(random_LatLng_list[i][1]);
  //   geolocation_id = navigator.geolocation.watchPosition(success, error);
  //   timer_loop_id = setInterval(changeTimer, 1000);
  // }
}


const changeTimer = () => {
  time_count = time_count - 1;
  timer_min = ( '00' + parseInt(time_count / 60) ).slice( -2 );
  timer_sec = ( '00' + (time_count % 60) ).slice( -2 );
  timer_text.textContent = `${timer_min}:${timer_sec}`;
  timer_progress.value = time_count;
  // 時間切れ
  if(time_count == 0){
    console.log('ゲームオーバー!');
    navigator.geolocation.clearWatch(geolocation_id); // 現在地の取得を止める
    // clearInterval(gps_loop_id); // 現在地の取得を止める
    clearInterval(timer_loop_id); // 制限時間を止める
    modal_back.style.display = 'block';
    const result_text = document.createElement('p');
    result_text.id = 'result_text';
    goal_point_probability = -1;
    result_text.innerHTML = 'ゲームオーバー！！<br>次のゲームには参加できません';
    result_modal.appendChild(result_text);
    
    const result_btn = document.createElement('input');
    result_btn.id = 'result_btn';
    result_btn.type = 'submit';
    result_btn.value = '結果画面へ';
    result_modal.appendChild(result_btn);

    result_btn.onclick = () => {
      while(game_div.lastChild){
        game_div.removeChild(game_div.lastChild);
      }
      result(gamecode, goal_point_probability, clear_flag, total_score, make_team_flag, gameset_num);
    }
  }
}

const game = (gamecode_temp, make_team_flag_temp, total_score_temp, gameset_num_temp) => {
  gamecode = gamecode_temp;
  make_team_flag = make_team_flag_temp;
  total_score = total_score_temp;
  gameset_num = gameset_num_temp;
  parameter = {'gamecode' : gamecode};
  GetTeamData(parameter).then(function (team_data) {
    game_area_range = Number(team_data['game_area_range']);
    goal_num = Number(team_data['goal_num']);
    limit_time = Number(team_data['limit_time']);
    time_count = limit_time * 60; // 分から秒に変換
    goal_point_probability_list = JSON.parse(team_data['goal_point_probability']);
    random_LatLng_list = JSON.parse(team_data['goal_LatLng']);
    // console.log(random_LatLng_list);
    
    const title_h1 = document.createElement("h1");
    title_h1.id = 'title';
    title_h1.textContent = 'ぼっち大冒険';
    title_h1.style.margin = '0';
    game_div.appendChild(title_h1);

    // const timer_text = document.createElement('p');
    timer_min = ( '00' + time_count / 60 ).slice( -2 );
    timer_sec = ( '00' + time_count % 60 ).slice( -2 );
    timer_text.textContent = `${timer_min}:${timer_sec}`;
    game_div.appendChild(timer_text);
  
    // const timer_progress = document.createElement('progress');
    timer_progress.value = time_count;
    timer_progress.max = time_count;
    game_div.appendChild(timer_progress);
  
    const game_map_div = document.createElement('div');
    game_map_div.id = 'game_map';
    game_div.appendChild(game_map_div);
  
    // const modal_back_div = document.createElement('div');
    modal_back.id = 'modal_back';
    game_div.appendChild(modal_back);
  
    // const result_modal = document.createElement('div');
    result_modal.id = 'result_modal';
    modal_back.appendChild(result_modal);
    
    
    start_get_gps();
  });
}

export default game;