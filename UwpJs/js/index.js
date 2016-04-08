/// <reference path="phaser.js" />
/// <reference path="curry.js" />
/// <reference path="phaser.min.js" />
var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaserCanvas', { preload: preload, create: create, update: update });

var platforms;
var player;
var cursors;
var stars;
var score = 0;
var scoreText;
var sfx;
var gamepad = null;

var leftThumbReport = updateElement("leftThumbstick");
var velocityReport = updateElement("velocity");
var starsReport = updateElement("starsLeft");
var httpGetReport = updateElement("httpGet");

function preload() {
    game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('star', 'assets/star.png');
    game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
    game.load.audio('sfx', ['assets/fx_mixdown.ogg', 'assets/fx_mixdown.mp3']);

    var request = new XMLHttpRequest();
    request.open('GET', 'http://www.chrisgomez.com', true);

    request.onload = function () {
        if (this.status >= 200 && this.status < 400) {
            // Success!
            httpGetReport(this.response.substring(0,35));
        } else {
            // We reached our target server, but it returned an error

        }
    };

    request.onerror = function () {
        // There was a connection error of some sort
    };

    request.send();
}

function create() {

    //Windows.Gaming.Input.Gamepad.addEventListener("gamepadadded", function (eventArgs) {
    //    gamepad = eventArgs;
    //});

    window.addEventListener("gamepadconnected", function (e) {
        gamepad = e.gamepad;
    });

    //  We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //  A simple background for our game
    game.add.sprite(0, 0, 'sky');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = game.add.group();

    //  We will enable physics for any object that is created in this group
    platforms.enableBody = true;

    // Here we create the ground.
    var ground = platforms.create(0, game.world.height - 64, 'ground');

    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    ground.scale.setTo(2, 2);

    //  This stops it from falling away when you jump on it
    ground.body.immovable = true;

    //  Now let's create two ledges
    var ledge = platforms.create(400, 400, 'ground');

    ledge.body.immovable = true;

    ledge = platforms.create(-150, 250, 'ground');

    ledge.body.immovable = true;

    // The player and its settings
    player = game.add.sprite(32, game.world.height - 150, 'dude');

    //  We need to enable physics on the player
    game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.bounce.y = 0.2;
    player.body.gravity.y = 300;
    player.body.collideWorldBounds = true;

    //  Our two animations, walking left and right.
    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);

    stars = game.add.group();

    //  We will enable physics for any star that is created in this group
    stars.enableBody = true;

    createStars();

    //  The score
    scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();

    // Add the audio for picking up a star
    // Set up an audio sprite
    sfx = game.add.audio('sfx');
    sfx.allowMultiple = true;

    //	And this defines the markers.
    //	They consist of a key (for replaying), the time the sound starts and the duration, both given in seconds.
    //	You can also set the volume and loop state, although we don't use them in this example (see the docs)

    sfx.addMarker('ping', 10, 1.0);
}

function update() {

    //  Collide the player and the stars with the platforms
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(stars, platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    game.physics.arcade.overlap(player, stars, collectStar, null, this);

    //  Reset the players velocity (movement)
    player.body.velocity.x = 0;

    //if (gamepad != null) {
    //    var reading = gamepad.getCurrentReading();
    //    leftThumbReport(reading.leftThumbstickX + ',' + reading.leftThumbstickY);
    //    var maybeVelocity = reading.leftThumbstickX * 150;
    //    if (maybeVelocity > -20 & maybeVelocity < 20) {
    //        maybeVelocity = 0;
    //    }
    //    velocityReport(maybeVelocity);

    //    player.body.velocity.x = maybeVelocity;

    //    if (((reading.buttons & 4) !== 0) && player.body.touching.down) {
    //        player.body.velocity.y = -350;
    //    }
    //}

    var gamepads = navigator.getGamepads();
    if (gamepads.length > 0 && gamepads[0] !== undefined) {
        leftThumbReport(gamepads[0].axes[0] + ',' + gamepads[0].axes[1]);

        var maybeVelocity = gamepads[0].axes[0] * 150;
        if (maybeVelocity > -20 & maybeVelocity < 20) {
            maybeVelocity = 0;
        }
        velocityReport(maybeVelocity);

        player.body.velocity.x = maybeVelocity;

        if ((gamepads[0].buttons[0].pressed === true) && player.body.touching.down) {
            player.body.velocity.y = -350;
        }
    }
 
    if (cursors.left.isDown) {
        //  Move to the left
        player.body.velocity.x = -150;

        player.animations.play('left');
    }
    else if (cursors.right.isDown) {
        //  Move to the right
        player.body.velocity.x = 150;

        player.animations.play('right');
    }
    else {
        //  Stand still
        player.animations.stop();

        player.frame = 4;
    }

    //  Allow the player to jump if they are touching the ground.
    if (cursors.up.isDown && player.body.touching.down) {
        player.body.velocity.y = -350;
    }
}

function collectStar(player, star) {

    // Removes the star from the screen
    star.kill();
    sfx.play('ping');

    //  Add and update the score
    score += 10;
    scoreText.text = 'Score: ' + score;

    var starsAlive = stars.children.filter(function(x) {
        return x.alive === true;
    });

    starsReport(starsAlive.length);

    if (starsAlive.length === 0) {
        createStars();
    }
}

function createStars() {
    //  Here we'll create 12 of them evenly spaced apart
    for (var i = 0; i < 12; i++) {
        //  Create a star inside of the 'stars' group
        var star = stars.create(i * 70, 0, 'star');

        //  Let gravity do its thing
        star.body.gravity.y = 300;

        //  This just gives each star a slightly random bounce value
        star.body.bounce.y = 0.7 + Math.random() * 0.2;
    }
}