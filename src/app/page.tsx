'use client';
import solanaLogo from '@/assets/solanaLogoMark.png';
import Image from 'next/image';

export default function Page() {
  // const fetchPrices = async () => {
  //   try {
  //     const response = await fetch(
  //       '/api/tokens/price?ids=So11111111111111111111111111111111111111112,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
  //     );
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch prices');
  //     }
  //     const result = await response.json();
  //     console.log(result);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  return (
    <main className="container mx-auto flex justify-between items-center flex-col h-[92%] py-20">
      <div></div>
      <div className="text-center pb-32">
        <div className="font-bold text-gray-300 text-9xl">
          <p className="inline-block bg-gradient-to-r from-orange-600 to-[#949494] bg-clip-text text-transparent">
            Hemmorphi
          </p>
        </div>
        <p className="text-gray-500 text-3xl mt-4">
          Create custom transfers with QR codes
        </p>
      </div>

      <div className="w-3/4 xl:w-3/5 text-center flex space-x-4 justify-center items-center">
        <p className="text-md font-semibold text-gray-400 lg:text-lg justify-center items-center">
          Powered by Solana{' '}
        </p>
        <Image
          src={solanaLogo}
          alt="Solana"
          className=""
          width={40}
          height={40}
        />
      </div>
    </main>
  );
}
