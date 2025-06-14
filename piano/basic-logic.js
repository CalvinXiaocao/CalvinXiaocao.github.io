// Basic-logic.js

document.addEventListener('DOMContentLoaded', () => {
    const pianoContainer = document.getElementById('piano-container');
    const volumeSlider = document.getElementById('volume-slider');
    // const playSongBtn = document.getElementById('play-song-btn');
    // const loadMidiInput = document.getElementById('load-midi-input');
    const recordBtn = document.getElementById('record-btn');
    const stopRecordBtn = document.getElementById('stop-record-btn');
    const saveSongBtn = document.getElementById('save-song-btn');
    const metronomeBtn = document.getElementById('metronome-btn');
    const tempoSlider = document.getElementById('tempo-slider');
    const messageArea = document.getElementById('message-area');

    const octaveDownBtn = document.getElementById('octave-down-btn');
    const octaveUpBtn = document.getElementById('octave-up-btn');
    const currentOctaveLabel = document.getElementById('current-octave-label');

    let pianoSynth; // Tone.js 合成器实例
    let isRecording = false; // 录制状态
    let metronomeInterval; // 节拍器定时器
    let pianoSampler = null; // 保持 Sampler 实例，避免重复加载

    // 定义初始音域
    let currentOctave = 3; // 基础八度
    let octaveSpan = 2; // 音域跨度（2个八度）
    let minOctave = 1; // 最小八度限制
    let maxOctave = 7; // 最大八度限制

    // --- 动态生成钢琴键 ---
    // 定义需要生成的音符范围，例如从 C3 到 C5 (两个八度)
    const notes = [
        'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
        'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
        'C5' // 结束C5，构成两个八度加一个C
    ];

    function getCurrentNotes(octave) {
        let currentNotes = [];
        for (let m of [octave.toString(), (octave + 1).toString()]) {
            for (let n of ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']) {
                currentNotes.push(n + m);
            }
        }
        currentNotes.push('C' + (octave + 2).toString()); // 添加下一个八度的C
        return currentNotes;
    }

    const whiteKeyNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackKeyOffset = {
        'C#': 38, // 偏移量，调整黑键的水平位置
        'D#': 76,
        'F#': 188,
        'G#': 226,
        'A#': 264
    };
    let whiteKeyCount = 0; // 用于计算白键数量以定位黑键

    function initializeInstrument() {
        console.log("calling initialize instrument");
        messageArea.textContent = '正在加载钢琴音色...请稍候。';
        if (!pianoSampler) { // 避免重复加载
            const samplerUrls = {};
            const rootNotes = ['C4', 'D#4', 'F#4', 'A4']; // 你的根音
            console.log(rootNotes);
            const velocityLevels = 16; // 你有的音量等级数

            rootNotes.forEach(rootNote => {
            // 规范化音高名称，例如 D#4 -> Ds4
                const normalizedRootNote = rootNote.replace('#', 's');
                for (let i = 1; i <= velocityLevels; i++) {
                    // 假设文件名为 C4_vel_00.mp3, C4_vel_01.mp3...
                    // 或者 C4/C4_vel_00.mp3
                    // 我们使用 Tone.Sampler 的多维 urls 格式来指定速度
                    // { "C4": { 0.1: "C4_vel_00.mp3", 0.2: "C4_vel_01.mp3", ... } }
                    // Tone.Sampler 会根据你提供的力度范围自动选择最接近的样本

                    // 将 0-15 的索引映射到 0.0 到 1.0 的力度值
                    // 每个区间 1/16 = 0.0625
                    const velocity = (i - 0.5) / velocityLevels; // 使用中心点以便更好地匹配

                    if (!samplerUrls[rootNote]) {
                        samplerUrls[rootNote] = {};
                    }
                    // 假设你的文件结构是 baseUrl/NOTE_vel_INDEX.mp3
                    samplerUrls[rootNote][velocity.toFixed(3)] =
                        `${normalizedRootNote}v${String(i)}.ogg`;
                }
            });
            console.log(samplerUrls);

            pianoSampler = new Tone.Sampler({
                urls: {
                    "C1": "C1.mp3",
                    "D#1": "Ds1.mp3",
                    "F#1": "Fs1.mp3",
                    "A1": "A1.mp3",
                    "C2": "C2.mp3",
                    "D#2": "Ds2.mp3",
                    "F#2": "Fs2.mp3",
                    "A2": "A2.mp3",
                    "C3": "C3.mp3",
                    "D#3": "Ds3.mp3",
                    "F#3": "Fs3.mp3",
                    "A3": "A3.mp3",
                    "C4": "C4.mp3",
                    "D#4": "Ds4.mp3",
                    "F#4": "Fs4.mp3",
                    "A4": "A4.mp3",
                    "C5": "C5.mp3",
                    "D#5": "Ds5.mp3",
                    "F#5": "Fs5.mp3",
                    "A5": "A5.mp3",
                    "C6": "C6.mp3",
                    "D#6": "Ds6.mp3",
                    "F#6": "Fs6.mp3",
                    "A6": "A6.mp3",
                },
                release: 1,
                baseUrl: "https://tonejs.github.io/audio/salamander/",
            }).toDestination();
 
            Tone.loaded().then(() => {
                pianoSynth = pianoSampler;
                // pianoSampler.triggerAttackRelease(["Eb4", "G4", "Bb4"], 4);  // 这里的4是延长的时间
                messageArea.textContent = '钢琴音色加载完成！';
            })

        } else {
            pianoSynth = pianoSampler; // 如果已加载，直接使用
            messageArea.textContent = '钢琴音色已就绪。';
        }
    }
    
    notes.forEach(note => {
        const isBlackKey = note.includes('#');
        const keyElement = document.createElement('div');
        keyElement.classList.add('key');
        keyElement.dataset.note = note;

        const noteLabel = document.createElement('span');
        noteLabel.textContent = note;
        keyElement.appendChild(noteLabel);

        if (isBlackKey) {
            keyElement.classList.add('black-key');
            // 根据前一个白键的数量来计算黑键的left位置
            // 每个白键宽度60px + 2px margin-right
            const prevWhiteKeysOffset = whiteKeyCount * (60 + 2);
            // 调整黑键的相对位置，使其位于白键之间
            keyElement.style.left = `${prevWhiteKeysOffset}px`; // 调整 -25 使黑键居中
        } else {
            keyElement.classList.add('white-key');
            whiteKeyCount++; // 只有白键才增加计数
        }
        pianoContainer.appendChild(keyElement);
    });

    // Initialize the instrument if it hasn't been initialized yet
    if (!pianoSynth) {
        initializeInstrument()
    }

    const metronomeSynth = new Tone.MembraneSynth().toDestination();          

    // --- Tone.js 初始化和音频上下文启动 ---
    // 首次用户交互时启动 Tone.js 音频上下文
    document.body.addEventListener('click', async () => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
            console.log('音频上下文已启动');
            messageArea.textContent = '音频已就绪。';
        }
        // 确保合成器只初始化一次
        if (!pianoSynth) {
            initializeInstrument()
        }
    }, { once: true }); // 只执行一次，避免重复监听

    // --- 八度调整功能 ---
    octaveDownBtn.addEventListener('click', () => {
        if (currentOctave > minOctave) {
            currentOctave--;
            let currentNotes = getCurrentNotes(currentOctave);
            for (let i = 0; i < 25; ++i) {
                const currentNoteName = currentNotes[i];
                const keyElement = pianoContainer.children[i];
                keyElement.dataset.note = currentNoteName; // 更新琴键的音符名称
                const noteLabel = keyElement.querySelector('span');
                if (noteLabel) {
                    noteLabel.textContent = currentNoteName; // 更新琴键上的标签
                }
            }
            // renderPianoKeys();
            currentOctaveLabel.textContent = `当前音域: C${currentOctave}-C${currentOctave + octaveSpan}`;
            messageArea.textContent = `音域降低到 C${currentOctave}-C${currentOctave + octaveSpan}`;
        } else {
            messageArea.textContent = '已达到最低音域限制';
        }
    });

    octaveUpBtn.addEventListener('click', () => {
        if (currentOctave + octaveSpan < maxOctave) {
            currentOctave++;
            let currentNotes = getCurrentNotes(currentOctave);
            for (let i = 0; i < 25; ++i) {
                const currentNoteName = currentNotes[i];
                const keyElement = pianoContainer.children[i];
                keyElement.dataset.note = currentNoteName; // 更新琴键的音符名称
                const noteLabel = keyElement.querySelector('span');
                if (noteLabel) {
                    noteLabel.textContent = currentNoteName; // 更新琴键上的标签
                }
            }
            // renderPianoKeys();
            currentOctaveLabel.textContent = `当前音域: C${currentOctave}-C${currentOctave + octaveSpan}`;
            messageArea.textContent = `音域升高到 C${currentOctave}-C${currentOctave + octaveSpan}`;
        } else {
            messageArea.textContent = '已达到最高音域限制';
        }
    });



    // --- 钢琴键事件处理 ---
    pianoContainer.addEventListener('mousedown', (event) => {
        const clickedKey = event.target.closest('.key');
        if (clickedKey && pianoSynth && Tone.context.state === 'running') {
            const note = clickedKey.dataset.note;
            // 对于模拟点击，我们可以使用一个固定的或随机的力度
            // 假设一个中等力度，或者你可以通过UI添加力度控制
            let velocity = 0.7; // 默认中等力度

            // 如果你想根据用户点击的Y轴位置模拟力度
            const keyRect = clickedKey.getBoundingClientRect();
            const clickY = event.clientY - keyRect.top; // 点击位置相对于琴键顶部
            velocity = (clickY / keyRect.height); // 越往下点击力度越大，反之越小
            velocity = Math.max(0.1, Math.min(1.0, velocity)); // 限制在 0.1 到 1.0 之间

            pianoSynth.triggerAttack(note, Tone.now(), velocity); // 传入力度参数
            clickedKey.classList.add('active');
            console.log(`按下琴键: ${note}, 力度: ${velocity.toFixed(2)}`);

            // TODO: 上面的都有用吗？？？
        }
    });

    pianoContainer.addEventListener('mouseup', (event) => {
        const clickedKey = event.target.closest('.key');
        if (clickedKey && pianoSynth) {
            const note = clickedKey.dataset.note;
            console.log(`松开琴键: ${note}`);
            pianoSynth.triggerRelease(note); // 停止音符
            clickedKey.classList.remove('active'); // 移除按下时的视觉效果
        }
    });

    // 如果鼠标从琴键上滑开，也停止声音
    pianoContainer.addEventListener('mouseleave', (event) => {
        const activeKeys = pianoContainer.querySelectorAll('.key.active');
        activeKeys.forEach(key => {
            if (pianoSynth) {
                pianoSynth.triggerRelease(key.dataset.note);
            }
            key.classList.remove('active');
        });
    });


    // --- 音量控制 ---
    volumeSlider.addEventListener('input', (event) => {
        const volume = parseFloat(event.target.value); // 获取浮点数值
        if (Tone.Destination) {
            // 将 0-1 的音量映射到 Tone.js 的分贝值（例如 -40dB 到 0dB）
            // Tone.gainToDb 将 0-1 的线性增益转换为分贝
            Tone.Destination.volume.value = Tone.gainToDb(volume);
        }
        messageArea.textContent = `音量: ${Math.round(volume * 100)}%`;
    });

    // TODO: 下面的部分待完成

    // // --- 乐曲播放功能 ---
    // playSongBtn.addEventListener('click', () => {
    //     console.log('点击了播放乐曲');
    //     messageArea.textContent = '正在播放乐曲...';
    //     // TODO: 在这里实现乐曲播放逻辑，例如加载预设乐谱或用户上传的乐曲
    //     // 你可以使用 Tone.js 的 Tone.Part 或 Tone.Sequence 来安排音符播放
    // });

    // loadMidiInput.addEventListener('change', (event) => {
    //     const file = event.target.files[0];
    //     if (file) {
    //         console.log(`选择了文件: ${file.name}`);
    //         messageArea.textContent = `加载文件: ${file.name}...`;
    //         // TODO: 在这里处理 MIDI 文件的加载和解析
    //         // 你可以使用 @tonejs/midi 库来解析 MIDI 文件
    //         // 例如: Midi.fromUrl(URL.createObjectURL(file)).then(midi => { ... });
    //     }
    // });

    // --- 创作/录制功能 ---
    recordBtn.addEventListener('click', () => {
        if (!isRecording) {
            isRecording = true;
            recordBtn.disabled = true;
            stopRecordBtn.disabled = false;
            saveSongBtn.disabled = true;
            messageArea.textContent = '正在录制...';
            console.log('开始录制');
            // TODO: 在这里开始 Tone.js 的录制逻辑
            // 比如记录每次琴键按下和松开的事件和时间戳
        }
    });

    stopRecordBtn.addEventListener('click', () => {
        if (isRecording) {
            isRecording = false;
            recordBtn.disabled = false;
            stopRecordBtn.disabled = true;
            saveSongBtn.disabled = false;
            messageArea.textContent = '录制已停止。';
            console.log('停止录制');
            // TODO: 在这里停止 Tone.js 的录制逻辑
            // 收集录制的数据
        }
    });

    saveSongBtn.addEventListener('click', () => {
        console.log('点击了保存创作');
        messageArea.textContent = '正在保存乐曲...';
        // TODO: 在这里实现保存创作的逻辑，例如将录制的 MIDI 数据导出为文件
    });

    // --- 节拍器功能 ---
    let isMetronomeOn = false;
    let metronomeBeat = 0; // 当前节拍数

    metronomeBtn.addEventListener('click', () => {
        isMetronomeOn = !isMetronomeOn;
        if (isMetronomeOn) {
            metronomeBtn.textContent = '停止节拍器';
            messageArea.textContent = '节拍器已开启。';
            console.log('节拍器开启');

            // 启动 Tone.js 的 Transport (时间线)
            Tone.Transport.start();

            // 创建一个 Loop 来模拟节拍器
            metronomeInterval = new Tone.Loop(time => {
                // 在每个节拍点播放一个简单的声音
                metronomeSynth.triggerAttackRelease("C2", "8n", time);
                // metronomeSynth.dispose(); // 播放后释放资源

                metronomeBeat++;
                if (metronomeBeat > 4) metronomeBeat = 1; // 简单模拟四拍子
                console.log(`节拍: ${metronomeBeat}`);
                messageArea.textContent = `节拍器: 第 ${metronomeBeat} 拍`;

            }, "4n").start(0); // 每四分音符（1/4拍）触发一次

            Tone.Transport.bpm.value = tempoSlider.value; // 设置初始速度
        } else {
            metronomeBtn.textContent = '节拍器';
            messageArea.textContent = '节拍器已关闭。';
            console.log('节拍器关闭');
            if (metronomeInterval) {
                metronomeInterval.stop(); // 停止 Loop
                metronomeInterval.dispose(); // 释放资源
            }
            Tone.Transport.stop(); // 停止 Tone.Transport
            metronomeBeat = 0;
        }
    });

    tempoSlider.addEventListener('input', (event) => {
        const tempo = parseInt(event.target.value);
        if (Tone.Transport) {
            Tone.Transport.bpm.value = tempo; // 设置 Tone.js 的 Transport 速度
        }
        messageArea.textContent = `速度: ${tempo} BPM`;
    });

    // 初始时禁用停止录制和保存按钮
    stopRecordBtn.disabled = true;
    saveSongBtn.disabled = true;
});
