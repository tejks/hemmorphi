import { QRCode } from '@/components/QRCode/QRCode';
import { QRCodeServer } from '@/components/QRCode/QRCodeServer';

export default function Home() {
  return (
    <main className="flex items-center justify-center">
      <QRCode data="http://qr-code-styling.com" />
      <QRCodeServer data="http://qr-code-styling.com" />
    </main>
  );
}
