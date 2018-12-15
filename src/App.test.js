import { getNoteName } from './utils/analizer';

it('check getNoteName', () => {
  expect(getNoteName({ pitch: [{ step: ["B"], octave: ["4"] }] })).toEqual("B4");
});
