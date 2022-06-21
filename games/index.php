<?php
    $dir = glob('*.json');

    if(count($dir) < 1){
        echo 'No data has been collected';
        return;
    }
?>
    <ul style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 10px;>">
        <?php foreach($dir as $index => $file): ?>
        <?php
            /** 
             * Some useful information about the file 
             */ 
            $filesize = filesize($file);

            /**
             * Determine games collected
             */
            $contents = file_get_contents($file);
            $jsonArray = json_decode($contents, true);

            /**
             * Format date and time
             */
            $finds = array('.json', 'games_');
            $replaces = array('', '');
            $formatDateReplacements = str_replace($finds, $replaces, $file);
            $explodeDate = explode('-', $formatDateReplacements);
            $createdDate = date_create("{$explodeDate[0]}-{$explodeDate[1]}-{$explodeDate[2]} {$explodeDate[3]}:{$explodeDate[4]}:{$explodeDate[5]}");
            $date = date_format($createdDate, 'Y-m-d H:i:s');
        ?>
                <li style="list-style-type: none; padding: 10px; border: 1px solid #ccc; border-radius: 6px;">
                    Nr: <?= $index +1 ?><br/>
                    Created: <?= $date ?><br/>
                    Filesize: <?= $filesize ?>KB<br/>
                    Games collected: <?= count($jsonArray) ?><br/>
                    <a href='<?= $file ?>'>Link</a>
                </li>
        <?php endforeach; ?>
    </ul>