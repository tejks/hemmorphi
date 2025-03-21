import { cn } from '@/utils/cn';
import { useEffect, useRef } from 'react';
import { IoCloseOutline } from 'react-icons/io5';

interface ModalProps {
  isOpen: boolean;
  hasCloseBtn?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  hasCloseBtn,
  onClose,
  children,
  className = '',
}) => {
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement) {
      if (isOpen) {
        modalElement.showModal();
      } else {
        modalElement.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        event.stopPropagation();

        handleCloseModal();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref]);

  const handleCloseModal = () => {
    if (onClose) onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') handleCloseModal();
  };

  return (
    <dialog
      ref={modalRef}
      onKeyDown={handleKeyDown}
      className={cn(
        'rounded-xl place-items-center backdrop:bg-black/50 backdrop:backdrop-blur-md',
        className
      )}
    >
      {hasCloseBtn && (
        <button className="absolute right-5 top-5" onClick={handleCloseModal}>
          <IoCloseOutline className="h-10 w-10 stroke-neutral-700 ease-in-out hover:stroke-neutral-500" />
        </button>
      )}

      <div ref={ref} className="h-full">
        {children}
      </div>
    </dialog>
  );
};

export default Modal;
