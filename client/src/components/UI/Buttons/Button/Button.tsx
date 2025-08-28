import { ReactNode } from 'react';
import classes from './Button.module.css';

interface Props {
  children: ReactNode;
  click?: any;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const Button = (props: Props): JSX.Element => {
  const { children, click, disabled, style } = props;

  return (
    <button 
      className={classes.Button} 
      onClick={click ? click : () => {}}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
};
