let didAudioInit = false;
let bigfm;

let sampleRate;

export async function init() {
  // must specify workletPath before initializing Gibberish
  Gibberish.workletPath = "/static/vendor/gibberish_worklet.js";

  // Gibberish.init will wait to initialize audio context until
  // the browser window has received a mousedown or a touchdown
  // event, which is required in modern browsers.
  await Gibberish.init();

  Gibberish.export(window);
  sampleRate = Gibberish.ctx.sampleRate;

  console.log(Gibberish.ctx);

  const kik = Kick().connect(); // connects to master output by default
  const seq = Sequencer.make([0.5, 0.25], [sampleRate], kik, "trigger").start();

  // bigfm = PolyFM({
  //   gain: 0.15,
  //   cmRatio: 1.4,
  //   index: 1.2,
  //   carrierWaveform: "triangle",
  //   modulatorWaveform: "square",
  //   attack: sampleRate * 32,
  //   decay: sampleRate * 32,
  //   feedback: 0.1,
  // }).connect();

  bigfm = PolyFM({
    gain: 0.15,
    cmRatio: 1.01,
    index: 1.2,
    carrierWaveform: "triangle",
    modulatorWaveform: "square",
    // attack: sampleRate * 32,
    // decay: sampleRate * 32,
    feedback: 0.1,
  });

  // bigfm = PolySynth({
  //   maxVoices: 4,
  //   attack: 44,
  //   decay: sampleRate / 2,
  //   gain: 0.1,
  // });

  const verb = Freeverb({ roomSize: 0.95, damping: 0.15 }).connect();
  const chorus = Chorus().connect(verb);
  bigfm.connect(chorus);

  // ready
  didAudioInit = true;
}

export function play() {
  if (!didAudioInit) {
    // not inited? keep checking every frame
    setTimeout(() => play());
    return;
  }

  // bigfm.chord([110, 220, 330, 440]);
  // bigfm.chord([220, 330, 440, 550]);
}
