'use strict';

const DEFAULT_BALANCE = parseFloat(process.env.DEFAULT_BALANCE || '50000');

const fmt = (n) =>
  Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const DEFAULT_SETTINGS =
  'SoundState=true_true_true_false_false;FastPlay=false;Intro=true;StopMsg=0;' +
  'TurboSpinMsg=0;BetInfo=0_-1;BatterySaver=false;ShowCCH=false;ShowFPH=false;' +
  'CustomGameStoredData=;Coins=false;Volume=0.5;GameSpeed=0;HapticFeedback=false';

module.exports = { DEFAULT_BALANCE, fmt, DEFAULT_SETTINGS };
