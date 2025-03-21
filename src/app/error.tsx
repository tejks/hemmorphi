'use client';

export default function Error() {
  return (
    <div className="flex justify-center mt-72">
      <div className="text-center space-y-5">
        <p className="text-2xl font-bold tracking-tight text-neutral-600 sm:text-5xl">
          Uh-oh!
        </p>

        <h1 className="inline-block bg-gradient-to-r from-[#FB9D1F] to-[#1C5C75] bg-clip-text text-3xl  text-transparent py-2">
          500 - Internal Server Error
        </h1>

        <p className="mt-4 text-gray-500">
          An unexpected error occurred. Please try again later.
        </p>
      </div>
    </div>
  );
}
