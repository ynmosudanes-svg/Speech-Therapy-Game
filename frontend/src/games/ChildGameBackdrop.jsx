import React from 'react';

const ChildGameBackdrop = ({ previewMode = false }) => {
  const layerClassName = previewMode ? 'absolute inset-0 rounded-[2rem]' : 'fixed inset-0';

  return (
    <div
      className={`${layerClassName} pointer-events-none -z-10 overflow-hidden`}
    >
      <div className="absolute right-[8%] top-[10%] h-56 w-56 rounded-full bg-sky-200/18 blur-[74px]" />
      <div className="absolute bottom-[9%] left-[7%] h-72 w-72 rounded-full bg-cyan-200/16 blur-[92px]" />
      <div className="absolute left-[34%] top-[42%] h-52 w-52 rounded-full bg-sky-100/18 blur-[76px]" />
      <div className="absolute top-[16%] left-[14%] h-20 w-40 rounded-full bg-white/48 blur-[8px]" />
      <div className="absolute bottom-[22%] right-[14%] h-16 w-16 rounded-full bg-cyan-100/22 blur-[4px]" />
      <div className="absolute top-[27%] right-[19%] h-8 w-8 rounded-full bg-sky-100/26 blur-[2px]" />
      <div className="absolute bottom-[16%] left-[23%] h-10 w-10 rounded-full bg-blue-100/26 blur-[2px]" />
    </div>
  );
};

export default ChildGameBackdrop;
