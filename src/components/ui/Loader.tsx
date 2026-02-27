
import styled from "styled-components";

type LoaderProps = {
  size?: number; // px
  fullScreen?: boolean;
};

const Loader = ({ size = 24, fullScreen = false }: LoaderProps) => {
  if (fullScreen) {
    return (
      <FullScreenWrapper>
        <Spinner style={{ width: size, height: size }} />
      </FullScreenWrapper>
    );
  }

  return <Spinner style={{ width: size, height: size }} />;
};

export default Loader;

/* 🔧 Spinner */
const Spinner = styled.div`
  --spinner-border-width: 3px;
  --spinner-color: #10b981; /* emerald-500 */
  --circle-color: #10b98122;
  --speed-of-animation: 1s;

  background: var(--circle-color);
  border-radius: 50%;
  position: relative;

  &::after {
    content: "";
    display: block;
    position: absolute;
    border-radius: 50%;
    inset: 0;
    border: var(--spinner-border-width) solid var(--spinner-color);
    border-left-color: transparent;
    border-right-color: transparent;
    animation: spinny var(--speed-of-animation) linear infinite;
  }

  @keyframes spinny {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

/* 🔧 Full screen overlay */
const FullScreenWrapper = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4); /* slate-900/40 */
  display: grid;
  place-items: center;
  z-index: 9999;
`;