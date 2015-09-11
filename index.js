(function () {
    var trackBlocks = [
            'straight',
            'down',
            'left',
            'jump',
            'straight',
            'right'
        ],
        progress = 0,
        numberOfBlocksLeftBehind = 0,
        controls = {
            turns: [],
            pause: true
        },
        domCache = {},
        playerElement = query('.player'),
        scoreElement = query('.score'),
        trackElement = query('.track'),
        wallElement = query('.wall'),
        AudioContext = window.AudioContext || window.webkitAudioContext,
        audioContext = AudioContext && new AudioContext(),
        runningSound;

    main();

    function main () {
        scoreElement.innerHTML = localStorage.highestScore || 0;
        trackElement.innerHTML = trackBlocks.reduceRight(build, '');
        addEventListener('keydown', handleKeyDown);
    }

    function query (selector) {
        return domCache[selector] || (domCache[selector] = document.querySelector(selector));
    }

    function build (child, className) {
        return ('<div class="className-wrapper wrapper"><div class="className track-block"></div>child</div>'
            .replace(/className/g, (child === '' ? 'last ' : '') + className )
            .replace('child', child)
        );
    }

    function handleKeyDown (event) {
        var strategy = getKeyDownStrategy(event);
        setTimeout(function () {
            wallElement.scrollIntoView();
        }, 0); // firefox scroll is hacky to get rid of
        if (controls.gameOver) {
            return;
        }
        if (controls.pause) {
            playOrPause();
        } else if (strategy) {
            event.preventDefault();
            strategy();
            return false;
        }
    }

    function getKeyDownStrategy (event) {
        return {
            39: turn.bind(null, 'right'),// right arrow
            68: turn.bind(null, 'right'),// d arrow
            37: turn.bind(null, 'left'), // left arrow
            65: turn.bind(null, 'left'), // a key
            27: playOrPause,             // escape
            32: jump.bind(null, event),  // space
        } [event.keyCode];
    }

    function turn (side) {
        if (controls.turns.length < 2) {
            controls.turns.push(side);
        }
    }

    function playOrPause () {
        controls.pause = !controls.pause;
        wallElement.classList.add('left-behind');
        if (controls.pause) {
            runningSound.stop();
        } else {
            run();
            update();
        }
    }

    function jump () {
        var jumpingSound;
        if (controls.jump) {
            return;
        }
        playerElement.setAttribute('class', 'player jumping');
        controls.jump = true;
        runningSound.stop();
        setTimeout(function () {
            jumpingSound = makeSound({
                gain: 1
            });
        }, 1450);
        setTimeout(function () {
            if (!controls.gameOver) {
                controls.jump = false;
                jumpingSound.stop();
                run();
            }
        }, 1500);
    }

    function run () {
        runningSound = makeSound({
            gain: 0.25
        });
        playerElement.setAttribute('class', 'player running');
    }

    function makeSound (options) {
        if (!AudioContext) {
            return {
                stop: function () {}
            };
        }
        var gain = audioContext.createGain(),
            osc = audioContext.createOscillator();
        options = options || {};
        gain.gain.value = options.gain || 1;
        osc.type = options.type || 'square';
        osc.frequency.value = options.frequency || 1;
        osc.detune.value = 0;
        osc.connect(gain);
        osc.start(options.delay || 0);
        gain.connect(audioContext.destination);
        return osc;
    }

    function update () {
        if (progress > 1) {
            moveToNextBlock();
        }
        progress += getProgressDelta();
        trackElement.style.transform = getTrackTransformation();
        scoreElement.innerHTML = getScore();

        if (trackBlocks[0] === 'jump' && !controls.jump) {
            gameOver();
        }

        if (!controls.pause) {
            requestAnimationFrame(update);
        }
    }

    function moveToNextBlock () {
        progress = 0;
        if (['right', 'left'].indexOf(trackBlocks[0]) !== -1 && controls.turns[0] !== trackBlocks[0] ||
            ['right', 'left'].indexOf(trackBlocks[0]) === -1 && controls.turns[0]) {
            throw gameOver();
        }

        showNextKeyToBePressed();

        controls.turns.shift();
        if (controls.turns.length === 0) {
            controls.turns.push(false);
        }
        trackBlocks.shift();
        numberOfBlocksLeftBehind++;
        trackBlocks.push(getNextBlock());
        trackElement.innerHTML = trackBlocks.reduceRight(build, '');
    }

    function showNextKeyToBePressed () {
        var controlKeys = ['left', 'right', 'jump'];
        controlKeys.forEach(function (keyName) {
            query('#' + keyName).classList.remove('to-be-pressed');
        });
        if (controlKeys.indexOf(trackBlocks[2]) > -1) {
            query('#' + trackBlocks[2]).classList.add('to-be-pressed');
        }
    }

    function getNextBlock() {
        var randomDigit = Math.random().toString()[2];
        return {
            1: 'left',
            2: 'right',
            3: 'down',
        //  4: 'up',
            5: trackBlocks[trackBlocks.length - 1] !== 'jump' && 'jump',
        } [randomDigit] || 'straight';
    }

    function getProgressDelta () {
        return ['left', 'right', 'down'].indexOf(trackBlocks[0]) > -1 ? 0.03 : 0.02;
    }

    function getTrackTransformation () {
        return 'rotateX(45deg) ' + (
            getUserControlledTranformation() ||
            getAutomaticTransformation() ||
            'translateY(' + progress * -128 + 'px)'
        );
    }

    function getUserControlledTranformation () {
        return {
            left:  'translateY(' + progress * -64  + 'px) translateX(' + progress * -64 + 'px) rotateZ(' + progress * -90 + 'deg)',
            right: 'translateY(' + progress * -64  + 'px) translateX(' + progress * 64  + 'px) rotateZ(' + progress * 90  + 'deg)'
        } [controls.turns[0]];
    }

    function getAutomaticTransformation () {
        return {
            down:  'translateY(' + progress * -128 + 'px) translateZ(' + progress * 64  + 'px)',
            up:    'translateY(' + progress * -128 + 'px) translateZ(' + progress * -64 + 'px)',
        } [trackBlocks[0]];
    }

    function gameOver () {
        localStorage.highestScore = getScore();
        playerElement.setAttribute('class', 'player');
        requestAnimationFrame(function () {
            playerElement.setAttribute('class', 'player fell');
        });
        runningSound.stop();
        controls.pause = true;
        controls.gameOver = true;
        setTimeout(location.reload.bind(location), 1000);
    }

    function getScore () {
        return numberOfBlocksLeftBehind / 2 | 0;
    }
})();
