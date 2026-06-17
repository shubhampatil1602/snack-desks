import Image from "next/image";

export const Logo = () => {
  return (
    <Image
      src='/logo.png'
      alt='snackdesk'
      height={200}
      width={200}
      className='size-8! object-cover'
    />
  );
};
