import { useState } from "react";

type QuantityInputProps = {
  initialQuantity: number;
  onUpdate: (qty: number) => void;
};

export function QuantityInput({ initialQuantity, onUpdate }: QuantityInputProps) {
  const [prevInitial, setPrevInitial] = useState(initialQuantity);
  const [val, setVal] = useState(initialQuantity.toString());

  if (initialQuantity !== prevInitial) {
    setPrevInitial(initialQuantity);
    setVal(initialQuantity.toString());
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newVal = e.target.value;
    const num = parseInt(newVal);
    
    // Prevent entering more than 100
    if (!isNaN(num) && num > 100) {
      newVal = "100";
    }

    setVal(newVal);
    
    const finalNum = parseInt(newVal);
    if (!isNaN(finalNum) && finalNum >= 0) {
      onUpdate(finalNum);
    }
  };

  const handleBlur = () => {
    if (val === "" || isNaN(parseInt(val))) {
      onUpdate(0);
      setVal("0");
    }
  };

  return (
    <input
      type='number'
      min={0}
      max={100}
      className='w-full h-full bg-transparent border-none text-center text-sm font-medium focus:outline-none focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
      value={val}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}
