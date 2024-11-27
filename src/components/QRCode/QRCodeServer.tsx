import nodeCanvas from 'canvas';
import { JSDOM } from 'jsdom';
import QRCodeStyling from 'qr-code-styling';
import { defaultQRCodeOptions } from '.';

interface QRCodeServerProps {
  data: string;
}

export const QRCodeServer = async ({ data }: QRCodeServerProps) => {
  const qrCode = new QRCodeStyling({
    width: 300,
    height: 300,
    jsdom: JSDOM,
    nodeCanvas,
    data,
    ...defaultQRCodeOptions,
  });
  const buffer = await qrCode.getRawData('svg');
  const svg = buffer?.toString();

  return svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : null;
};
