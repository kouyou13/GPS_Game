<?php
  // チーム情報の取得
  include 'db_config.php';
  ini_set('display_errors', "On");

  $gamecode = $_POST['gamecode'];
  // $gamecode = 'demo';

  if (isset($gamecode)){
    try{
      // connect
      $db = new PDO(PDO_DSN, DB_USERNAME, DB_PASSWORD);
      $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  
      // チームIDの取得
      $stmt = $db->query("SELECT * FROM games WHERE game_code='$gamecode'");
      $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);

      if (isset($teams['id'])){
        $db->exec("UPDATE games SET player_num=player_num+1 WHERE game_code='$gamecode'");
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