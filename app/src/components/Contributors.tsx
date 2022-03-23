/** @jsxImportSource @emotion/react */
import { Upwell } from 'api'
import { css } from '@emotion/react/macro'
import { AuthorColorsType } from './ListDocuments'

type Props = {
  upwell: Upwell
  contributors: string[]
  colors: AuthorColorsType
}
export default function Contributors(props: Props) {
  const authors = props.upwell.metadata.getAuthors()
  return (
    <div>
      {props.contributors.map((id) => (
        <div
          css={css`
            overflow: hidden;
            background: white; /* icon background needs a white backdrop to match others because of semi-transparency */

            border-radius: 50%;
          `}
          title={authors[id]}
        >
          <div
            css={css`
              background: ${props.colors[id]?.toString()};
              font-size: 18px;
              line-height: 18px;
              height: 1.5rem;
              width: 1.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
              padding-top: 3px;
            `}
          >
            {authors[id].slice(0, 1)}
          </div>
        </div>
      ))}
    </div>
  )
}
