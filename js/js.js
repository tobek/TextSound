"use strict";

// jQuery.noConflict();


$(function() { // upon DOM having loaded

  $("#makesound").click(function(e){
    e.preventDefault();
    var melody = lettersToNotes($("#input").val());
    $("#melody").html(melody.join(" ")).show();
    playArray(melody);
    //allNotes();
  });

});

function lettersToNotes(str) {
  str = str.toLowerCase().replace(/\W/g, ""); // remove everything not a letter
  // TODO: turn spaces into breaks?

  var scale = 21; // where to start. this is C3
  var numeric = allNotes(); // array mapping #s to notes. numeric[21] == "C3"
  return $.map(str, function(c){
    return numeric[scale + (c.charCodeAt()-97) % 8]; // 97 is ASCII of 'a', %8 to get number from 0-7
  })
}

function playArray(notes) {
  var freqs = [];
  $.each(notes, function(i, n){
    //console.log("Playing "+n+": "+Note.fromLatin(n).frequency());
    freqs.push(Note.fromLatin(n).frequency());
  });
  playFreqs(freqs);
}

function playFreqs(freqs) {
  var AudioletApp = function() {
      this.audiolet = new Audiolet();

      var frequencyPattern = new PSequence(freqs, 1);

      this.audiolet.scheduler.play([frequencyPattern], 1,
        function(frequency) {
          var synth = new Synth(this.audiolet, frequency);
          synth.connect(this.audiolet.output);
        }.bind(this)
      );

      // more complex patterns https://github.com/oampo/Audiolet/wiki/Playing-A-Melody
  };

  var audioletApp = new AudioletApp(); 
};

function allNotes() {
  var notes=['A','B','C','D','E','F', 'G'];
  var allOctaves=[];
  for (var i = 0; i<6; i++) {
    $.each(notes, function(k, n){
      allOctaves.push(n+i);
    });
  }

  var all = [];
  $.each(allOctaves, function(i, n){
    all.push({"note": n, "freq": Note.fromLatin(n).frequency()});
  });
  all.sort(function(a,b) {return (a.freq > b.freq) ? 1 : -1;} );

  var numeric = [];
  $.each(all, function(i, n){
    //console.log(n.note+": "+n.freq)
    numeric.push(n.note);
  });
  return numeric;
}

var Synth = function(audiolet, frequency) {
    AudioletGroup.apply(this, [audiolet, 0, 1]);
    this.sine = new Sine(this.audiolet, frequency);
    this.modulator = new Saw(this.audiolet, frequency * 2);
    this.modulatorMulAdd = new MulAdd(this.audiolet, frequency / 2,
                                      frequency);

    this.gain = new Gain(this.audiolet);
    this.envelope = new PercussiveEnvelope(this.audiolet, 1, 0.2, 0.5,
        function() {
            this.audiolet.scheduler.addRelative(0,
                                                this.remove.bind(this));
        }.bind(this)
    );

    this.modulator.connect(this.modulatorMulAdd);
    this.modulatorMulAdd.connect(this.sine);
    this.envelope.connect(this.gain, 0, 1);
    this.sine.connect(this.gain);
    this.gain.connect(this.outputs[0]);
};
extend(Synth, AudioletGroup);