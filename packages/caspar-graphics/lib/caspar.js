import React from 'react'
import { addCasparMethods, removeCasparMethods } from './utils/caspar-methods'
import lottie from 'lottie-web'

export const States = {
  playing: 'PLAYING',
  paused: 'PAUSED',
  stopped: 'STOPPED'
}

const caspar = {}

const Caspar = React.forwardRef(({ template, name }, ref) => {
  const node = React.useRef()
  const animation = React.useRef()
  const [state, setState] = React.useState(null)
  const [data, setData] = React.useState(null)
  const duration = animation.current?.getDuration(true) || null
  const end = template.lottieData.markers.find(({ cm }) => cm != null)

  const videoLayers = template.lottieData.layers.filter(layer => layer.ty === 9)

  console.log({ videoLayers })

  const log = (message, ...rest) => {
    console.log(`${name || 'caspar'}${message}`)
    rest && rest.length && console.log(rest)
  }

  const createAnimation = (data, autoplay = false) => {
    if (animation.current) {
      animation.current.destroy()
    }

    for (let i = 0, f = 0; i < template.lottieData.layers.length; i++) {
      if (!data || data['f' + f] == null) {
        continue
      }

      if (template.lottieData.layers[i]?.t?.d?.k[0]?.s) {
        template.lottieData.layers[i].t.d.k[0].s.t = data['f' + f]
        f++
      }
    }

    animation.current = lottie.loadAnimation({
      container: node.current,
      renderer: 'svg',
      loop: false,
      autoplay,
      animationData: template.lottieData
    })

    // Stop at end marker.
    if (end && end.tm) {
      animation.current.onEnterFrame = frame => {
        if (frame.currentTime + 0.5 >= end.tm) {
          animation.current.pause()
          animation.current.onEnterFrame = null
        }
      }
    }
  }

  const animateOff = onComplete => {
    if (!animation.current) {
      return
    }

    // No end animation has been specified (no end marker), run the animation
    // backwards at 1.5x speed.
    if (!end?.tm || Math.abs(end.tm - animation.current.currentFrame) >= 0.5) {
      animation.current.setDirection('-1')
      animation.current.setSpeed(1.5)
    }

    animation.current.play()

    animation.current.onComplete = () => {
      animation.current.destroy()
      animation.current = null

      if (onComplete) {
        onComplete()
      }
    }
  }

  // New data.
  React.useEffect(() => {
    if (state === States.playing) {
      animateOff(() => {
        createAnimation(data, true)
      })
    } else {
      createAnimation(data)
    }
  }, [data])

  // Update player.
  React.useEffect(() => {
    // Play
    if (state === States.playing) {
      if (!animation.current) {
        createAnimation()
      }

      animation.current.play()
    }

    // Pause
    if (state === States.paused && animation.current) {
      animation.current.pause()
    }

    // Stop
    if (state === States.stopped) {
      animateOff(() => {
        log('.remove()')
      })
    }
  }, [state])

  // Bind caspar methods.
  React.useLayoutEffect(() => {
    caspar.load = () => {
      log('.load()')
    }

    caspar.update = data => {
      log(`.update(${JSON.stringify(data || {}, null, 2)})`)
      setData(data)
    }

    caspar.play = () => {
      log('.play()')
      setState(States.playing)
    }

    caspar.pause = () => {
      log('.pause()')
      setState(States.paused)
    }

    caspar.stop = () => {
      log('.stop()')
      setState(States.stopped)
    }

    addCasparMethods(caspar)

    return () => {
      removeCasparMethods(caspar)
    }
  }, [])

  React.useImperativeHandle(ref, () => caspar, [caspar])

  return <div ref={node} style={{ height: '100%', width: '100%' }} />
})

export default Caspar
