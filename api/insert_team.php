<?php
  // チームコードの登録
  include 'db_config.php';
  ini_set('display_errors', "On");

  $gamecode = $_POST['gamecode'];
  $game_area_range = $_POST['game_area_range'];
  $goal_num = $_POST['goal_num'];
  $gameset_num = $_POST['gameset_num'];
  $limit_time = $_POST['limit_time'];
  $goal_point_probability = $_POST['goal_point_probability'];
  $center_Lat = $_POST['center_Lat'];
  $center_Lng = $_POST['center_Lng'];
  $goal_LatLng = $_POST['goal_LatLng'];

  // $gamecode = 'demo';
  // $game_area_range = 200;
  // $goal_num = 5;
  // $gamesetl_num = 3;
  // $limit_time = 10;
  // $goal_LatLng = array(
  //   [34.4826799, 136.8269498480347],
  //   [34.4833909, 136.82660045903387],
  //   [34.482337900000005, 136.82474432996696],
  //   [34.4826439, 136.82542127115607],
  //   [34.4823919, 136.8268079087531]
  // );
  // $goal_LatLng =  json_encode($goal_LatLng);


  if (isset($gamecode)){
    try{
      // connect
      $db = new PDO(PDO_DSN, DB_USERNAME, DB_PASSWORD);
      $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
      $stmt = $db->query("SELECT * FROM games WHERE game_code='$gamecode'");
      $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);

      if (!isset($teams[0]['id'])){
        // チームIDの登録
        $db->exec("INSERT INTO games(game_code, game_area_range, goal_num, gameset_num, limit_time, player_num, goal_point_probability, center_Lat, center_Lng, goal_LatLng) VALUES('$gamecode', $game_area_range, $goal_num, $gameset_num, $limit_time, 1, '$goal_point_probability', $center_Lat, $center_Lng, '$goal_LatLng')");
        $stmt = $db->query("SELECT * FROM games WHERE game_code='$gamecode'");
        $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);
      }
      else{
        $db->exec("UPDATE games SET game_area_range=$game_area_range, goal_num=$goal_num, gameset_num=$gameset_num, limit_time=$limit_time, player_num=player_num+1, goal_point_probability='$goal_point_probability', center_Lat=$center_Lat, center_Lng=$center_Lng, goal_LatLng='$goal_LatLng' WHERE game_code='$gamecode'");
      }
    
      // disconnect
      $db = null;
    
    }
    catch(PDOException $e){
      $error = $e->getMessage();
      exit;
    }
  }

  header('Content-Type: application/json'); // apiにしますよーってやつ
  $json = json_encode(end($teams));
  print ($json);
?>