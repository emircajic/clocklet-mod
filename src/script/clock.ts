import { __assign } from 'tslib'
import lenientime from 'lenientime/es/core'
import ClockletDial from './dial'
import { ClockletOptions, defaultDefaultOptions }  from './options'
import template from './template.pug'
import { dispatchCustomEvent } from './event';
import { findHourToken, findMinuteToken, findAmpmToken } from './token';
import { setClockletData, getClockletData } from './data';

const hoverable = matchMedia('(hover: none)').matches

export default class ClockletClock {
  container = createClockletElements()
  root      = this.container.firstElementChild as HTMLElement
  plate     = this.root.firstElementChild as HTMLElement
  hour      = new ClockletDial(this.plate.getElementsByClassName('clocklet-dial--hour')[0]   as HTMLElement, 12, value => this.value({ h: value }))
  minute    = new ClockletDial(this.plate.getElementsByClassName('clocklet-dial--minute')[0] as HTMLElement, 60, value => this.value({ m: value }))
  ampm      = this.plate.getElementsByClassName('clocklet-ampm')[0] as HTMLElement
  defaultOptions: ClockletOptions
  input: HTMLInputElement | undefined
  dispatchesInputEvents: boolean | undefined

  constructor(options?: Partial<Readonly<ClockletOptions>>) {
    this.defaultOptions = __assign(Object.create(defaultDefaultOptions), options)
    addEventListener('input', event => event.target === this.input && this.updateHighlight(), true)
    this.root.addEventListener('mousedown', event => event.preventDefault())
    this.ampm.addEventListener('mousedown', () => this.value({ a: getClockletData(this.ampm, 'ampm') === 'pm' ? 'am' : 'pm' }))
    this.root.addEventListener('clocklet.dragstart', () => this.root.classList.add('clocklet--dragging'))
    this.root.addEventListener('clocklet.dragend', () => this.root.classList.remove('clocklet--dragging'))
  }

  public open(input: HTMLInputElement, options?: Partial<Readonly<ClockletOptions>>) {
    const resolvedOptions           = __assign(Object.create(this.defaultOptions), options) as ClockletOptions
    const inputRect                 = input.getBoundingClientRect()
    const { container, root }       = this
    const eventDetail               = { options: resolvedOptions }
    if (dispatchCustomEvent(input, 'clocklet.opening', true, true, eventDetail).defaultPrevented) {
      return
    }
    this.input                      = input
    this.dispatchesInputEvents      = resolvedOptions.dispatchesInputEvents

    setClockletData(root, 'placement', resolvedOptions.placement)
    setClockletData(root, 'alignment', resolvedOptions.alignment)
    setClockletData(root, 'format',    resolvedOptions.format)
    setClockletData(root, 'append-to', resolvedOptions.appendTo)
    root.className                  = 'clocklet clocklet--showing ' + (hoverable ? '' : 'clocklet--hoverable ') + resolvedOptions.className
    if (resolvedOptions.placement === 'top') {
      root.style.top    = ''
      root.style.bottom = '0'
    } else {
      root.style.top    = `${inputRect.height}px`
      root.style.bottom = ''
    }
    if (resolvedOptions.alignment === 'right') {
      root.style.left   = ''
      root.style.right  = `-${inputRect.width}px`
    } else {
      root.style.left   = '0'
      root.style.right  = ''
    }

    container.style.zIndex = resolvedOptions.zIndex !== '' ? resolvedOptions.zIndex as string : (parseInt(getComputedStyle(input).zIndex!, 10) || 0) + 1 as any as string
    if (resolvedOptions.appendTo === 'parent') {
      container.style.position  = 'relative'
      container.style.left      = '0'
      container.style.top       = '0'
      input.parentElement!.insertBefore(container, input)
    } else {
      container.style.position  = 'absolute'
      container.style.left      = document.documentElement.scrollLeft + document.body.scrollLeft + inputRect.left + 'px'
      container.style.top       = document.documentElement.scrollTop  + document.body.scrollTop  + inputRect.top  + 'px'
      if (container.parentElement !== document.body) {
        document.body.appendChild(container)
      }
    }
    this.updateHighlight()
    setTimeout(() => {
      root.classList.remove('clocklet--showing')
      if (this.input) {
        root.classList.add('clocklet--shown')
      }
    })
    dispatchCustomEvent(input, 'clocklet.opened', true, false, eventDetail)
  }

  public close() {
    const input = this.input
    const eventDetail = {}
    if (!input) {
      return
    }
    if (dispatchCustomEvent(input, 'clocklet.closing', true, true, eventDetail).defaultPrevented) {
      input.focus()
      return
    }
    this.input = undefined
    this.root.classList.remove('clocklet--shown')
    dispatchCustomEvent(input, 'clocklet.closed', true, false, eventDetail)
  }

  private value(time: { h?: number | string, m?: number | string, a?: 'am' | 'pm' }) {
    if (!this.input) {
      return
    }
    if (time.a === undefined) {
      time = { h: time.h, m: time.m, a: getClockletData(this.ampm, 'ampm') as 'am' | 'pm' }
    }
    const oldValue = this.input.value
    const _time = lenientime(this.input.value).with(time.a !== undefined ? time : { h: time.h, m: time.m, a: getClockletData(this.ampm, 'ampm') as 'am' | 'pm' })
    const template = getClockletData(this.root, 'format')!
    this.input.value = _time.format(template)
    if (this.input.type === 'text') {
      const token =
        time.h !== undefined ? findHourToken(_time, template) :
        time.m !== undefined ? findMinuteToken(_time, template) :
        time.a !== undefined ? findAmpmToken(_time, template) || findHourToken(_time, template) :
        undefined
      token && this.input.setSelectionRange(token.index, token.index + token.value.length)
    }
    this.dispatchesInputEvents && this.input.value !== oldValue && dispatchCustomEvent(this.input, 'input', true, false, undefined)
  }

  private updateHighlight() {
    if (!this.input) {
      return
    }
    const time = this.input.value ? lenientime(this.input.value) : lenientime.INVALID
    if (time.valid) {
      setClockletData(this.root, 'value', time.HHmm)
      this.hour.value(time.hour % 12)
      this.minute.value(time.minute)
      setClockletData(this.ampm, 'ampm', time.a)
    } else {
      setClockletData(this.root, 'value', '')
      this.hour.value(-1)
      this.minute.value(-1)
      setClockletData(this.ampm, 'ampm', 'am')
    }
    const ampmToken = findAmpmToken(time.valid ? time : lenientime.ZERO, getClockletData(this.root, 'format')!)
    setClockletData(this.ampm, 'ampm-formatted', ampmToken && ampmToken.value || '')
  }
}

function createClockletElements() {
  const element = document.createElement('div')
  element.className = 'clocklet-container'
  element.innerHTML = template
  return element
}

