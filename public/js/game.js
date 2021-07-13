function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function get1Dindex(x, y, width) {
    return x + y * width;
}
function get2Dcoords(idx, width) {
    x = idx % width;
    y = Math.floor(idx / width);
    return [x, y];
}

function increaseScore(dScore, SQUARE_SIZE) {
    prev = score;
    score += dScore;
    if (Math.floor(score / 150) > Math.floor(prev / 150)) {
        document.dispatchEvent(new Event('speedUp'));
    }
    drawScore(ctx, SQUARE_SIZE);
}

function getPieceColour(pieceNum) {
    colours = ['white', 'skyblue', 'red', 'green', 'purple', 'blue', 'orange', 'yellow'];
    return colours[pieceNum];
}
function getPieceConfig(pieceNum, orientation) {
    if (pieceNum == 0) {
        alert("getting config when the current piece is 0");
    }
    idx = pieceNum - 1; // pieceNum=0 is a blank sqaure
    arrangements = [
        [[1, 5, 9, 13], [0, 1, 2, 3]],
        [[0, 1, 5, 6], [2, 6, 5, 9]],
        [[4, 5, 1, 2], [1, 5, 6, 10]],
        [[1, 4, 5, 6], [2, 5, 6, 10], [0, 1, 2, 5], [0, 4, 5, 8]],
        [[1, 2, 5, 9], [0, 1, 2, 6], [2, 6, 10, 9], [1, 5, 6, 7]],
        [[1, 2, 6, 10], [4, 5, 6, 2], [1, 5, 9, 10], [5, 1, 2, 3]],
        [[1, 2, 5, 6]]
    ];
    configs = arrangements[idx];
    return configs[orientation % configs.length];
}

function genNextPiece(SQUARE_SIZE) {
    swappedHeld = false;
    piece = nextPieces.shift();
    piecePos = [3, 0];
    nextPieces = nextPieces.concat(randint(1, 7));

    drawNext(ctx, SQUARE_SIZE);
    // ensure that spawned piece doesn't overlap with others already in the grid
    for (rotation = 0; rotation < 4; rotation++) {
        if (canPieceMove(0, 0)) { return true; }
    }
    document.dispatchEvent(new Event("Game Over"));
    return false;
}

function canPieceMove(dx = 0, dy = 0) {
    // check that moving the current piece can fall
    occupied = getPieceConfig(piece, rotation);
    for (i = 0; i < occupied.length; i++) {
        var [xoff, yoff] = get2Dcoords(occupied[i], 4);
        x = piecePos[0] + xoff + dx;
        y = piecePos[1] + yoff + dy;
        // check x and y are not out of bounds
        if (Math.round(x) < 0 || Math.round(x) >= 10 || y >= 20) {return false; }
        // check square is not already filled
        if (grid[get1Dindex(Math.round(x), Math.round(y), 10)] != 0) { return false; }
    }
    // if none of the sqaure collide with an existing sqaure then let it fall
    return true;
}



// function startMovingPiece(dx, dy, SQUARE_SIZE, time) {
//     if (moving) { return; }

//     if (canPieceMove(dx, dy)) {
//         moving = true;
//         steps = 100;
//         falling = setInterval(() => {
//             piecePos = [piecePos[0] + dx / steps, piecePos[1] + dy / steps];
//             drawGrid(ctx, grid, SQUARE_SIZE);
//         }, time / steps);
//     } else {
//         if (dy > 0) {
//             setIntoGrid(SQUARE_SIZE);
//             // start moving the nex piece straight away
//             moving = false;
//             //startMovingPiece(dx, dy, SQUARE_SIZE, time);
//         }
//     }
// }

// function finishMovingPiece() {
//     clearInterval(falling);
//     moving = false;
//     piecePos = [Math.round(piecePos[0]), Math.round(piecePos[1])];
// }

