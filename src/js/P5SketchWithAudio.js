import React, { useRef, useEffect } from "react";
import "./helpers/Globals";
import "p5/lib/addons/p5.sound";
import * as p5 from "p5";
import { Midi } from '@tonejs/midi'
import PlayIcon from './functions/PlayIcon.js';

import audio from "../audio/patterns-no-7.ogg";
import midi from "../audio/patterns-no-7.mid";

const P5SketchWithAudio = () => {
    const sketchRef = useRef();

    const Sketch = p => {

        p.canvas = null;

        p.canvasWidth = window.innerWidth;

        p.canvasHeight = window.innerHeight;

        p.audioLoaded = false;

        p.player = null;

        p.PPQ = 3840 * 4;

        p.loadMidi = () => {
            Midi.fromUrl(midi).then(
                function(result) {
                    console.log(result);
                    const noteSet1 = result.tracks[1].notes;
                    p.scheduleCueSet(noteSet1, 'executeCueSet1');
                    p.audioLoaded = true;
                    document.getElementById("loader").classList.add("loading--complete");
                    document.getElementById("play-icon").classList.remove("fade-out");
                }
            );
            
        }

        p.preload = () => {
            p.song = p.loadSound(audio, p.loadMidi);
            p.song.onended(p.logCredits);
        }

        p.scheduleCueSet = (noteSet, callbackName, poly = false)  => {
            let lastTicks = -1,
                currentCue = 1;
            for (let i = 0; i < noteSet.length; i++) {
                const note = noteSet[i],
                    { ticks, time } = note;
                if(ticks !== lastTicks || poly){
                    note.currentCue = currentCue;
                    p.song.addCue(time, p[callbackName], note);
                    lastTicks = ticks;
                    currentCue++;
                }
            }
        } 

        p.setup = () => {
            p.canvas = p.createCanvas(p.canvasWidth, p.canvasHeight);
            p.background(0);
            p.colorMode(p.HSB);
            p.noLoop();
            p.generateCells();
        }

        p.draw = () => {
            p.translate(p.width / 2, p.height / 2);
            if(p.audioLoaded && p.song.isPlaying()){

            }
        }


        p.executeCueSet1 = (note) => {
            const { duration } = note,
                
                colourScheme = [],
                saturation = p.random(50, 100),
                brightness = p.random(50, 100),
                loopsPerBar = p.random([12, 24, 36, 48]),
                size = p.width / (loopsPerBar * 2),
                delay = (duration * 1000) / loopsPerBar;

            let baseHue = p.random(0, 360);
            for (let i = 0; i < 9; i++) {
                colourScheme.push(
                    baseHue
                );
                baseHue = baseHue + 45 > 360 ? baseHue - 235 : baseHue + 45;
            }
            
            p.clear();
            
            // p.background(baseHue, saturation, brightness);
            p.background(0);
            

            for (let i = 1; i <= loopsPerBar; i++) {
                const cellPattern = p.random(['cross', 'plus','circle','split-circles']),
                    colour = p.color(
                        colourScheme[i % 10], saturation, brightness
                    ),
                    inverseHue = colourScheme[i % 10] + 180 > 360 ? colourScheme[i % 10] - 180 : colourScheme[i % 10] + 180;

                setTimeout(
                    function () {
                        p.cells.filter(rect => rect.loopIndex === i).forEach(rect => {
                            const { x, y } = rect;
                            p.fill(colour);
                            
                            // p.noStroke();
                            p.rect(size * x, size * y, size, size);

                            p.stroke(0, 0, 100);
                            // p.stroke(inverseHue, saturation, brightness);
                            p.strokeWeight(2);
                            if(cellPattern === 'cross') {
                                p.line(size * x, size * y, size * x + size, size * y + size);
                                p.line(size * x + size, size * y, size * x, size * y + size);
                            }
                            
                            if(cellPattern === 'plus') {
                                p.line(size * x + size / 2, size * y, size * x + size / 2, size * y + size);
                                p.line(size * x + size, size * y  + size / 2, size * x, size * y +  + size / 2);
                            }

                            if(cellPattern === 'circle') {
                                p.noFill();
                                p.circle(size * x + size / 2, size * y + size / 2, size / 2, size / 2);
                            }
                            
                            if(cellPattern === 'split-circles') {
                                p.noFill();
                                p.arc(
                                    size * x, 
                                    size * y + size / 2, 
                                    size, 
                                    size, 
                                    -p.PI / 2, 
                                    p.PI / 2
                                );
                                p.arc(
                                    size * x + size, 
                                    size * y + size / 2, 
                                    size, 
                                    size, 
                                    p.PI / 2, 
                                    p.PI + p.PI / 2
                                );
                            }
                        });
                    },
                    (delay * i)
                );
                
            }
        }

        p.cells = [];

        p.generateCells = () => {
            let loopIndex = 1;
            for (let i = 1; i < 64; i++) {
                for (let x = -i; x < i; x++) {
                    for (let y = -i; y < i; y++) {

                        const key = x + '-' + y;
                        if (! p.cells.some(r => r.key === key)) {
                            p.cells.push(
                                {
                                    key: key,
                                    x: x,
                                    y: y,
                                    loopIndex: loopIndex
                                }
                            );
                        }
                        
                    }
                }
                loopIndex++;
            }
        }

        p.hasStarted = false;

        p.mousePressed = () => {
            if(p.audioLoaded){
                if (p.song.isPlaying()) {
                    p.song.pause();
                } else {
                    if (parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)) {
                        p.reset();
                        if (typeof window.dataLayer !== typeof undefined){
                            window.dataLayer.push(
                                { 
                                    'event': 'play-animation',
                                    'animation': {
                                        'title': document.title,
                                        'location': window.location.href,
                                        'action': 'replaying'
                                    }
                                }
                            );
                        }
                    }
                    document.getElementById("play-icon").classList.add("fade-out");
                    p.canvas.addClass("fade-in");
                    p.song.play();
                    if (typeof window.dataLayer !== typeof undefined && !p.hasStarted){
                        window.dataLayer.push(
                            { 
                                'event': 'play-animation',
                                'animation': {
                                    'title': document.title,
                                    'location': window.location.href,
                                    'action': 'start playing'
                                }
                            }
                        );
                        p.hasStarted = false
                    }
                }
            }
        }

        p.creditsLogged = false;

        p.logCredits = () => {
            if (
                !p.creditsLogged &&
                parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)
            ) {
                p.creditsLogged = true;
                    console.log(
                    "Music By: http://labcat.nz/",
                    "\n",
                    "Animation By: https://github.com/LABCAT/"
                );
                p.song.stop();
            }
        };

        p.reset = () => {

        }

        p.updateCanvasDimensions = () => {
            p.canvasWidth = window.innerWidth;
            p.canvasHeight = window.innerHeight;
            p.canvas = p.resizeCanvas(p.canvasWidth, p.canvasHeight);
        }

        if (window.attachEvent) {
            window.attachEvent(
                'onresize',
                function () {
                    p.updateCanvasDimensions();
                }
            );
        }
        else if (window.addEventListener) {
            window.addEventListener(
                'resize',
                function () {
                    p.updateCanvasDimensions();
                },
                true
            );
        }
        else {
            //The browser does not support Javascript event binding
        }
    };

    useEffect(() => {
        new p5(Sketch, sketchRef.current);
    }, []);

    return (
        <div ref={sketchRef}>
            <PlayIcon />
        </div>
    );
};

export default P5SketchWithAudio;
