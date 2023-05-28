//kaboom setup 
kaboom({
    global: true,
    fullscreen: true,
    scale: 1.2,
    debug: true,
    clearColor: [0, 0, 0, 1],
})

// Constants for speed and jump
const MOVE_SPEED = 120
const JUMP_FORCE = 360
const BIG_JUMP_FORCE = 550
let CURRENT_JUMP_FORCE = JUMP_FORCE
let isJumping = true
const FALL_DEATH = 400

// Upload photos and root
loadRoot('https://i.imgur.com/')
loadSprite('coin', 'wbKxhcd.png')
loadSprite('evil-shroom', 'KPO3fR9.png')
loadSprite('brick', 'pogC9x5.png')
loadSprite('block', 'M6rwarW.png')
loadSprite('mario', 'Wb1qfhK.png')
loadSprite('mushroom', '0wMd92p.png')
loadSprite('surprise', 'gesQ1KP.png')
loadSprite('unboxed', 'bdrLpi6.png')
loadSprite('pipe-top-left', 'ReTPiWY.png')
loadSprite('pipe-top-right', 'hj2GK4n.png')
loadSprite('pipe-bottom-left', 'c1cYSbt.png')
loadSprite('pipe-bottom-right', 'nqQ79eI.png')

loadSprite('blue-block', 'fVscIbn.png')
loadSprite('blue-brick', '3e5YRQd.png')
loadSprite('blue-steel', 'gqVoI2b.png')
loadSprite('blue-evil-shroom', 'SvV4ueD.png')
loadSprite('blue-surprise', 'RMqCc1G.png')

// Mario Map
scene("game", ({ level, score }) => {
    layers(['bg', 'obj', 'ui'], 'obj')

    const maps = [
        [
        '                                                   ',
        '                                                   ',
        '                                                   ',
        '                                                   ',
        '                                                   ',
        '       %       =*=%=                               ',
        '                                                   ',
        '                                        -+         ',
        '                                ^   ^   ()         ',
        '==========================================   ======'
    ],
        [
        '@                                                  @',
        '@                                                  @',
        '@                                                  @',
        '@                                                  @',
        '@                                                  @',
        '@      %       @@@@@@                   x x        @',
        '@                                     x x x        @',
        '@                                   x x x x  x  -+ @',
        '@                          z  z   x x x x x  x  () @',
        '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
        ]
    ] 

    //Add a symbol to each photo in the map 
    const levelCfg = {
        width: 20,
        height: 20,
        '=': [sprite('block'), solid()],
        '$': [sprite('coin'), 'coin'],
        '%': [sprite('surprise'), solid(), 'coin-surprise'],
        '*': [sprite('surprise'), solid(), 'mushroom-surprise'],
        '}': [sprite('unboxed'), solid()],
        '(': [sprite('pipe-bottom-left'), solid(), scale(0.5)],
        ')': [sprite('pipe-bottom-right'), solid(), scale(0.5)],
        '-': [sprite('pipe-top-left'), solid(), scale(0.5), 'pipe'],
        '+': [sprite('pipe-top-right'), solid(), scale(0.5), 'pipe'],
        '^': [sprite('evil-shroom'), solid(), scale(1), 'dangerous'],
        '#': [sprite('mushroom'), solid(), scale(1), 'mushroom', body()],
        '!': [sprite('blue-block'), solid(), scale(0.5)],
        '&': [sprite('blue-brick'), solid(), scale(0.5 )],
        'z': [sprite('blue-evil-shroom'), solid(), scale(0.5), 'dangerous'],
        '@': [sprite('blue-surprise'), solid(), scale(0.5), 'coin-surprise'],
        'x': [sprite('blue-steel'), solid(), scale(0.5)],
    }

     const gameLevel = addLevel(maps[level], levelCfg)

    // Constant of the ScoreLabel
    const scoreLabel = add([
        text(score), 
        pos(30, 6),
        layer('ui'),
        {
            value: score,
        }
    ])

    add([text('level' + parseInt(level + 1)), pos(50, 6)])

    // Function for Mario to get Bigger
    function big() {
        let timer = 0
        let isBig = false
        return {
            update() {
                if (isBig) {
                    CURRENT_JUMP_FORCE = BIG_JUMP_FORCE
                    //delta time since last frame (Is a Kaboom method)
                    timer -= dt()
                    if (timer <= 0) {
                        this.smallify()
                    }
                }
            },
            isBig() {
                return isBig
            },
            smallify() {
                CURRENT_JUMP_FORCE = JUMP_FORCE
                this.scale = vec2(1)
                timer = 0
                isBig = false
            },
            biggify(time) {
                this.scale = vec2(2)
                timer = time
                isBig = true
            }
        }
    }

    //Add Mario 
    const player = add([
        sprite('mario'), solid(),
        pos(30, 0),
        body(),
        big(),
        origin('bot')
    ])

    //Make the mushroom move at certain speed on the x axis 
    action('mushroom', (m) => {
        m.move(60, 0)
    })

    //This is to show a coin when Mario Jump on a special brick 
    player.on('headbump', (obj) => {
        if (obj.is('coin-surprise')) {
            gameLevel.spawn('$', obj.gridPos.sub(0, 1))
            destroy(obj)
            gameLevel.spawn('}', obj.gridPos.sub(0, 0))
        }
        if (obj.is('mushroom-surprise')) {
            gameLevel.spawn('#', obj.gridPos.sub(0, 1))
            destroy(obj)
            gameLevel.spawn('}', obj.gridPos.sub(0, 0))
        }
    })

    //Mario eat the mushroom and grow using the grow function
    player.collides('mushroom', (m) => {
        destroy(m)
        player.biggify(6)
    })
    
    //Mario take the coin
    player.collides('coin', (c) => {
        destroy(c)
        scoreLabel.value++
        scoreLabel.text = scoreLabel.value
    })

    // Make evil mushrooms move
    const ENEMY_SPEED = 20
    action('dangerous', (d) =>  {
        d.move(-ENEMY_SPEED, 0)
    })
    
    //If you lose show the score value
    player.collides('dangerous', (d) => {
        if (isJumping) { 
            destroy(d)
        } else {
             go('lose', { score: scoreLabel.value})
        }
    })

    //Follow Mario when it's moving and show the score lavel when Mario falls from the game 
    player.action(() => {
        camPos(player.pos)
        if (player.pos.y >= FALL_DEATH) {
            go('lose', { score: scoreLabel.value })
        }
    })

    // Every time mario press the key down will go to the next level
    // the % symbol means that the game will keep looping on the existing levels 
    player.collides('pipe', () => {
        keyPress('down', () => {
            go('game', {
                level: (level + 1) % maps.length,
                score: scoreLabel.value
            })
        })
    }) 

    // Control keys
    keyDown('left', () => {
        player.move(-MOVE_SPEED, 0)
    })

    keyDown('right', () => {
        player.move(MOVE_SPEED, 0)
    })

    player.action(() => {
        if (player.grounded()) {
            isJumping = false
        }
    })

    keyPress('space', () => {
        if (player.grounded()) {
            isJumping = true
            player.jump(CURRENT_JUMP_FORCE)
        }
    })

})

//Get the score lavel at the center of the screen if you die 
scene('lose', ({score}) => {
    add([text(score, 32), origin('center'), pos(width()/2, height()/2)])
})


// This is a keyword to start the game
start("game", { level: 0, score: 0})
