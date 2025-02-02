/** @jsxImportSource @emotion/react */
import { css, SerializedStyles } from '@emotion/react/macro'
import * as React from 'react'
import SelectUnstyled, {
  SelectUnstyledProps,
  selectUnstyledClasses,
} from '@mui/base/SelectUnstyled'
import OptionUnstyled, { optionUnstyledClasses } from '@mui/base/OptionUnstyled'
import PopperUnstyled from '@mui/base/PopperUnstyled'
import { styled } from '@mui/system'
//@ts-ignore
import relativeDate from 'relative-date'
import { DraftMetadata, Upwell } from 'api'
import { InfoText } from './Text'

const blue = {
  100: '#DAECFF',
  200: '#99CCF3',
  400: '#3399FF',
  500: '#007FFF',
  600: '#0072E5',
  900: '#003A75',
}

const grey = {
  50: '#F3F6F9',
  100: '#E7EBF0',
  200: '#E0E3E7',
  300: '#CDD2D7',
  400: '#B2BAC2',
  500: '#A0AAB4',
  600: '#6F7E8C',
  700: '#3E5060',
  800: '#2D3843',
  900: '#1A2027',
}

const HistoryButton = styled('button')(
  ({ theme }) => `
  font-family: inherit;
  font-size: inherit;
  box-sizing: border-box;
  border: none;
  font-size: 30px;
  background: none;
  line-height: 22px;

  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};

  &:hover {
    background: ${theme.palette.mode === 'dark' ? '' : grey[100]};
    border-color: ${theme.palette.mode === 'dark' ? grey[700] : grey[400]};
  }

  &.${selectUnstyledClasses.focusVisible} {
    outline: 3px solid ${theme.palette.mode === 'dark' ? blue[600] : blue[100]};
  }

  &.${selectUnstyledClasses.expanded} {
    &::after {
      transform: rotate(180deg);
    }
  }

  &::after {
    content: '▾';
    float: right;
  }
  `
)
const StyledButton = styled('button')(
  ({ theme }) => `
  font-family: inherit;


  &:disabled {
    opacity: 70%;
    cursor: not-allowed;
    filter: grayscale(40%) brightness(90%);
  }
  font-size: inherit;
  box-sizing: border-box;
  min-width: 280px;
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[800] : grey[300]};
  border-radius: 0.2em;
  padding: 4px 10px 3px;
  text-align: left;
  line-height: 28px;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};

  &:hover {
    background: ${theme.palette.mode === 'dark' ? '' : grey[100]};
    border-color: ${theme.palette.mode === 'dark' ? grey[700] : grey[400]};
  }

  &.${selectUnstyledClasses.focusVisible} {
    outline: 3px solid ${theme.palette.mode === 'dark' ? blue[600] : blue[100]};
  }

  &.${selectUnstyledClasses.expanded} {
    &::after {
      content: '▴';
    }
  }

  &::after {
    content: '▾';
    float: right;
  }
  `
)

const StyledListbox = styled('ul')(
  ({ theme }) => `
  font-family: IBM Plex Sans, sans-serif;
  font-size: 0.875rem;
  box-sizing: border-box;
  padding: 0;
  margin: 10px 0;
  margin-top: 0;
  min-width: 280px;
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[800] : grey[300]};
  border-radius: 0.2em;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  overflow: auto;
  outline: 0px;
  `
)

export const Option = styled(OptionUnstyled)(
  ({ theme }) => `
  list-style: none;
  padding: 12px;
  cursor: default;
  border-bottom: 1px solid ${
    theme.palette.mode === 'dark' ? grey[800] : grey[300]
  };

  &:last-of-type {
    border-bottom: none;
  }

  &.${optionUnstyledClasses.selected} {
    background-color: ${theme.palette.mode === 'dark' ? blue[900] : blue[100]};
    color: ${theme.palette.mode === 'dark' ? blue[100] : blue[900]};
  }

  &.${optionUnstyledClasses.highlighted} {
    /* TODO Setting the highlighted row isn't working (all options are being highlighted?) so disable styling for now*/
    /* background-color: ${
      theme.palette.mode === 'dark' ? grey[800] : grey[100]
    };
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]}; */ 
  }

  &.${optionUnstyledClasses.highlighted}.${optionUnstyledClasses.selected} {
    background-color: ${theme.palette.mode === 'dark' ? blue[900] : blue[100]};
    color: ${theme.palette.mode === 'dark' ? blue[100] : blue[900]};
  }

  &.${optionUnstyledClasses.disabled} {
    color: ${theme.palette.mode === 'dark' ? grey[700] : grey[400]};
  }
  &:hover:not(.${optionUnstyledClasses.disabled}) {
    background-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  }
  `
)

const StyledPopper = styled(PopperUnstyled)`
  z-index: 1;
`

export default function Select<TValue extends {}>(
  props: SelectUnstyledProps<TValue>
) {
  const components: SelectUnstyledProps<TValue>['components'] = Object.assign(
    {
      Root: StyledButton,
      Listbox: StyledListbox,
      Popper: StyledPopper,
    },
    props.components
  )

  return <SelectUnstyled {...props} components={components} />
}

export function HistorySelect<TValue extends {}>(
  props: SelectUnstyledProps<TValue>
) {
  const components: SelectUnstyledProps<TValue>['components'] = Object.assign(
    {
      Root: HistoryButton,
      Listbox: StyledListbox,
      Popper: StyledPopper,
    },
    props.components
  )

  return <SelectUnstyled {...props} components={components} />
}

type DetailedOptionProps = {
  option: DraftMetadata
  changes?: number
  upwell: Upwell
  icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  iconStyles?: SerializedStyles
}

export function DetailedOption({
  option,
  changes,
  upwell,
  icon: Icon,
  iconStyles,
}: DetailedOptionProps) {
  return (
    <Option key={option.id} value={option}>
      <div
        css={css`
          display: grid;
          grid: auto-flow auto/36px auto;
          align-items: baseline;
        `}
      >
        {Icon ? (
          <Icon
            css={css`
              align-self: center;
              ${iconStyles}
            `}
          />
        ) : null}
        {option.message}
        <div />
        <div>
          {changes ? (
            <InfoText
              css={css`
                flex: 0;
                white-space: nowrap;
                text-align: left;
              `}
            >
              {changes} changes
            </InfoText>
          ) : (
            <div></div>
          )}
          <InfoText
            css={css`
              flex: 0;
              white-space: nowrap;
              text-align: left;
            `}
          >
            {relativeDate(new Date(option.edited_at))}
          </InfoText>
        </div>
      </div>
    </Option>
  )
}
