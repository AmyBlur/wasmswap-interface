import styled from 'styled-components'
import { toast } from 'react-toastify'
import { useRecoilValue } from 'recoil'
import { PlusIcon } from '@heroicons/react/solid'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Dialog, DialogBody } from '../Dialog'
import { Text } from '../Text'
import { LiquidityInput } from '../LiquidityInput'
import { Link } from '../Link'
import { Button } from '../Button'
import { formatTokenName } from 'util/conversion'
import { walletState } from 'state/atoms/walletAtoms'
import { useState } from 'react'
import { getSwapInfo } from 'services/swap'
import { addLiquidity, removeLiquidity } from 'services/liquidity'
import { Spinner } from '../Spinner'
import {
  useInvalidateBalances,
  useTokenBalance,
} from '../../hooks/useTokenBalance'
import { useTokenInfo } from '../../hooks/useTokenInfo'
import { useInvalidateLiquidity, useLiquidity } from '../../hooks/useLiquidity'
import { colorTokens } from '../../util/constants'
import { RemoveLiquidityInput } from '../RemoveLiquidityInput'

export const PoolDialog = ({ isShowing, onRequestClose, tokenInfo }) => {
  const { address, client } = useRecoilValue(walletState)

  const { balance: junoBalance } = useTokenBalance(useTokenInfo('JUNO'))
  const { balance: tokenBalance } = useTokenBalance(tokenInfo)

  const { myLPBalance } = useLiquidity({
    tokenName: tokenInfo.symbol,
    swapAddress: tokenInfo.swap_address,
    address: address,
  })

  const invalidateBalances = useInvalidateBalances()
  const invalidateLiquidity = useInvalidateLiquidity()

  const { data: { token_reserve, native_reserve, lp_token_supply } = {} } =
    useQuery(
      `swapInfo/${tokenInfo.swap_address}`,
      async () => {
        return await getSwapInfo(
          tokenInfo.swap_address,
          process.env.NEXT_PUBLIC_CHAIN_RPC_ENDPOINT
        )
      },
      {
        enabled: Boolean(tokenInfo.swap_address),
      }
    )

  const balanceFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  })

  const queryClient = useQueryClient()
  const {
    isLoading,
    reset: resetAddLiquidityMutation,
    mutate: mutateAddLiquidity,
  } = useMutation(
    async () => {
      if (isAddingLiquidity) {
        return await addLiquidity({
          nativeAmount: Math.floor(tokenAAmount * 1000000),
          nativeDenom: 'ujuno',
          maxToken: Math.floor(tokenBAmount * 1000000 + 5),
          minLiquidity: 0,
          swapAddress: tokenInfo.swap_address,
          senderAddress: address,
          tokenAddress: tokenInfo.token_address,
          client: client,
        })
      } else {
        return await removeLiquidity({
          amount: Math.floor((removeLiquidityPercent * myLPBalance) / 100),
          minNative: 0,
          minToken: 0,
          swapAddress: tokenInfo.swap_address,
          senderAddress: address,
          tokenAddress: tokenInfo.token_address,
          client: client,
        })
      }
    },
    {
      onSuccess() {
        // show toast
        toast.success(`???? ${isAddingLiquidity ? 'Add' : 'Remove'} Successful`, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })

        // close modal
        requestAnimationFrame(onRequestClose)
      },
      onError(error) {
        toast.error(
          `Couldn't ${
            isAddingLiquidity ? 'Add' : 'Remove'
          } liquidity because of: ${error}`,
          {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          }
        )
      },
      onSettled() {
        queryClient.refetchQueries('swapInfo')
        invalidateBalances()
        invalidateLiquidity()
        setTimeout(resetAddLiquidityMutation, 350)
      },
    }
  )

  const [tokenAAmount, setTokenAAmount] = useState(1)
  const [tokenBAmount, setTokenBAmount] = useState(1)

  const handleTokenAAmountChange = (val: number) => {
    setTokenAAmount(val)
    setTokenBAmount((Number(token_reserve) / Number(native_reserve)) * val)
  }

  const handleTokenBAmountChange = (val: number) => {
    setTokenBAmount(val)
    setTokenAAmount((Number(native_reserve) / Number(token_reserve)) * val)
  }

  const [isAddingLiquidity, setAddingLiquidity] = useState(true)
  const [removeLiquidityPercent, setRemoveLiquidityPercent] = useState(0)

  const submitButtonText = isAddingLiquidity
    ? 'Add Liquidity'
    : 'Remove Liquidity'

  return (
    <Dialog isShowing={isShowing} onRequestClose={onRequestClose}>
      <DialogBody>
        <StyledDivForButtons>
          <StyledSwitchButton
            onClick={() => setAddingLiquidity(true)}
            $active={isAddingLiquidity}
          >
            Add
          </StyledSwitchButton>
          <StyledSwitchButton
            onClick={() => setAddingLiquidity(false)}
            $active={!isAddingLiquidity}
          >
            Remove
          </StyledSwitchButton>
        </StyledDivForButtons>

        <StyledTitle
          $hasSubtitle={!isAddingLiquidity}
          type="title"
          variant="normal"
        >
          {isAddingLiquidity ? 'Add' : 'Remove'}{' '}
          {`Juno / ${formatTokenName(tokenInfo.symbol)}`}
        </StyledTitle>

        {!isAddingLiquidity && (
          <StyledSubtitle variant="light">
            Choose a percentage of your liquidity to remove
          </StyledSubtitle>
        )}

        {isAddingLiquidity && (
          <>
            <LiquidityInput
              tokenName="Juno"
              balance={junoBalance ? junoBalance : 0}
              amount={tokenAAmount}
              ratio={50}
              onAmountChange={handleTokenAAmountChange}
            />
            <LiquidityInput
              tokenName={formatTokenName(tokenInfo.symbol)}
              balance={tokenBalance ? tokenBalance : 0}
              amount={tokenBAmount}
              ratio={50}
              onAmountChange={handleTokenBAmountChange}
            />
          </>
        )}

        {!isAddingLiquidity && (
          <RemoveLiquidityInput
            value={removeLiquidityPercent}
            onChangeValue={setRemoveLiquidityPercent}
          />
        )}

        {isAddingLiquidity && (
          <StyledDivForLink>
            <StyledPlusIcon />
            <Link
              color="black"
              variant="normal"
              type="body"
              onClick={() => handleTokenAAmountChange(junoBalance)}
            >
              Add maximum amounts
            </Link>
          </StyledDivForLink>
        )}

        {!isAddingLiquidity && (
          <StyledDivForLiquiditySummary>
            <Text>
              Juno:{' '}
              {balanceFormatter.format(
                ((myLPBalance / +lp_token_supply) * +native_reserve) / 1000000
              )}
            </Text>
            <Text>
              {tokenInfo.symbol}:{' '}
              {balanceFormatter.format(
                ((myLPBalance / +lp_token_supply) * +token_reserve) / 1000000
              )}
            </Text>
          </StyledDivForLiquiditySummary>
        )}

        <StyledButton
          size="humongous"
          onClick={isLoading ? undefined : mutateAddLiquidity}
          disabled={isLoading}
        >
          {isLoading ? <Spinner /> : submitButtonText}
        </StyledButton>
      </DialogBody>
    </Dialog>
  )
}

const StyledTitle = styled(Text)<{ $hasSubtitle: boolean }>`
  padding: ${(p) => (p.$hasSubtitle ? '18px 14px 8px' : '18px 14px')};
`

const StyledSubtitle = styled(Text)`
  padding: 0 14px 42px;
`

const StyledButton = styled(Button)`
  margin: 8px 0 14px;
`

const StyledPlusIcon = styled(PlusIcon)`
  color: ${colorTokens.black};
  width: 24px;
  height: 24px;
  margin-right: 8px;
`

const StyledDivForLink = styled.div`
  padding: 24px 14px;
  display: flex;
  align-items: center;
`

const StyledDivForButtons = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 14px;
`

const StyledSwitchButton = styled(Button).attrs(
  ({ $active, children, ...attrs }) => ({
    ...attrs,
    variant: 'rounded',
    color: $active ? 'black' : 'white',
    children: (
      <Text color={$active ? 'white' : 'black'} type="subtitle" variant="light">
        {children}
      </Text>
    ),
  })
)`
  min-width: 88px;
  margin-right: 4px;
`

const StyledDivForLiquiditySummary = styled.div`
  padding: 12px 14px 16px;
  text-transform: uppercase;
  p + p {
    padding-top: 12px;
  }
`
