import React from 'react';

import { FaSearch } from 'react-icons/fa';

interface Props {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Searchbar = ({ onChange }: Props) => {
  return (
    <div className="flex w-full items-center justify-center">
      <FaSearch className="mx-2 h-5 w-5 text-neutral-500" />
      <input
        className="w-full rounded-lg p-3 text-lg text-neutral-500 focus:outline-none"
        type="text"
        placeholder="Search for assets"
        onChange={onChange}
      />
    </div>
  );
};

export default Searchbar;
