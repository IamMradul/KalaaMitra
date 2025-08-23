'use client'

import React from 'react'

// Temporary motion wrapper to replace Framer Motion until import issues are resolved
export const motion = {
  div: React.forwardRef<HTMLDivElement, any>((props, ref) => {
    const { initial, animate, whileInView, transition, exit, ...restProps } = props
    return <div ref={ref} {...restProps} />
  }),
  form: React.forwardRef<HTMLFormElement, any>((props, ref) => {
    const { initial, animate, whileInView, transition, exit, ...restProps } = props
    return <form ref={ref} {...restProps} />
  })
}

motion.div.displayName = 'motion.div'
motion.form.displayName = 'motion.form'
