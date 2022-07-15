<?php
  // チーム情報の削除
  include 'db_config.php';
  ini_set('display_errors', "On");

  $gamecode = $_POST['gamecode'];
  // $gamecode = 'demo';

  if (isset($gamecode)){
    try{
      // connect
      $db = new PDO(PDO_DSN, DB_USERNAME, DB_PASSWORD);
      $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  
      // プレイヤー数を減らす
      $db->exec("UPDATE games SET player_num=player_num-1 WHERE game_code='$gamecode'");

      // プレイヤー数が0以下になったらゲーム情報を消す
      $db->exec("DELETE FROM games WHERE player_num=0");

      // disconnect
      $db = null;
  
    }
    catch(PDOException $e){
      $error = $e->getMessage();
      exit;
    }
  }
  // header('Content-Type: application/json'); // apiにしますよーってやつ
  // $json = json_encode(end();
  // print ($json);
?>