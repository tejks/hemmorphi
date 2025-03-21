import { useShortPublicKey } from '@/hooks/useShortPublicKey';
import { FaAngleRight, FaUser } from 'react-icons/fa6';

interface WalletTransferProps {
  dest: string;
}

const WalletTransferAnimation = ({ dest }: WalletTransferProps) => {
  const short = useShortPublicKey(dest);

  return (
    <div className="flex justify-center items-center py-10 ">
      <div className="flex items-center gap-5">
        <div className="flex flex-col justify-center space-y-4 text-center">
          <div className="w-20 h-20 bg-white rounded-xl flex justify-center items-center text-orange-600 font-bold shadow-xl">
            <FaUser className="text-3xl" />
          </div>

          <p>YOU</p>
        </div>

        <div className="relative flex gap-2 -ml-5">
          {[0, 0.2, 0.4, 0.6, 0.8].map((delay, index) => (
            <FaAngleRight
              key={index}
              className="text-orange-600 text-2xl animate-moveArrow"
              style={{
                animationDelay: `${delay}s`,
              }}
            />
          ))}
        </div>

        <div className="flex flex-col justify-center ml-7 space-y-4">
          <div className="w-20 h-20 bg-white rounded-xl flex justify-center items-center text-orange-600 font-bold shadow-xl">
            <FaUser className="text-3xl" />
          </div>

          <p>{short}</p>
        </div>
      </div>
    </div>
  );
};

export default WalletTransferAnimation;
