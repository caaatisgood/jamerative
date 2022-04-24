import React from 'react'
import styled from 'styled-components'

export default function Banner() {
  return (
    <StyledWrapper>
      <br />
      <br />
      <br />
      <br />
      <br />
      <h1>🍯 Jamerative</h1>
      <p style={{ fontSize: 32 }}>
        A platform for sharing generative art code with others,<br />
        and earn more by doing so, lived on the blockchain.
      </p>
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  h1 {
    font-size: 96px;
  }
`