function movePiece(dx, dy, SQUARE_SIZE) {
    if (canPieceMove(dx, dy)) {
        piecePos = [piecePos[0] + dx, piecePos[1] + dy];
        drawGrid(ctx, grid, SQUARE_SIZE);
    } else {
        // if movement is downwards then set piece into the grid
        if (dy > 0) {
            setIntoGrid(SQUARE_SIZE);
        }
        return false;
    }
}

function stepPiece(dx, dy, time, SQUARE_SIZE, callback=undefined) {
    if (canPieceMove(dx, dy)) {
        let count = 0;
        let steps = 25;
        let interval = setInterval(() => {
            count++;
            if (count < steps) {
                piecePos = [piecePos[0] + dx/steps, piecePos[1] + dy/steps];
                drawGrid(ctx, grid, SQUARE_SIZE);
            }
            else{
                clearInterval(interval);
                if (callback!=undefined){
                    callback();
                }
            }
        }, time / steps);
        return interval;
    } else {
        if (dy > 0) {
            setIntoGrid(SQUARE_SIZE);
        }
        return undefined;
    }
}

function setIntoGrid(SQUARE_SIZE) {
    getPieceConfig(piece, rotation).forEach(s => {
        var [xoff, yoff] = get2Dcoords(s, 4);
        x = piecePos[0] + xoff;
        y = piecePos[1] + yoff;
        grid[get1Dindex(Math.round(x), Math.round(y), 10)] = piece;
    });
    //check for row clear
    clearLines();
    // and get the next piece
    increaseScore(1, SQUARE_SIZE);
    if (genNextPiece(SQUARE_SIZE)) {
        drawGrid(ctx, grid, SQUARE_SIZE);
        console.log(getPieceColour(piece));
    }
}

function clearLines(SQUARE_SIZE) {
    cleared = [];
    for (i = 19; i >= 0; i--) {
        foundEmpty = false;
        for (j = 0; j < 10; j++) {
            if (grid[get1Dindex(j, i, 10)] == 0) {
                //this line has an empty square so ignore it
                foundEmpty = true;
                break;
            }
        }
        if (!foundEmpty) {
            cleared = cleared.concat(i);
        }
    }
    for (i = 0; i < cleared.length; i++) {
        // adjust y index of line to clear according to how many lines have been cleared underneath it
        line = cleared[i] + i;
        // remove all from full line
        for (j = 0; j < 10; j++) {
            grid[get1Dindex(j, line)] = 0;
        }
        // shift all rows above it down

        for (j = line; j > 0; j--) {
            for (k = 0; k < 10; k++) {
                grid[get1Dindex(k, j, 10)] = grid[get1Dindex(k, j - 1, 10)];
            }
        }
        // and make top row blank
        for (k = 0; k < 10; k++) {
            grid[get1Dindex(k, 0)] = 0;
        }
        tmp = i;
        drawGrid(ctx, grid, SQUARE_SIZE);
        i = tmp;
    }
    increaseScore(cleared.length * 5, SQUARE_SIZE);
}

