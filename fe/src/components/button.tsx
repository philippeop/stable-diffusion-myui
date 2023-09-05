'use client';
import classNames from 'classnames';
import { PropsWithChildren } from 'react'

interface ButtonProps extends PropsWithChildren {
    id?: string
    className?: string
    title?: string
    onClick?: () => void
}
export default function Button(props: ButtonProps) {
    const { id, className, title, children, onClick } = props
    const classes = classNames({
        'button': true,
        [className || '']: !!className
    })
    return (
        <div className={classes} id={id} title={title} onClick={() => onClick && onClick()}>
            {children}
        </div>
    )
}