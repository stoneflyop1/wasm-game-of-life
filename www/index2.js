import {App} from 'wasm-game-of-life';

import fps from './fps';

let animationId = null;

const app = App.new(64,64);

const renderLoop = () => {

    fps.render();

    app.start();

    app.tick();

    animationId = requestAnimationFrame(renderLoop);
}

const isPaused = () => {
    return animationId == null;
}

const playPauseButton = document.getElementById('play-pause');

const play = () => {
    playPauseButton.textContent = "⏸";
    animationId = requestAnimationFrame(renderLoop);
    //renderLoop();
};

const pause = () => {
    playPauseButton.textContent = "▶";
    cancelAnimationFrame(animationId);
    animationId = null;
};

playPauseButton.addEventListener('click', event => {
    if (isPaused()) play();
    else pause();
});

const resetBtn = document.getElementById('reset-btn');
resetBtn.addEventListener('click', function() {
    app.reset();
});


play();