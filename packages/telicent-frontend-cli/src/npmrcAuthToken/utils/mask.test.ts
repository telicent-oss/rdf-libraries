import { test, expect } from 'vitest'
import { mask } from './mask.js'

test(`mask`, () => {
  expect(mask('1234123411234')).toMatchInlineSnapshot(`"1234*********"`)
  expect(mask(1234123411234)).toMatchInlineSnapshot(`"1234*********"`)
  expect(mask('12')).toMatchInlineSnapshot(`"12"`)
  expect(mask(12)).toMatchInlineSnapshot(`"12"`)
  expect(mask(null)).toMatchInlineSnapshot(`"null"`)
  expect(mask(true)).toMatchInlineSnapshot(`"true"`)
  // Its dumb
  expect(mask({ key: '1234123411234' })).toMatchInlineSnapshot(
    `"[obj***********"`,
  )
})
