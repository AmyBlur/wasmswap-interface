import React, { HTMLProps, FC } from 'react'
import styled, { css } from 'styled-components'
import { Text } from './Text'
import { colorTokens } from '../util/constants'

export const resetStylesForButton = css`
  text-transform: none;
  -webkit-appearance: button;
  padding: 0;
  border: none;
  outline: none;
  font: inherit;
  color: inherit;
  background: none;
  cursor: pointer;
  user-select: none;
`

type ButtonProps = Omit<HTMLProps<HTMLButtonElement>, 'size'> & {
  variant?: 'primary' | 'rounded'
  size?: 'humongous' | 'medium' | 'small'
}

export const StyledButton = styled.button<ButtonProps>`
  ${resetStylesForButton};
  text-align: center;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  border-radius: ${(p) => (p.variant === 'rounded' ? '18px' : '6px')};
  padding: ${(props: ButtonProps) => {
    switch (props.size) {
      case 'humongous':
        return '24px'
      case 'medium':
        return props.variant === 'rounded' ? '9px 14px' : '12px 14px'
      case 'small':
      default:
        return '5px 12px'
    }
  }};
  width: ${(props: ButtonProps) =>
    props.size === 'humongous' ? '100%' : 'auto'};
  background-color: ${({ disabled, color }) => {
    return disabled
      ? colorTokens.gray
      : colorTokens[color] || color || colorTokens.black
  }};
  cursor: ${({ disabled }) => {
    return disabled ? 'auto' : 'pointer'
  }};

  transition: opacity 0.1s ease-out, background-color 0.15s ease-out;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    opacity: 0.85;
  }
`

export const Button: FC<ButtonProps> = ({
  variant,
  size = 'medium',
  children,
  ...props
}) => (
  <StyledButton variant={variant} size={size} {...props}>
    {typeof children === 'string' ? (
      <Text
        type={size === 'humongous' ? 'heading' : 'body'}
        variant="light"
        color="white"
      >
        {children}
      </Text>
    ) : (
      children
    )}
  </StyledButton>
)
