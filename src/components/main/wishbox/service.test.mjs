import test from 'node:test'
import assert from 'node:assert/strict'
import { sendWish, validateWish, WISH_ENDPOINT, WISH_SUBJECT } from './service.js'

const draft = { message: '  一個測試願望  ', email: '', accessKey: 'unit-test-only', captchaToken: 'mock-token-only' }
const response = (success, ok = true, status = 200) => ({ ok, status, json: async () => ({ success }) })
const code = expected => error => error.code === expected

test('whitespace wishes, excessive lengths and invalid optional addresses are rejected', () => {
  assert.equal(validateWish(' \n\t ').field, 'message')
  assert.equal(validateWish('a'.repeat(5001)).field, 'message')
  assert.equal(validateWish('願望', 'not-an-email').field, 'email')
  assert.equal(validateWish('願望', 'name@example.com\r\nBcc:x@example.com').field, 'email')
  assert.equal(validateWish('願望', ''), null)
  assert.equal(validateWish('願望', ' name@example.com '), null)
})
test('one JSON request can send a wish without optional email or Reply-To', async () => {
  const calls = []
  const result = await sendWish(draft, { fetchImpl: async (...args) => { calls.push(args); return response(true) } })
  assert.equal(result, true); assert.equal(calls.length, 1)
  const [url, options] = calls[0], body = JSON.parse(options.body)
  assert.equal(url, WISH_ENDPOINT); assert.equal(options.method, 'POST')
  assert.equal(body.subject, WISH_SUBJECT); assert.equal(body.message, '一個測試願望')
  assert.equal(body['h-captcha-response'], draft.captchaToken)
  assert.equal('email' in body, false); assert.equal('replyto' in body, false)
  assert.equal(body.botcheck, false)
})
test('email and Reply-To are included in the same wish request', async () => {
  await sendWish({ ...draft, email: ' visitor@example.com ' }, { fetchImpl: async (_, options) => {
    const body = JSON.parse(options.body)
    assert.equal(body.email, 'visitor@example.com'); assert.equal(body.replyto, body.email)
    assert.equal(body.message, '一個測試願望'); return response(true)
  } })
})
test('no API call for missing key, missing captcha, honeypot or blank wish', async () => {
  let calls = 0
  const fetchImpl = async () => { calls++; return response(true) }
  for (const [patch, expected] of [[{ accessKey: '' }, 'configuration'], [{ captchaToken: '' }, 'captcha'], [{ botcheck: true }, 'blocked'], [{ message: '  ' }, 'validation']]) {
    await assert.rejects(sendWish({ ...draft, ...patch }, { fetchImpl }), code(expected))
  }
  assert.equal(calls, 0)
})
test('success requires both HTTP success and literal API success true', async () => {
  for (const fake of [response(false), response('true'), response(true, false, 400), response(undefined)]) {
    await assert.rejects(sendWish(draft, { fetchImpl: async () => fake }), code('rejected'))
  }
})
test('rate limiting and malformed server responses cannot cause success', async () => {
  await assert.rejects(sendWish(draft, { fetchImpl: async () => response(false, false, 429) }), code('rate-limit'))
  await assert.rejects(sendWish(draft, { fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new Error('invalid JSON') } }) }), code('response'))
})
test('network failure does not mutate the draft or surface raw errors', async () => {
  const input = { ...draft }
  await assert.rejects(sendWish(input, { fetchImpl: async () => { throw new Error('server text that must not be shown') } }), code('network'))
  assert.deepEqual(input, draft)
})
const pending = (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }))
test('timeout aborts request and cannot report success', async () => {
  await assert.rejects(sendWish(draft, { fetchImpl: pending, timeoutMs: 5 }), code('timeout'))
})
test('page unmount cancellation aborts request', async () => {
  const controller = new AbortController()
  const sending = sendWish(draft, { fetchImpl: pending, signal: controller.signal })
  controller.abort()
  await assert.rejects(sending, code('cancelled'))
})
