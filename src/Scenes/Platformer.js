class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 600;
        this.DRAG = 600;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.MAX_VELOCITY = 400; // max horizontal velocity
        this.JUMP_VELOCITY = -500;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
    }

    create() {
        this.jumpSound = this.sound.add("jump");
        this.coinSound = this.sound.add("coin");
        this.deathSound = this.sound.add("death");
        this.winSound = this.sound.add("win");
        this.score = 0;
        this.alive = true;
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.decoLayer = this.map.createLayer("Deco-Tiles", this.tileset, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // TODO: Add createFromObjects here

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151,
        })
        
        // TODO: Add turn into Arcade Physics here

        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        this.coinGroup = this.add.group(this.coins);
        

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(50, 200, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // TODO: Add coin collision handler
        

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');
        this.aKey = this.input.keyboard.addKey('A');
        this.dKey = this.input.keyboard.addKey('D');
        this.wKey = this.input.keyboard.addKey('W');

        this.physics.world.drawDebug = false; // turn off debug by default


        // TODO: Add movement vfx here

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            random: true,
            scale: { start: 0.03, end: 0.2},
            maxAliveParticles: 4,
            lifespan: 350,
            gravityY: -400,
            alpha: { start: 1, end: 0.1 }
        })

        my.vfx.jumping = this.add.particles(0, 0, "kenny-particles", {
            frame: ['light_01.png', 'light_03.png'],
            random: true,
            scale: { start: 0.1, end: 0.15},
            maxAliveParticles: 2,
            lifespan: 350,
            gravityY: -400,
            alpha: { start: 1, end: 0.1 }
        })
        //killing vfx at first
        my.vfx.walking.stop();
        my.vfx.jumping.stop();

        // max speed clamp
        my.sprite.player.setMaxVelocity(this.MAX_VELOCITY, 1000); // (x, y)
        

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);


        //text for game over, score, win, etc.
        this.scoreText = this.add.text(this.cameras.main.centerX - 300, this.cameras.main.centerY - 200, "Score: 0/40", {
            fontSize: '20px',
            fill: '#FFFF00',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5, 0.5).setVisible(true);
        this.scoreText.setScrollFactor(0); // make sure the text doesn't scroll with the camera
        this.scoreText.setDepth(100); // make sure the text is on top of everything else

        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            this.score++;
            this.scoreText.setText(`Score: ${this.score}/40`);
            this.coinSound.play({
                seek: 0,
                volume: 0.5,
                forceRestart: true
            });
            obj2.destroy(); // remove coin on overlap
        });
        

        this.winText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, "You Win!!", {
            fontSize: '64px',
            fill: '#FFFF00',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5, 0.5).setVisible(false);
        this.winText.setScrollFactor(0); // make sure the text doesn't scroll with the camera
        this.winText.setDepth(100); // make sure the text is on top of everything else

        this.gameOverText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, "Press R to Restart", {
            fontSize: '64px',
            fill: '#ff0000',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5, 0.5).setVisible(false);
        this.gameOverText.setScrollFactor(0); // make sure the text doesn't scroll with the camera
        this.gameOverText.setDepth(100); // make sure the text is on top of everything else

    }

    update() {
        if(this.alive == true) {
        if(cursors.left.isDown || this.aKey.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else if(cursors.right.isDown || this.dKey.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
            my.vfx.jumping.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && (Phaser.Input.Keyboard.JustDown(cursors.up) || Phaser.Input.Keyboard.JustDown(this.wKey))) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            my.vfx.jumping.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.jumping.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.jumping.start();
            }
            this.jumpSound.play();
        }
        if(my.sprite.player.y > this.map.heightInPixels) {
            this.alive = false;
            my.sprite.player.setVelocity(0, 0);
            my.sprite.player.anims.stop();
            my.vfx.walking.stop();
            this.gameOverText.setVisible(true);
            this.cameras.main.shake(200, 0.005);
            this.deathSound.play();
        }
        if(this.score >= 40) {
            this.winText.setVisible(true);
            my.sprite.player.setVelocity(0, 0);
            my.sprite.player.anims.stop();
            my.vfx.walking.stop();
            this.winSound.play();
            this.alive = false;
        }
    }
        // stop the game and show game over screen if the player falls off the map
        
        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
}