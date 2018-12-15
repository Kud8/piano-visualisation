import xml2js from 'xml2js';
import colors from '../constants/colors';
import types from '../constants/types';

export default (score) => new Promise((resolve) => {
    let parser = new xml2js.Parser();
    let builder = new xml2js.Builder();

    parser.parseString(score, function (err, result) {
        result['score-partwise'].part.forEach((part) => {
            part.measure.forEach((measure) => {
                const level = getLevel(measure);

                measure.note.forEach((note) => {
                    note.$ = note.$ || {};
                    note.$.color = colors[level];
                });
            });
        });
        let xml = builder.buildObject(result);
        resolve(xml);
    });
});

const getTupletCount = (measure) => {
    let count = 0;
    measure.note.forEach((note) => {
        if (note.notations && note.notations[0] && note.notations[0].tuplet) {
            ++count;
        }
    });
    return Math.ceil(count / 2);
};

const getGraceCount = (measure) => measure.note
    .filter((note) =>
        note.grace !== undefined
        && (
            (note.grace[0] && note.grace[0] && note.grace[0].$ && note.grace[0].$.slash)
            || (
                note.notations && note.notations[0]
                && note.notations[0].slur && note.notations[0].slur[0]
                && note.notations[0].slur[0].$ && note.notations[0].slur[0].$.type === 'start'
            )
        )
    )
    .length;

const getTrillsCount = (measure) => measure.note
    .filter((note) =>
        note.notations && note.notations[0]
        && note.notations[0].ornaments && note.notations[0].ornaments[0]
        && note.notations[0].ornaments[0]['trill-mark'] !== undefined)
    .length;

const getNoteName = (note) => {
    if (note.pitch) {
        const pitch = note.pitch[0];
        const step = pitch.step ? pitch.step[0] : '';
        const octave = pitch.octave ? pitch.octave[0] : '';
        const alter = pitch.alter ? pitch.alter[0] : '';
        return step + octave + alter;
    }
    return '';
};

const getUniqueChordsLevel = (measure) => {
    const chords = [];
    let currentChord = '';
    measure.note.forEach((note, i) => {
        if (currentChord === '') {
            if (note.chord && i > 0) {
                currentChord = getNoteName(measure.note[i - 1]) + ' ' +  getNoteName(note);
            }
        } else {
            if (note.chord) {
                currentChord += ' ' + getNoteName(note);
            } else {
                if (currentChord !== '') {
                    chords.push(currentChord);
                    currentChord = '';
                }
            }
        }
    });
    const uniqueChords = chords.filter((v, i, a) => a.indexOf(v) === i);
    if (uniqueChords.length === 0) {
        return 0;
    }
    const hardness =
        Math.min(uniqueChords.filter((chord) => chord.split(' ').length >= 4).length * 3, 6)
        + Math.min(uniqueChords.filter((chord) => chord.split(' ').length >= 5).length * 5, 10);

    return Math.min(uniqueChords.length * 3, 10) + hardness;
};

const getTempLevel = (measure) => {
    const allTemps = {};
    const getPercentage = (type) => allTemps[type] / measure.note.length * 100;

    measure.note.forEach((note) => {
        if (allTemps[note.type]) {
            ++allTemps[note.type]
        } else {
            allTemps[note.type] = 1;
        }
    });
    if (allTemps[types["64"]] || getPercentage(types["32"]) >= 30) {
        return 20;
    }
    let level = 0;
    if (getPercentage(types["32"]) > 0 && getPercentage(types["32"]) < 30) {
        level += 10;
    }
    if (getPercentage(types["16"]) >= 30) {
        level += 8;
    }
    if (getPercentage(types["16"]) > 0 && getPercentage(types["16"]) < 30) {
        level += 5;
    }
    if (getPercentage(types["8"]) >= 30) {
        level += 5;
    }
    if (getPercentage(types["8"]) > 0 && getPercentage(types["8"]) < 30) {
        level += 2;
    }
    if (getPercentage(types["2"]) >= 30) {
        level -= 5;
    }
    if (getPercentage(types["2"]) > 0 && getPercentage(types["2"]) < 30) {
        level -= 3;
    }
    if (getPercentage(types["1"]) > 0) {
        level -= 5;
    }

    return Math.min(level, 20) * 2;
};

const getLevel = (measure) => {
    const graceLevel = getGraceCount(measure) > 0 ? Math.min(7 + getGraceCount(measure) * 5, 20) : 0;
    const trillsLevel = getTrillsCount(measure) > 0 ? Math.min(7 + getTrillsCount(measure) * 5, 15) : 0;
    const tupletsLevel = getTupletCount(measure) > 0 ? Math.min(7 + getTupletCount(measure) * 5, 15) : 0;
    const chordsLevel = getUniqueChordsLevel(measure);
    const tempLevel = getTempLevel(measure);

    return Math.min(
        Math.ceil((graceLevel + trillsLevel + tupletsLevel + chordsLevel + tempLevel) / 16),
        4
    ) || 1;
};
