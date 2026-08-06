import { forwardRef } from "react";

const Eye = forwardRef(function Eye(_props, ref) {
  return (
    <div
      ref={ref}
      className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-cream sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 xl:h-36 xl:w-36"
    >
      <div className="pupil relative h-[64%] w-[64%] rounded-full bg-ink">
        <div className="catchlight absolute left-[18%] top-[16%] h-[28%] w-[28%] rounded-full bg-white/85" />
      </div>
    </div>
  );
});

export default Eye;
