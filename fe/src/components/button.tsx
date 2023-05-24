'use client';
import classNames from 'classnames';
import { PropsWithChildren } from 'react'

interface ButtonProps extends PropsWithChildren {
    id?: string
    className?: string
    onClick?: () => void
}
export default function Button(props: ButtonProps) {
    const { id, className, children, onClick } = props
    const classes = classNames({
        'button': true,
        [className || '']: !!className
    })
    return (
        <div className={classes} id={id} onClick={() => onClick && onClick()}>
            <div className="button-inner">
                {children}
            </div>
        </div>
    )
}