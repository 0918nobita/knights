import './scss/editor.scss';

import Fleur from '@fleur/fleur';
import { FleurContext } from '@fleur/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { Subject } from 'rxjs';

// import { AppRoot } from './components/AppRoot';
import { store } from './domains/counter/store';

const app = new Fleur({
    stores: [store],
});

const context = app.createContext();

ReactDOM.render(
    <FleurContext value={context}>{/*<AppRoot />*/}</FleurContext>,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.getElementById('app')!
);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const gl = (document.getElementById('webgl') as HTMLCanvasElement).getContext('webgl')!;

const createShader = (type: number, source: string): WebGLShader => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        console.info(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        throw new Error('シェーダのコンパイルに失敗しました');
    }

    return shader;
};

const vertexShaderSource = (document.getElementById('vertex-shader') as HTMLScriptElement).text;
const fragmentShaderSource = (document.getElementById('fragment-shader') as HTMLScriptElement).text;

const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const program = gl.createProgram()!;
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

const success = gl.getProgramParameter(program, gl.LINK_STATUS);
if (!success) {
    console.info(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw new Error('プログラムのリンクに失敗しました');
}

const positionAttrLoc = gl.getAttribLocation(program, 'a_position');

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const positions = [
    // (1)
    100,
    100,
    // (2)
    500,
    100,
    // (3)
    100,
    500,
    // (4)
    500,
    100,
    // (5)
    500,
    500,
    // (6)
    100,
    500,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.useProgram(program);

// どうやってバッファから属性に読み込むかを教える
// 属性をオンにする
gl.enableVertexAttribArray(positionAttrLoc);
// データの取り出し方を設定する
gl.vertexAttribPointer(
    positionAttrLoc,
    2, // size: 2 つずつ取り出す
    gl.FLOAT, // type: 32 bit 浮動小数点数
    false, // normalize しない
    0, // 毎回のシェーダの呼び出しでズレる距離 (ズラさない)
    0 // バッファの頭から取り出し始める
);

const resolutionUniformLoc = gl.getUniformLocation(program, 'u_resolution');

gl.uniform2f(resolutionUniformLoc, gl.canvas.width, gl.canvas.height);

const timeUniformLoc = gl.getUniformLocation(program, 'u_time');

function render(timeStamp: number): void {
    gl.uniform1f(timeUniformLoc, timeStamp / 1000.0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    window.requestAnimationFrame(render);
}

window.requestAnimationFrame(render);

const subject = new Subject<number>();

subject.subscribe({
    next(value: number) {
        console.log(`Received: ${value}`);
    },
});

import('../interp-wasm').then(module => {
    // module.greet('Rust');
    module.apply((n: number) => subject.next(n));
});
