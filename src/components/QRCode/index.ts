import { Options } from 'qr-code-styling';

export const defaultQRCodeOptions: Options = {
  type: 'svg',
  margin: 10,
  qrOptions: {
    typeNumber: 0,
    mode: 'Byte',
    errorCorrectionLevel: 'Q',
  },
  dotsOptions: {
    color: '#222222',
    type: 'dots',
  },
  backgroundOptions: {
    color: 'transparent',
  },
  cornersDotOptions: {
    type: 'dot',
    color: '#222222',
  },
  cornersSquareOptions: {
    type: 'extra-rounded',
    color: '#222222',
  },
};
