function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function get1Dindex(x, y, width) {
    return x + y * width;
}
function get2Dcoords(idx, width) {
    x = idx % width;
    y = Math.floor(idx / width);
    return [x, y]
}

function increaseScore(dScore, SQUARE_SIZE) {
    prev=score
    score += dScore
    if (Math.floor(score/150)>Math.floor(prev/150)){
        document.dispatchEvent(new Event('speedUp'))
    }
    drawScore(ctx, SQUARE_SIZE)
}

function getPieceColour(pieceNum) {
    colours = ['white', 'skyblue', 'red', 'green', 'purple', 'blue', 'orange', 'yellow']
    return colours[pieceNum];
}
function getPieceConfig(pieceNum, orientation) {
    if (pieceNum == 0) {
        alert("getting config when the current piece is 0")
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
    ]
    configs = arrangements[idx]
    return configs[orientation % configs.length]
}

function genNextPiece(SQUARE_SIZE) {
    swappedHeld = false;
    piece = nextPieces.shift();
    piecePos = [3, 0]
    nextPieces = nextPieces.concat(randint(1, 7));

    drawNext(ctx, SQUARE_SIZE)
    // ensure that spawned piece doesn't overlap with others already in the grid
    for (rotation=0; rotation<4; rotation++){
        if(canPieceMove(0,0)){return true}
    }
    document.dispatchEvent(new Event("Game Over"));
    return false;
}

function canPieceMove(dx = 0, dy = 0) {
    // check that moving the current piece can fall
    occupied = getPieceConfig(piece, rotation)
    for (i = 0; i < occupied.length; i++) {
        var [xoff, yoff] = get2Dcoords(occupied[i], 4);
        x = piecePos[0] + xoff + dx;
        y = piecePos[1] + yoff + dy;
        // check x and y are not out of bounds
        if (x < 0 || x >= 10 || y >= 20) { return false; }
        // check square is not already filled
        if (grid[get1Dindex(x, y, 10)] != 0) { return false; }

    }
    // if none of the sqaure collide with an existing sqaure then let it fall
    return true;
}

function movePiece(dx, dy, SQUARE_SIZE) {
    if (canPieceMove(dx, dy)) {
        piecePos = [piecePos[0] + dx, piecePos[1] + dy]
        drawGrid(ctx, grid, SQUARE_SIZE);
    } else {
        // if movement is downwards then set piece into the grid
        if (dy > 0) {
            getPieceConfig(piece, rotation).forEach(s => {
                var [xoff, yoff] = get2Dcoords(s, 4);
                x = piecePos[0] + xoff;
                y = piecePos[1] + yoff;
                grid[get1Dindex(x, y, 10)] = piece;
            });
            // and get the next piece
            increaseScore(5, SQUARE_SIZE)
            if (genNextPiece(SQUARE_SIZE)) {
                drawGrid(ctx, grid, SQUARE_SIZE);
            };
        }
        return false;
    }
}


function drawBackground(context, SQUARE_SIZE) {
    // grid
    context.fillStyle = 'grey';
    context.fillRect(0, 0, 10 * SQUARE_SIZE, 20 * SQUARE_SIZE);

    drawNext(context, SQUARE_SIZE)

    // hold panel
    context.strokeRect(12 * SQUARE_SIZE, 16 * SQUARE_SIZE, 4 * SQUARE_SIZE, 4 * SQUARE_SIZE);
    drawScore(context, SQUARE_SIZE)
}
function drawGrid(context, grid, SQUARE_SIZE, gridWidth = 10) {
    // create copy of grid with the moving piece inside it
    newGrid = grid.filter(() => true); // this is a really stupid way to copy an array
    getPieceConfig(piece, rotation).forEach((elem) => {
        [xoff, yoff] = get2Dcoords(elem, 4);
        idx = get1Dindex(piecePos[0] + xoff, piecePos[1] + yoff, 10);
        newGrid[idx] = piece;
    });
    for (i = 0; i < newGrid.length; i++) {
        var [x, y] = get2Dcoords(i, gridWidth);
        context.fillStyle = getPieceColour(newGrid[i]); // change colour based on contents of square
        context.fillRect(x * SQUARE_SIZE + 1, y * SQUARE_SIZE + 1, SQUARE_SIZE - 2, SQUARE_SIZE - 2)
    }
}
function drawScore(context, SQUARE_SIZE) {
    text = `Score: ${score}`
    h = context.measureText(text).actualBoundingBoxAscent
    context.fillStyle = 'white';
    context.fillRect(12 * SQUARE_SIZE, 12 * SQUARE_SIZE, 4 * SQUARE_SIZE, h)
    context.fillStyle = 'black'
    context.fillText(text, 12 * SQUARE_SIZE, 12 * SQUARE_SIZE + h, 4 * SQUARE_SIZE)
}

function drawNext(context, SQUARE_SIZE){ 
    context.fillStyle='grey'
    context.font = 'bold 18px monospace';
    yoff = context.measureText("Next").actualBoundingBoxAscent + 2;
    xoff=13 * SQUARE_SIZE;
    context.fillText("Next", 13 * SQUARE_SIZE, yoff - 2)

    for (i = 0; i < 5; i++) {
        context.fillRect(13 * SQUARE_SIZE, yoff + i * 2 * SQUARE_SIZE, 2 * SQUARE_SIZE, 2 * SQUARE_SIZE);
        colour = getPieceColour(nextPieces[i])
        config = getPieceConfig(nextPieces[i], 0)
        console.log(config)
        for(j=0; j<16; j++){
            [x,y] = get2Dcoords(j, 4)
            context.fillStyle = config.includes(j)? colour: 'white';
            console.log([j, y, (i*2*SQUARE_SIZE) + (y*0.5*SQUARE_SIZE), context.fillStyle])
            context.fillRect(xoff + x*SQUARE_SIZE*0.5, yoff + (i*2*SQUARE_SIZE) + (y*0.5*SQUARE_SIZE), 0.5*SQUARE_SIZE, 0.5*SQUARE_SIZE)
        }
    }
    // draw boxes around the next pieces
    for (i = 0; i < 5; i++) {
        context.strokeRect(xoff, yoff + i * 2 * SQUARE_SIZE, 2 * SQUARE_SIZE, 2 * SQUARE_SIZE);
    }
}

