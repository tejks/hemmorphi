'use client';

import { QRData } from '@/app/page';
import QRListElement from './QRListElement';

interface Props {
  qrData: QRData[];
}

const QRList = ({ qrData }: Props) => {
  return (
    <div className="py-2 px-3 space-y-2">
      {qrData.map((qr, index) => (
        <QRListElement key={index} qr={qr} onQRClick={() => {}} />
      ))}
    </div>
  );
};

export default QRList;
