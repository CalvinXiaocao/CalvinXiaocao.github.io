// Basic-logic.js

document.addEventListener('DOMContentLoaded', async () => {
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

    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const loopBtn = document.getElementById('loop-btn');
    const progressBar = document.getElementById('progress-bar');
    const timeDisplay = document.getElementById('time-display');
    const nowPlaying = document.getElementById('now-playing');
    const nowLyric = document.getElementById('now-lyric');

    // 后续将在这里绑定 MusicPlayer 的实例
    let activePlayer = null; 

    let pianoSynth; // Tone.js 合成器实例
    let isRecording = false; // 录制状态
    let metronomeInterval; // 节拍器定时器
    let pianoSampler = null; // 保持 Sampler 实例，避免重复加载

    // 定义初始音域
    let currentOctave = 3; // 基础八度
    let octaveSpan = 2; // 音域跨度（2个八度）
    let minOctave = 1; // 最小八度限制
    let maxOctave = 7; // 最大八度限制

    // 在全局添加高亮状态跟踪
    const activeHighlights = new Map(); // 存储 {note: {element, releaseTime}}


    /****************************/
    /*          Songs           */
    /****************************/

    // Below is definition for song class.
    class Song {
        /**
         * 增强版乐曲类
         * @param {string} title - 歌曲标题
         * @param {number} bpm - 节拍速度
         * @param {string} timeSignature - 拍号
         * @param {Object} notes - 音符事件序列
         * @param {Array<PedalEvent>} pedals - 踏板事件序列
         * @param {Array<LyricEvent>} lyrics - 歌词事件序列
         * @param {Object} metadata - 元数据
         */
        constructor(title, bpm, timeSignature, notes = {}, pedals = [], lyrics = [], metadata = {}) {
            this.title = title;
            this.bpm = bpm;
            this.timeSignature = timeSignature;
            this.notes = notes;
            this.pedals = pedals; // TODO: 踏板类
            this.lyrics = lyrics;
            this.metadata = {
                composer: metadata.composer || 'Unknown',
                arranger: metadata.arranger || '',
                copyright: metadata.copyright || '',
                description: metadata.description || '',
                ...metadata
            };
        }

        /**
         * 验证乐曲数据
         */
        validate() {
            const [beats, beatUnit] = this.timeSignature.split('/').map(Number);
            const divisionsPerMeasure = beats * (16 / beatUnit); // 每小节的16分音符数
            
            // 验证音符
            this.notes["lefthand"].forEach((measure, measureIdx) => {
                if (measure.length !== divisionsPerMeasure) {
                    console.warn(`Measure ${measureIdx + 1} has incorrect length (${measure.length}), expected ${divisionsPerMeasure}`);
                }
                
                measure.forEach((noteEvent, divisionIdx) => {
                    if (noteEvent && !this._validateNoteEvent(noteEvent)) {
                        console.warn(`Invalid note event at measure ${measureIdx + 1}, division ${divisionIdx}`);
                    }
                });
            });

            // 验证音符
            this.notes["righthand"].forEach((measure, measureIdx) => {
                if (measure.length !== divisionsPerMeasure) {
                    console.warn(`Measure ${measureIdx + 1} has incorrect length (${measure.length}), expected ${divisionsPerMeasure}`);
                }
                
                measure.forEach((noteEvent, divisionIdx) => {
                    if (noteEvent && !this._validateNoteEvent(noteEvent)) {
                        console.warn(`Invalid note event at measure ${measureIdx + 1}, division ${divisionIdx}`);
                    }
                });
            });
            
            // 验证踏板
            this.pedals.forEach(pedal => {
                if (!this._validatePedalEvent(pedal)) {
                    console.warn(`Invalid pedal event: ${JSON.stringify(pedal)}`);
                }
            });
            
            // 验证歌词
            this.lyrics.forEach(lyric => {
                if (!this._validateLyricEvent(lyric)) {
                    console.warn(`Invalid lyric event: ${JSON.stringify(lyric)}`);
                }
            });
            
            return true;
        }

        // 私有验证方法
        _validateNoteEvent(noteEvent) {
            return noteEvent.pitches && 
                Array.isArray(noteEvent.pitches) &&
                noteEvent.duration &&
                (noteEvent.velocity === undefined || (noteEvent.velocity >= 0 && noteEvent.velocity <= 1)) &&
                (noteEvent.articulation === undefined || ['legato', 'staccato', 'accent', 'tenuto', 'marcato'].includes(noteEvent.articulation));
        }

        _validatePedalEvent(pedal) {
            return pedal.measure !== undefined &&
                pedal.position !== undefined &&
                ['down', 'up'].includes(pedal.action) &&
                (pedal.type === undefined || ['sustain', 'sostenuto', 'soft'].includes(pedal.type)) &&
                (pedal.intensity === undefined || (pedal.intensity >= 0 && pedal.intensity <= 1));
        }

        _validateLyricEvent(lyric) {
            return lyric.measure !== undefined &&
                lyric.position !== undefined &&
                lyric.text !== undefined &&
                lyric.duration !== undefined;
        }

        /**
         * 从JSON创建EnhancedSong实例
         */
        static fromJSON(json) {
            return new Song(
                json.title,
                json.bpm,
                json.timeSignature,
                json.notes,
                json.pedals || [],
                json.lyrics || [],
                json.metadata || {}
            );
        }

        /**
         * 转换为JSON
         */
        toJSON() {
            return {
                title: this.title,
                bpm: this.bpm,
                timeSignature: this.timeSignature,
                notes: this.notes,
                pedals: this.pedals,
                lyrics: this.lyrics,
                metadata: this.metadata
            };
        }

        /**
         * 获取总时长(以小节为单位)
         */
        get totalMeasures() {
            return Math.max(this.notes["lefthand"].length, this.notes["righthand"].length);
        }

        /**
         * 获取指定位置的音符事件
         */
        getNote(hand, measure, division) {
            if (measure < 0 || measure >= this.notes.length) return null;
            const measureData = this.notes[hand][measure];
            if (division < 0 || division >= measureData.length) return null;
            return measureData[division];
        }
    }

    /**
     * 从JSON文件加载乐曲
     * @param {string|File} file - 文件路径或File对象
     * @returns {Promise<Song>}
     */
    async function loadSongFromJSON(file) {
        try {
            let jsonData;
            
            if (typeof file === 'string') {
                // 从URL加载
                const response = await fetch(file);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                jsonData = await response.json();
            } else if (file instanceof File) {
                // 从用户上传的文件加载
                jsonData = JSON.parse(await file.text());
            } else {
                throw new Error('Invalid file parameter');
            }
            
            const song = Song.fromJSON(jsonData);
            if (song.validate()) {
                console.log(`Successfully loaded song: ${song.title}`);
                return song;
            }
            throw new Error('Song validation failed');
        } catch (error) {
            console.error('Failed to load song:', error);
            throw error;
        }
    }

    /**
     * 保存乐曲为JSON文件
     * @param {Song} song - 乐曲实例
     * @param {string} filename - 保存的文件名
     */
    function saveSongToJSON(song, filename = 'song.json') {
        const jsonStr = JSON.stringify(song.toJSON(), null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }


    /****************************/
    /*      Piano on Web        */
    /****************************/
    
    function clearAllHighlights() {
        activeHighlights.forEach(({element}) => {
            element.classList.remove('active');
        });
        activeHighlights.clear();
    }
 
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


    // 高亮琴键的函数, only used in MusicPlayer
    function highlightKey(note, duration) {
        // 1. 检查当前音域是否包含该音符
        const currentNotes = getCurrentNotes(currentOctave);
        if (!currentNotes.includes(note)) return;

        // 2. 查找对应的琴键元素
        const keyElement = [...pianoContainer.children].find(
            key => key.dataset.note === note
        );
        if (!keyElement) return;

        // 3. 清除已有高亮（如果存在）
        if (activeHighlights.has(note)) {
            clearTimeout(activeHighlights.get(note).timeout);
            keyElement.classList.remove('active');
        }

        // 4. 添加高亮样式
        keyElement.classList.add('active');

        // 5. 设置自动取消高亮
        const releaseTime = Tone.now() + duration;
        const timeout = setTimeout(() => {
            keyElement.classList.remove('active');
            activeHighlights.delete(note);
        }, duration * 1000);

        // 6. 存储引用
        activeHighlights.set(note, {
            element: keyElement,
            releaseTime,
            timeout
        });
    }


    // --- 八度调整功能 ---
    octaveDownBtn.addEventListener('click', () => {
        clearAllHighlights();
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
        clearAllHighlights();
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
    function handleKeyDown(keyElement, event) {
        if (pianoSynth && Tone.context.state === 'running') {
            const note = keyElement.dataset.note;
            let velocity = 0.7; // 默认中等力度

            // 计算力度（适用于鼠标和触摸事件）
            const keyRect = keyElement.getBoundingClientRect();
            let clickY;
            
            if (event.type.includes('touch')) {
                // 触摸事件
                const touch = event.touches[0] || event.changedTouches[0];
                clickY = touch.clientY - keyRect.top;
            } else {
                // 鼠标事件
                clickY = event.clientY - keyRect.top;
            }
            
            velocity = (clickY / keyRect.height); // 越往下点击力度越大，反之越小
            velocity = Math.max(0.1, Math.min(1.0, velocity)); // 限制在 0.1 到 1.0 之间

            pianoSynth.triggerAttack(note, Tone.now(), velocity);
            keyElement.classList.add('active');
            console.log(`按下琴键: ${note}, 力度: ${velocity.toFixed(2)}`);
        }
    }

    function handleKeyUp(keyElement) {
        if (pianoSynth && keyElement) {
            const note = keyElement.dataset.note;
            console.log(`松开琴键: ${note}`);
            pianoSynth.triggerRelease(note);
            keyElement.classList.remove('active');
        }
    }

    // 鼠标事件
    pianoContainer.addEventListener('mousedown', (event) => {
        const clickedKey = event.target.closest('.key');
        if (clickedKey) {
            handleKeyDown(clickedKey, event);
        }
    });

    pianoContainer.addEventListener('mouseup', (event) => {
        const clickedKey = event.target.closest('.key');
        handleKeyUp(clickedKey);
    });

    // 触摸事件
    pianoContainer.addEventListener('touchstart', (event) => {
        // 阻止默认行为以避免触摸时页面滚动
        event.preventDefault();
        const touchedKey = document.elementFromPoint(
            event.touches[0].clientX,
            event.touches[0].clientY
        ).closest('.key');
        if (touchedKey) {
            handleKeyDown(touchedKey, event);
        }
    }, { passive: false }); // 设置为非passive以允许preventDefault

    pianoContainer.addEventListener('touchend', (event) => {
        // 查找所有活动的琴键
        const activeKeys = pianoContainer.querySelectorAll('.key.active');
        activeKeys.forEach(key => {
            handleKeyUp(key);
        });
    });

    // 处理触摸移出琴键区域的情况
    pianoContainer.addEventListener('touchcancel', (event) => {
        const activeKeys = pianoContainer.querySelectorAll('.key.active');
        activeKeys.forEach(key => {
            handleKeyUp(key);
        });
    });

    // 如果鼠标/触摸从琴键上滑开，也停止声音
    pianoContainer.addEventListener('mouseleave', (event) => {
        const activeKeys = pianoContainer.querySelectorAll('.key.active');
        activeKeys.forEach(key => {
            handleKeyUp(key);
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


    /****************************/
    /*      MusicPlayer         */
    /****************************/

    class MusicPlayer {
        /**
         * @param {Tone.Sampler} sampler - 音源采样器
         */
        constructor(song, sampler) {
            this.song = song;
            this.sampler = sampler;
            this.isPlaying = false;
            this.currentMeasure = 0;
            this.currentDivision = 0;
            this.playbackSpeed = 1.0;
            this.loopRange = null; // [startMeasure, endMeasure]
            //踏板
            this.isSustainPedalDown = true;
            this.sustainedNotes = new Set(); // 用于跟踪被延音的音符
            
            // 播放状态回调
            this.onPlay = null;
            this.onStop = null;
            this.onProgress = null;
            this.onLyric = null;
            
            // 初始化Tone.js Transport
            this._setupTransport();
        }

        _setupTransport() {
            // 设置初始BPM
            Tone.Transport.bpm.value = this.song.bpm;
            
            // 计算每个16分音符的时长(秒)
            this._divisionDuration = 60 / (this.song.bpm * 4);
            
            // 创建主循环
            this._playbackLoop = new Tone.Loop((time) => {
                this._playCurrentDivision(time);
                this._advancePlayhead();
            }, "16n").start(0);
        }

        _playCurrentDivision(time) {
            // 1. 播放当前音符
            // TODO: 加上踏板的效果
            for (let hand of ["lefthand", "righthand"]) {
                const noteEvent = this.song.getNote(hand, this.currentMeasure, this.currentDivision);
                if (noteEvent) {
                    // this.sampler.triggerAttackRelease(
                    //     noteEvent.pitches,
                    //     noteEvent.duration,
                    //     time,
                    //     noteEvent.velocity || 0.8
                    // );

                    // const durationInSeconds = Tone.Time(noteEvent.duration).toSeconds() - 0.1;
                    // 踏板
                    const duration = this.isSustainPedalDown ? '2n' : noteEvent.duration;
                    this.sampler.triggerAttackRelease(
                        noteEvent.pitches,
                        duration,
                        time,
                        noteEvent.velocity || 0.8
                    );

                    // 如果踏板被按下，记录这些音符
                    if (this.isSustainPedalDown) {
                        noteEvent.pitches.forEach(pitch => {
                            this.sustainedNotes.add(pitch);
                        });
                    }
                    const durationInSeconds = Tone.Time(duration).toSeconds() - 0.1;

                    // 高亮对应的琴键
                    noteEvent.pitches.forEach(pitch => {
                        highlightKey(pitch, (durationInSeconds > 0.1 ? durationInSeconds : 0.1));
                    });
                }
            }
            
            // 2. 处理踏板事件
            this._processPedalEvents(time);
            
            // 3. 处理歌词事件
            this._processLyricEvents();
            
            // 4. 触发进度回调
            if (this.onProgress) {
                this.onProgress({
                    measure: this.currentMeasure,
                    division: this.currentDivision,
                    progress: this._calculateProgress(),
                    time: Tone.Transport.seconds
                });
            }
        }

        _processPedalEvents(time) {
            // 获取当前时间点的踏板事件
            const currentPedals = this.song.pedals.filter(p => 
                p.measure === this.currentMeasure && 
                p.position === this.currentDivision
            );
            console.log(`当前踏板事件: ${JSON.stringify(currentPedals)}`);
            currentPedals.forEach(pedal => {
                // TODO: 这里需要实现实际的踏板控制逻辑
                if (pedal.type === 'sustain' || !pedal.type) { // 默认处理延音踏板
                    if (pedal.action === 'down') {
                        this.isSustainPedalDown = true;
                        console.log('延音踏板按下');
                    } else if (pedal.action === 'up') {
                        this.isSustainPedalDown = false;
                        // 释放所有被延音的音符
                        this.sustainedNotes.forEach(note => {
                            this.sampler.triggerRelease(note, time);
                        });
                        this.sustainedNotes.clear();
                        console.log('延音踏板释放');
                    }
                }
            // 可以在这里添加对其他类型踏板的处理
            });
        }
        
        _processLyricEvents() {
            // 获取当前时间点的歌词
            const currentLyrics = this.song.lyrics.filter(l => 
                l.measure === this.currentMeasure && 
                l.position === this.currentDivision
            );
            
            if (currentLyrics.length > 0 && this.onLyric) {
                this.onLyric(currentLyrics);
            }
        }
        
        _advancePlayhead() {
            // 前进到下一个16分音符位置
            this.currentDivision++;
            
            const divisionsPerMeasure = this._getDivisionsPerMeasure();
            if (this.currentDivision >= divisionsPerMeasure) {
                this.currentDivision = 0;
                this.currentMeasure++;
                
                // 检查循环或结束
                if (this.loopRange && this.currentMeasure > this.loopRange[1]) {
                    this.currentMeasure = this.loopRange[0];
                } else if (this.currentMeasure >= this.song.totalMeasures) {
                    this.stop();
                }
            }
        }
        
        _getDivisionsPerMeasure() {
            const [beats, beatUnit] = this.song.timeSignature.split('/').map(Number);
            return beats * (16 / beatUnit);
        }
        
        _calculateProgress() {
            const totalDivisions = this.song.totalMeasures * this._getDivisionsPerMeasure();
            const currentDivision = this.currentMeasure * this._getDivisionsPerMeasure() + this.currentDivision;
            return currentDivision / totalDivisions;
        }
        
        // Public Methods
        play() {
            if (!this.isPlaying) {
                Tone.Transport.start();
                this.isPlaying = true;
                if (this.onPlay) this.onPlay();
            }
        }
        
        pause() {
            if (this.isPlaying) {
                Tone.Transport.pause();
                this.isPlaying = false;
            }
        }
        
        stop() {
            Tone.Transport.stop();
            // Tone.Transport.cancel();
            this.isPlaying = false;
            this.currentMeasure = 0;
            this.currentDivision = 0;
            if (this.onStop) this.onStop();
            if (this.onProgress) this.onProgress({ progress: 0 }); // 重置进度
        }
        
        seek(measure, division = 0) {
            if (measure >= 0 && measure < this.song.totalMeasures) {
                this.currentMeasure = measure;
                this.currentDivision = division;
                
                // 计算对应的Transport位置
                const divisionsPerMeasure = this._getDivisionsPerMeasure();
                const absolutePosition = measure * divisionsPerMeasure + division;
                Tone.Transport.seconds = absolutePosition * this._divisionDuration;
            }
        }
        
        setPlaybackSpeed(speed) {
            this.playbackSpeed = Math.max(0.1, Math.min(2.0, speed));
            Tone.Transport.playbackRate = this.playbackSpeed;
        }
        
        setLoop(startMeasure, endMeasure) {
            if (startMeasure >= 0 && endMeasure < this.song.totalMeasures && startMeasure <= endMeasure) {
                this.loopRange = [startMeasure, endMeasure];
            } else {
                this.loopRange = null;
            }
        }
        
        dispose() {
            this.stop();
            this._playbackLoop.dispose();
        }
    }


    // 获取所有播放按钮并添加事件监听
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', async (event) => {
            // 阻止事件冒泡到卡片
            event.stopPropagation(); 
            
            // 获取关联的JSON URL
            const songCard = event.target.closest('.song-card');
            const jsonUrl = songCard.dataset.jsonUrl;
            
            // 显示加载状态
            nowPlaying.textContent = "加载中...";
            nowLyric.textContent = "--";
            messageArea.textContent = `正在加载: ${songCard.querySelector('h3').textContent}`;
            
            try {
                // 1. 加载歌曲数据
                const song = await loadSongFromJSON(jsonUrl);
                
                // 2. 停止现有播放器
                if (activePlayer) {
                    activePlayer.dispose();
                }

                if (!pianoSynth) {
                    initializeInstrument()
                }
                
                // 3. 创建新播放器实例
                activePlayer = new MusicPlayer(song, pianoSynth);
                
                // 4. 设置播放器回调
                activePlayer.onPlay = () => {
                    playBtn.disabled = true;
                    pauseBtn.disabled = false;
                    stopBtn.disabled = false;
                    messageArea.textContent = `正在播放: ${song.title}`;
                };
                
                activePlayer.onProgress = ({ progress }) => {
                    progressBar.value = progress * 100;
                    updateTimeDisplay(song, progress);
                };
                
                activePlayer.onLyric = (lyrics) => {
                    nowLyric.textContent = lyrics.map(l => l.text).join(' ');
                };

                activePlayer.onStop = () => {
                    playBtn.disabled = false;
                    pauseBtn.disabled = true;
                    stopBtn.disabled = true;
                    messageArea.textContent = `${song.title} 播放完成`;
                };
                
                // 5. 更新UI显示
                nowPlaying.textContent = `${song.title} - ${song.metadata.composer || '未知作者'}`;
                progressBar.max = 100;
                
                // 6. 启用控制按钮
                playBtn.disabled = false;
                pauseBtn.disabled = true;
                stopBtn.disabled = true;
                
                // 7. 自动开始播放（可选）
                // activePlayer.play();
                
            } catch (error) {
                console.error("加载失败:", error);
                messageArea.textContent = `加载失败: ${error.message}`;
                nowPlaying.textContent = "加载错误";
            }

            messageArea.textContent = `${songCard.querySelector('h3').textContent} 加载完成！`;
        });
    });

    // 辅助函数：更新时间显示
    function updateTimeDisplay(song, progress) {
        const totalSeconds = song.totalMeasures * (60 / song.bpm) * parseInt(song.timeSignature.split('/')[0]);
        const currentSeconds = totalSeconds * progress;
        
        timeDisplay.textContent = 
            `${formatTime(currentSeconds)} / ${formatTime(totalSeconds)}`;
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // 播放按钮
    playBtn.addEventListener('click', () => {
        if (activePlayer) {
            activePlayer.play();
            playBtn.disabled = true;
            pauseBtn.disabled = false;
        }
    });

    // 暂停按钮
    pauseBtn.addEventListener('click', () => {
        if (activePlayer) {
            activePlayer.pause();
            pauseBtn.disabled = true;
            playBtn.disabled = false;
        }
    });

    // 停止按钮
    stopBtn.addEventListener('click', () => {
        if (activePlayer) {
            activePlayer.stop();
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            progressBar.value = 0;
            updateTimeDisplay(activePlayer.song, 0);
        }
    });

    // 循环按钮
    let isLooping = false;
    loopBtn.addEventListener('click', () => {
        isLooping = !isLooping;
        if (activePlayer) {
            activePlayer.setLoop(isLooping ? 0 : null);
        }
        loopBtn.style.backgroundColor = isLooping ? '#e3f2fd' : '';
    });

    // 进度条
    progressBar.addEventListener('input', (e) => {
        if (!activePlayer) return;
        
        const percent = e.target.value / 100;
        const targetMeasure = Math.floor(percent * activePlayer.song.totalMeasures);
        
        activePlayer.seek(targetMeasure);
    });


    /****************************/
    /*       Recording          */
    /****************************/

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


    /****************************/
    /*       Metronome          */
    /****************************/

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

    // testings

    let song;
    
    try {
        song = await loadSongFromJSON("https://calvinxiaocao.github.io/piano/songs/test.json");
        console.log("Successfully loaded!");
    } catch (error) {
        alert("load error.");
    }
});