function onKeyDown(e, SQUARE_SIZE) {
    switch (e.code) {
        case controls["moveLeft"]:
            movePiece(-1, 0, SQUARE_SIZE);
            break;
        case controls["moveRight"]:
            movePiece(1, 0, SQUARE_SIZE);
            break;
        case controls["softDown"]:
            movePiece(0, 1, SQUARE_SIZE);
            document.dispatchEvent(new Event('resetFallInterval'))
            break;
        case controls["hardDown"]:
            do {
                res = movePiece(0, 1, SQUARE_SIZE)
            }
            while (res != false)
            break;
        case controls["rotLeft"]:
            rotation += 1
            rotation %= 4
            drawGrid(ctx, grid, SQUARE_SIZE)
            break;
        case controls["rotRight"]:
            rotation -= 1
            rotation = (rotation + 4) % 4
            drawGrid(ctx, grid, SQUARE_SIZE)
            break;
        case controls["hold"]:
            if (heldPiece == 0) {
                heldPiece = piece;
                genNextPiece(SQUARE_SIZE)
                swappedHeld = true;
            } else if (swappedHeld == false) {
                tmp = piece;
                piece = heldPiece;
                heldPiece = tmp
                piecePos = [3, 0];
                rotation = 0;
            }
            break;
        case "Escape":
            document.dispatchEvent(new Event("pause"));
            break;
        default:
            console.log(e)
            break;
    }
}
function startGame(SQUARE_SIZE) {
    pauseMenu.className="display-none"
    grid = new Int8Array(200) // 10x20 grid
    nextPieces = Array.from({ length: 5 }, () => randint(1, 7));
    piece = 0;
    heldPiece = 0;
    fallSpeed = 1;
    score = 0
    genNextPiece(SQUARE_SIZE);
    controls = {
        "moveLeft": "KeyA",
        "moveRight": "KeyD",
        "softDown": "KeyS",
        "hardDown": "Space",
        "rotLeft": "KeyQ",
        "rotRight": "KeyE",
        "hold": "KeyR"
    }

    drawBackground(ctx, SQUARE_SIZE)
    drawGrid(ctx, grid, SQUARE_SIZE)
    drawScore(ctx, SQUARE_SIZE)

    prev_keydown = window.onkeydown;
    window.onkeydown = (e) => { onKeyDown(e, SQUARE_SIZE); return false }
    document.addEventListener('Game Over', () => {
        drawGrid(ctx, grid, SQUARE_SIZE)
        clearInterval(pieceFallInterval);
        window.onkeydown = prev_keydown;

        div = document.createElement("div");
        div.innerHTML = `<h3>Game Over</h3><h5>Score: ${score}</h5>`;
        div.id = "game-over";
        div.style.height = `${15 * SQUARE_SIZE}px`
        div.style.width = `${12 * SQUARE_SIZE}px`
        div.appendChild(btnReplay)
        canvas.parentElement.appendChild(div);
    });
    document.addEventListener('resetFallInterval', () => {
        clearInterval(pieceFallInterval)
        pieceFallInterval = setInterval(() => {
            movePiece(0, 1, SQUARE_SIZE)
        }, 2000 / fallSpeed);
    })
    document.addEventListener('speedUp', () => {
        fallSpeed++;
        document.dispatchEvent(new Event('resetFallInterval'))
    });
    document.addEventListener('pause', () => {
        clearInterval(pieceFallInterval)
        pauseMenu.className="";// not display-none
        btnPlay.className="display-none";
        btnReplay.className="btn-submit";
        btnContinue.className="btn-submit"
    });
    document.addEventListener('unPause', () => {
        btnPlay.parentElement.className = "display-none";
        pieceFallInterval = setInterval(() => {
            movePiece(0, 1, SQUARE_SIZE)
        }, 2000 / fallSpeed);
    });

    pieceFallInterval = setInterval(() => {
        movePiece(0, 1, SQUARE_SIZE)
        drawGrid(ctx, grid, SQUARE_SIZE);
    }, 2000 / fallSpeed);
}

window.addEventListener('DOMContentLoaded', (event) => {
    const SQUARE_SIZE = 20;
    canvas = document.getElementById("game-canvas");
    canvas.height = SQUARE_SIZE * 20;
    canvas.width = SQUARE_SIZE * 16;
    ctx = canvas.getContext("2d");
    
    // create pause menu buttons
    pauseMenu = document.createElement("div");
    pauseMenu.id='menu';
    pauseMenu.style.height = `${15 * SQUARE_SIZE}px`
    pauseMenu.style.width = `${12 * SQUARE_SIZE}px`
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
        startGame(SQUARE_SIZE);
    }
    btnContinue = document.createElement("button");
    btnContinue.innerText = "Continue";
    btnContinue.className = "display-none";
    btnContinue.onclick = () => {
        document.dispatchEvent(new Event('unPause'));
    }
    pauseMenu.appendChild(btnPlay);
    pauseMenu.appendChild(btnReplay);
    pauseMenu.appendChild(btnContinue);
    canvas.parentElement.appendChild(pauseMenu);
});
