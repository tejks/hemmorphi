'use client';

import { QrAccountWithPubkey } from '@/model/QrAccount';
import { useRouter } from 'next/navigation';
import { MdOutlineAddCircleOutline } from 'react-icons/md';
import QRListElement from './QRListElement';

interface Props {
  data: QrAccountWithPubkey[];
  callback: () => void;
}

const QRList = ({ data, callback }: Props) => {
  const router = useRouter();

  return (
    <div className="py-1 px-3 space-y-3">
      {data.map((qr, index) => (
        <QRListElement
          key={index}
          qr={qr}
          onQRClick={() => {}}
          callback={callback}
        />
      ))}

      {data.length < 5 && (
        <div
          className="py-4 flex justify-center items-center shadow-lg rounded-xl group cursor-pointer bg-orange-500/20"
          onClick={() => router.push('/qr-codes/new')}
        >
          <MdOutlineAddCircleOutline className="text-5xl text-neutral-500 group-hover:scale-105 duration-200" />
        </div>
      )}
    </div>
  );
};

export default QRList;