function drawBackground(context, SQUARE_SIZE) {
    // grid
    context.fillStyle = 'grey';
    context.fillRect(0, 0, 10 * SQUARE_SIZE, 20 * SQUARE_SIZE);

    drawNext(context, SQUARE_SIZE);

    // hold panel
    context.strokeRect(12 * SQUARE_SIZE, 16 * SQUARE_SIZE, 4 * SQUARE_SIZE, 4 * SQUARE_SIZE);
    drawScore(context, SQUARE_SIZE);
}
function drawGrid(context, grid, SQUARE_SIZE, gridWidth = 10) {
    // draw fixed pieces
    for (i = 0; i < grid.length; i++) {
        var [x, y] = get2Dcoords(i, gridWidth);
        context.fillStyle = getPieceColour(grid[i]); // change colour based on contents of square
        context.fillRect(x * SQUARE_SIZE, y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
    }
    // draw falling piece
    context.fillStyle = getPieceColour(piece); // change colour based on contents of square

    getPieceConfig(piece, rotation).forEach((elem) => {
        [xoff, yoff] = get2Dcoords(elem, 4);
        x = piecePos[0] + xoff;
        y = piecePos[1] + yoff;
        context.fillRect(x * SQUARE_SIZE, y * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
    });
}
function drawScore(context, SQUARE_SIZE) {
    text = `Score: ${score}`;
    h = context.measureText(text).actualBoundingBoxAscent;
    context.fillStyle = 'white';
    context.fillRect(12 * SQUARE_SIZE, 12 * SQUARE_SIZE, 4 * SQUARE_SIZE, h);
    context.fillStyle = 'black';
    context.fillText(text, 12 * SQUARE_SIZE, 12 * SQUARE_SIZE + h, 4 * SQUARE_SIZE);
}

function drawNext(context, SQUARE_SIZE) {
    context.fillStyle = 'grey';
    context.font = 'bold 18px monospace';
    yoff = context.measureText("Next").actualBoundingBoxAscent + 2;
    xoff = 13 * SQUARE_SIZE;
    context.fillText("Next", 13 * SQUARE_SIZE, yoff - 2);

    for (i = 0; i < 5; i++) {
        context.fillRect(13 * SQUARE_SIZE, yoff + i * 2 * SQUARE_SIZE, 2 * SQUARE_SIZE, 2 * SQUARE_SIZE);
        colour = getPieceColour(nextPieces[i]);
        config = getPieceConfig(nextPieces[i], 0);
        for (j = 0; j < 16; j++) {
            [x, y] = get2Dcoords(j, 4);
            context.fillStyle = config.includes(j) ? colour : 'white';
            context.fillRect(xoff + x * SQUARE_SIZE * 0.5, yoff + (i * 2 * SQUARE_SIZE) + (y * 0.5 * SQUARE_SIZE), 0.5 * SQUARE_SIZE, 0.5 * SQUARE_SIZE)
        }
    }
    // draw boxes around the next pieces
    for (i = 0; i < 5; i++) {
        context.strokeRect(xoff, yoff + i * 2 * SQUARE_SIZE, 2 * SQUARE_SIZE, 2 * SQUARE_SIZE);
    }
}

function bindFall(SQUARE_SIZE) {
    fallingInterval = stepPiece(0, 1, 2000 / fallSpeed, SQUARE_SIZE);
    interval = setInterval(() => {
        fallingInterval = stepPiece(0, 1, 2000 / fallSpeed, SQUARE_SIZE);
    }, 2000 / fallSpeed);
    return interval;
}
function unbindFall() {
    clearInterval(pieceFallInterval);
    clearInterval(fallingInterval);
}
function bindKeyDown(SQUARE_SIZE) {
    //check keydown is not already binded to not overwrite the prev_keydown
    if (typeof (prev_keydown) === 'undefined') {
        prev_keydown = window.onkeydown;
        window.onkeydown = (e) => { onKeyDown(e, SQUARE_SIZE); return false };
    } else {
        console.log("already bound");
    }
}
function unbindKeyDown() {
    window.onkeydown = prev_keydown;
    prev_keydown = undefined;
}

function onKeyDown(e, SQUARE_SIZE) {
    if (binding == '') {
        switch (e.code) {
            case controls["move left"]:
                if (typeof(leftSlide) =='undefined') {
                    leftSlide = stepPiece(-1, 0, 200, SQUARE_SIZE, ()=>leftSlide=undefined);
                }
                break;
            case controls["move right"]:
                if (typeof(rightSlide) =='undefined') {
                    rightSlide = stepPiece(1, 0, 200, SQUARE_SIZE, ()=>rightSlide=undefined);
                }
                break;
            case controls["soft down"]:
                if (typeof(downSlide) =='undefined') {
                    downSlide = stepPiece(0, 1, 200, SQUARE_SIZE, ()=>downSlide=undefined);
                }
                break;
            case controls["hard down"]:
                do {
                    res = movePiece(0, 1, SQUARE_SIZE);
                }
                while (res != false);
                break;
            case controls["rotate left"]:
                rotation += 1;
                rotation %= 4;
                drawGrid(ctx, grid, SQUARE_SIZE);
                break;
            case controls["rotate right"]:
                rotation -= 1;
                rotation = (rotation + 4) % 4;
                drawGrid(ctx, grid, SQUARE_SIZE);
                break;
            case controls["hold"]:
                if (heldPiece == 0) {
                    heldPiece = piece;
                    genNextPiece(SQUARE_SIZE);
                    swappedHeld = true;
                } else if (swappedHeld == false) {
                    tmp = piece;
                    piece = heldPiece;
                    heldPiece = tmp;
                    piecePos = [3, 0];
                    rotation = 0;
                }
                break;
            case controls["pause"]:
                document.dispatchEvent(new Event("pause"));
                break;
            default:
                console.log(e);
                break;
        }
    } else {
        console.log("binding", e.code)
        controls[binding] = e.code;
        for (i = 0; i < bindMenu.childElementCount; i++) {
            if (bindMenu.children[i].className == "key-bind") {

                if (bindMenu.children[i].children[0].innerText == binding) {
                    bindMenu.children[i].children[1].innerText = e.code; //display the new bind
                } else if (bindMenu.children[i].children[1].innerText == e.code) {
                    //unbind other controls with this key
                    controls[bindMenu.children[i].children[0].innerText] = '';
                    bindMenu.children[i].children[1].innerText = '';
                }
            }
        }
    }
}
function startGame(SQUARE_SIZE) {
    pauseMenu.className = "display-none";
    grid = new Int8Array(200) // 10x20 grid
    nextPieces = Array.from({ length: 5 }, () => randint(1, 7));
    piece = 0;
    heldPiece = 0;
    fallSpeed = 1;
    score = 0;
    genNextPiece(SQUARE_SIZE);
    drawBackground(ctx, SQUARE_SIZE);
    drawGrid(ctx, grid, SQUARE_SIZE);

    bindKeyDown(SQUARE_SIZE);
    pieceFallInterval = bindFall(SQUARE_SIZE);

    document.addEventListener('Game Over', () => {
        drawGrid(ctx, grid, SQUARE_SIZE);
        unbindFall();
        unbindKeyDown();
        gameOver.className = "";
        gameOver.innerHTML = `<h3>Game Over</h3><h5>Score: ${score}</h5>`;
        gameOver.appendChild(btnReplay);
        btnReplay.className = "btn-submit";
    });
    document.addEventListener('speedUp', () => {
        fallSpeed++;
        unbindFall();
        pieceFallInterval = bindFall(SQUARE_SIZE);
    });
    document.addEventListener('pause', () => {
        unbindFall();
        unbindKeyDown();
        pauseMenu.className = "";// not display-none
        btnPlay.className = "display-none";
        btnReplay.className = "btn-submit";
        btnContinue.className = "btn-submit";
    });
    document.addEventListener('unPause', () => {
        pieceFallInterval = bindFall(SQUARE_SIZE);
        bindKeyDown(SQUARE_SIZE);
        btnPlay.parentElement.className = "display-none";
    });
}

window.addEventListener('DOMContentLoaded', (event) => {
    const SQUARE_SIZE = 20;
    canvas = document.getElementById("game-canvas");
    canvas.height = SQUARE_SIZE * 20;
    canvas.width = SQUARE_SIZE * 16;
    ctx = canvas.getContext("2d");
    binding = '';

    // create html for pause menu and game over menu
    pauseMenu = document.createElement("div");
    pauseMenu.id = 'menu';
    pauseMenu.style.height = `${15 * SQUARE_SIZE}px`;
    pauseMenu.style.width = `${12 * SQUARE_SIZE}px`;
    bindMenu = document.createElement("div");
    bindMenu.id = 'bind-menu';
    bindMenu.className = "display-none";
    bindMenu.style.minHeight = `${15 * SQUARE_SIZE}px`;
    bindMenu.style.minWidth = `${12 * SQUARE_SIZE}px`;
    gameOver = document.createElement("div");
    gameOver.id = "game-over";
    gameOver.className = "display-none";
    gameOver.style.height = `${15 * SQUARE_SIZE}px`;
    gameOver.style.width = `${12 * SQUARE_SIZE}px`;
    btnPlay = document.createElement("button");
    btnPlay.innerText = "Start Game";
    btnPlay.className = "btn-submit";
    btnPlay.onclick = () => {
        startGame(SQUARE_SIZE);
    }
    btnReplay = document.createElement("button");
    btnReplay.innerText = "Restart";
    btnReplay.className = "display-none";
    btnReplay.onclick = () => {
        if (btnReplay.parentElement.id == "game-over") {
            gameOver.className = "display-none";
            pauseMenu.appendChild(btnReplay);
        } else {
            pauseMenu.className = "display-none";
        }
        startGame(SQUARE_SIZE);
    };
    btnContinue = document.createElement("button");
    btnContinue.innerText = "Continue";
    btnContinue.className = "display-none";
    btnContinue.onclick = () => {
        document.dispatchEvent(new Event('unPause'));
    };
    controls = {
        "move left": "KeyA",
        "move right": "KeyD",
        "soft down": "KeyS",
        "hard down": "Space",
        "rotate left": "KeyQ",
        "rotate right": "KeyE",
        "hold": "KeyR",
        "pause": "Escape"
    };
    btnBind = document.createElement("button");
    btnBind.innerText = "Controls";
    btnBind.className = "btn-submit";
    btnBind.onclick = () => {
        document.dispatchEvent(new Event('bind'));
    };
    bindKeyDown(SQUARE_SIZE);
    for (var key in controls) {
        div = document.createElement("div");
        keySpan = document.createElement("span");
        valSpan = document.createElement("span");
        div.className = "key-bind";
        valSpan.className = "bind-btn";
        keySpan.innerText = key;
        valSpan.innerText = controls[key];

        valSpan.onclick = (e) => {
            // can't just set binding=key; because key will be the last value
            binding = e.target.parentElement.children[0].innerText;
            //highlight this one and unhighlight others
            for (i = 0; i < bindMenu.childElementCount; i++) {
                if (bindMenu.children[i].className == "key-bind") {
                    bindMenu.children[i].children[1].className = "bind-btn";
                }
            }
            e.target.className = "bind-btn binding";
        }
        div.appendChild(keySpan);
        div.appendChild(valSpan);
        bindMenu.appendChild(div);
    }
    bckBtn = document.createElement("button");
    bckBtn.innerText = "Back";
    bckBtn.className = "btn-submit";
    bckBtn.onclick = () => {
        bindMenu.className = "display-none";
        pauseMenu.className = "";
        binding = '';
    };
    bindMenu.appendChild(bckBtn);
    document.addEventListener('bind', () => {
        binding = '';
        pauseMenu.className = "display-none";
        bindMenu.className = "";
        for (i = 0; i < bindMenu.childElementCount; i++) {
            if (bindMenu.children[i].className == "key-bind") {
                bindMenu.children[i].children[1].className = "bind-btn";
            }
        }

    });
    pauseMenu.appendChild(btnPlay);
    pauseMenu.appendChild(btnContinue);
    pauseMenu.appendChild(btnBind);
    pauseMenu.appendChild(btnReplay);

    canvas.parentElement.appendChild(pauseMenu);
    canvas.parentElement.appendChild(bindMenu);
    canvas.parentElement.appendChild(gameOver);
});
